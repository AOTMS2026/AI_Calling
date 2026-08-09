from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import init_db
from app.api import contacts, campaigns, calls, prompts, agents, organizations, appointments, todos, whatsapp, dashboard, phone_numbers
from app.Authentication import auth
import asyncio

app = FastAPI(
    title="AI Calling SaaS API",
    description="Backend API for AI Calling SaaS platform",
    version="1.0.0"
)

# Global WebSocket Client Manager
ws_clients = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    ws_clients.append(websocket)
    try:
        while True:
            # We just hold the connection
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in ws_clients:
            ws_clients.remove(websocket)

async def notify_all_clients(message: str = "update"):
    """Server-Sent Dispatch trigger explicitly dropping client-side polling"""
    for client in list(ws_clients):
        try:
            await client.send_text(message)
        except Exception:
            if client in ws_clients:
                ws_clients.remove(client)

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(contacts.router)
app.include_router(campaigns.router)
app.include_router(calls.router)
app.include_router(prompts.router)
app.include_router(agents.router)
app.include_router(organizations.router)

app.include_router(appointments.router)
app.include_router(todos.router)
app.include_router(whatsapp.router)
app.include_router(dashboard.router)
app.include_router(phone_numbers.router)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Calling SaaS API"}
