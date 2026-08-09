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
        print(f"[DB] Initial allocated_credits: {current_credits}")
        
    except Exception as e:
        print(f"DB Error: {e}")
        return

    # 2. Update credits to 500
    print(f"\n--- Emulating Admin Panel Update for User ID {user_id} ---")
    try:
        cursor.execute("UPDATE \"user\" SET allocated_credits = 500 WHERE id = %s", (user_id,))
        conn.commit()
        print(f"[DB] Update successful.")
    except Exception as e:
        print(f"DB Update Error: {e}")
        
    # 3. Emulate the cache invalidation that happens in the endpoint
    print(f"\n--- Emulating Redis Cache Invalidation ---")
    try:
        asyncio.run(delete_cache("admin_global_users"))
        asyncio.run(delete_cache(f"user_auth_profile_{USER_EMAIL}"))
        print("[Redis] Cache invalidation executed via asyncio.run()")
    except Exception as e:
        print(f"[Redis] Error during cache invalidation: {e}")

    # 4. Check DB again
    cursor.execute("SELECT allocated_credits FROM \"user\" WHERE id = %s", (user_id,))
    final_credits = cursor.fetchone()[0]
    print(f"\n[DB] Final allocated_credits: {final_credits}")

if __name__ == "__main__":
    test_credit_assignment()
