import json
import os
import httpx
from datetime import datetime
from typing import Optional
from sqlmodel import Session, select
from fastapi import BackgroundTasks
from app.models.domain import CallRecord, DashboardMetrics
from app.database.connection import engine
from dateutil import parser

async def process_post_call_webhook(session_data: dict, agent_id: Optional[str] = None):
    """
    Saves a completed call to the database.
    Calculates cost based on Ravan credits_used * 7.
    Updates the CallRecord table (upserting by call_id).
    Optionally invalidates dashboard caches.
    """
    call_id = session_data.get("id")
    if not call_id:
        return None

    determined_agent_id = agent_id
    if not determined_agent_id:
        determined_agent_id = session_data.get("agentId") or session_data.get("agent_id")

    # Extract time
    started_at_str = session_data.get("startedAt") or session_data.get("started_at")
    ended_at_str = session_data.get("endedAt") or session_data.get("ended_at")
    started_at = parser.parse(started_at_str) if started_at_str else None
    ended_at = parser.parse(ended_at_str) if ended_at_str else None

    # Calculate Costs Native to requirement: cost = credits_used * 7
    raw_credits_used = float(session_data.get("costTotal") or session_data.get("cost_total") or 0.0)
    calculated_cost = round(raw_credits_used * 7.0, 4)
    duration_sec = int(session_data.get("durationSec") or session_data.get("duration_sec") or 0)

    with Session(engine) as db:
        # 1. Upsert Call Record
        record = db.exec(select(CallRecord).where(CallRecord.call_id == call_id)).first()
        is_new = False
        if not record:
            record = CallRecord(call_id=call_id)
            is_new = True
            db.add(record)

        # Map base fields
        record.agent_id = determined_agent_id or session_data.get("agentId") or session_data.get("agent_id")
        record.agent_name = session_data.get("agentName") or session_data.get("agent_name")
        record.caller_number = session_data.get("callerNumber") or session_data.get("caller_number")
        record.callee_number = session_data.get("calleeNumber") or session_data.get("callee_number")
        record.caller_name = session_data.get("callerName") or session_data.get("caller_name")
        record.channel = session_data.get("channel")
        record.status = str(session_data.get("status") or "pending").lower()
        record.duration_sec = duration_sec
        record.credits_used = round(raw_credits_used, 4)
        record.cost = calculated_cost
        
        # Meta analysis & transcripts
        post_analysis = session_data.get("postCallAnalysisResult") or session_data.get("post_call_analysis_result") or {}
        if post_analysis:
            record.summary = post_analysis.get("summary", record.summary)
        # Ravan sometimes provides summary in root level
        if session_data.get("summary"):
            record.summary = session_data.get("summary")
            
        # Transcripts check. Normalize nested role/content message structures to top level.
        transcripts = session_data.get("transcripts")
        if transcripts:
            normalized_transcripts = []
            for item in transcripts:
                if isinstance(item, dict):
                    new_item = dict(item)
                    msg = item.get("message")
                    if isinstance(msg, dict):
                        if "role" not in new_item and "role" in msg:
                            new_item["role"] = msg["role"]
                        if "content" not in new_item and "content" in msg:
                            new_item["content"] = msg["content"]
                    normalized_transcripts.append(new_item)
                else:
                    normalized_transcripts.append(item)
            record.transcript = json.dumps(normalized_transcripts)

        record.recording_url = session_data.get("recordingUrl") or session_data.get("recording_url")
        record.disconnect_reason = session_data.get("disconnectReason") or session_data.get("disconnect_reason")
        record.sentiment = session_data.get("sentiment")
        record.error_message = session_data.get("errorMessage") or session_data.get("error_message")
        
        metadata = session_data.get("metadata") or {}
        record.metadata_json = json.dumps(metadata)
        
        record.started_at = started_at
        record.ended_at = ended_at
        record.updated_at = datetime.utcnow()
        if is_new:
            record.created_at = datetime.utcnow()

        db.commit()
        db.refresh(record)

        # 2. Additive Dashboard Metrics Strategy
        # "If new usage arrives, update total cost instead of overwriting."
        if determined_agent_id:
            all_records = db.exec(select(CallRecord).where(CallRecord.agent_id == determined_agent_id)).all()
            
            metric = db.exec(select(DashboardMetrics).where(DashboardMetrics.agent_id == determined_agent_id)).first()
            if not metric:
                metric = DashboardMetrics(agent_id=determined_agent_id)
                db.add(metric)
            
            total_calls = len(all_records)
            success_calls = sum(1 for r in all_records if r.status in ["completed", "ended", "success"])
            failed_calls = sum(1 for r in all_records if r.status in ["failed", "no_answer", "error"])
            total_cost = sum(r.cost for r in all_records)
            total_dur = sum(r.duration_sec for r in all_records)
            
            metric.total_calls = total_calls
            metric.success_calls = success_calls
            metric.failed_calls = failed_calls
            metric.total_cost = round(total_cost, 4)
            metric.total_duration_sec = total_dur
            metric.success_rate = round((success_calls / total_calls * 100), 2) if total_calls > 0 else 0.0
            metric.last_updated = datetime.utcnow()
            
            db.commit()

        try:
            from app.main import notify_all_clients
            import asyncio
            # Offload push to prevent blocking
            asyncio.create_task(notify_all_clients("update"))
        except Exception as e:
            print("WS Notify skipped:", e)

        return record
