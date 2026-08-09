import requests
import psycopg
import json
import os
import asyncio
import sys

# Append Backend to path to allow importing redis_client
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'Backend'))
from app.core.redis_client import delete_cache

# Assuming the backend is running on localhost:8000
BASE_URL = "https://www.aotms.com"
USER_EMAIL = "ramanadhamjayaveer@gmail.com"
DB_URL = "postgresql://neondb_owner:npg_NTJ9lv6cZuiL@ep-muddy-bonus-ayb4w3ar.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"

def test_credit_assignment():
    print(f"--- Starting Credit Assignment Test for {USER_EMAIL} ---")
    
    # 1. Connect to DB and check current credits directly
    try:
        conn = psycopg.connect(DB_URL)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, allocated_credits FROM \"user\" WHERE email = %s", (USER_EMAIL,))
        user_row = cursor.fetchone()
        
        if not user_row:
            print("User not found in DB!")
            return
            
        user_id, current_credits = user_row
        print(f"[DB] Initial allocated_credits limit: {current_credits}")
        
        # Check their consumed cost
        cursor.execute("SELECT total_cost FROM dashboardmetrics WHERE agent_id = (SELECT ravan_agent_id FROM \"user\" WHERE id = %s)", (user_id,))
        cost_row = cursor.fetchone()
        consumed_cost = cost_row[0] if cost_row else 0.0
        print(f"[DB] Current consumed total_cost: {consumed_cost}")
        print(f"[Math] Remaining Credits = {current_credits} - {consumed_cost} = {current_credits - consumed_cost}")
        
    except Exception as e:
        print(f"DB Error: {e}")
        return

    # 2. Update credits based on admin input
    print(f"\n--- Emulating Admin Panel Update for User ID {user_id} ---")
    try:
        admin_input = input("Enter the number of credits to assign: ")
        target_credits = float(admin_input)
        
        cursor.execute("UPDATE \"user\" SET allocated_credits = %s WHERE id = %s", (target_credits, user_id))
        conn.commit()
        print(f"[DB] Successfully updated allocated_credits to {target_credits}.")
    except Exception as e:
        print(f"DB Update Error: {e}")
        
    # 3. Emulate the cache invalidation that happens in the endpoint
    print(f"\n--- Emulating Redis Cache Invalidation ---")
    async def invalidate_caches():
        await delete_cache("admin_global_users")
        await delete_cache(f"user_auth_profile_{USER_EMAIL}")
        
    try:
        asyncio.run(invalidate_caches())
        print("[Redis] Cache invalidation executed securely via asyncio.run()")
    except Exception as e:
        print(f"[Redis] Error during cache invalidation: {e}")

    # 4. Check DB again
    cursor.execute("SELECT allocated_credits FROM \"user\" WHERE id = %s", (user_id,))
    final_credits = cursor.fetchone()[0]
    print(f"\n[DB] Final allocated_credits: {final_credits}")

if __name__ == "__main__":
    test_credit_assignment()
