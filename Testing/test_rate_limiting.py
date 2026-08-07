import uuid
import httpx
import asyncio
from app.core.redis_client import redis_client

def test_auth_rate_limiting_lockout(base_url):
    asyncio.run(run_test_auth_rate_limiting_lockout(base_url))

async def run_test_auth_rate_limiting_lockout(base_url):
    unique_id = uuid.uuid4().hex[:8]
    email = f"locked_user_{unique_id}@example.com"
    
    login_payload = {
        "email": email,
        "password": "WrongPassword123!"
    }
    
    # 1. Trigger first 4 failed attempts. They should return 401.
    for i in range(1, 5):
        resp = httpx.post(f"{base_url}/auth/login", json=login_payload)
        assert resp.status_code == 401, f"Expected 401 for failed attempt {i}, got {resp.status_code}"
        
        data = resp.json()
        assert "Invalid Credentials" in data["detail"]
        
    # 2. The 5th attempt must trigger the 429 Rate Limit lockout response.
    lockout_resp = httpx.post(f"{base_url}/auth/login", json=login_payload)
    assert lockout_resp.status_code == 429, f"Expected 429 Lockout on 5th attempt, got {lockout_resp.status_code}"
    
    lockout_data = lockout_resp.json()
    assert "Account locked" in lockout_data["detail"] or "Security Alert" in lockout_data["detail"]
    
    # Can also verify that correct password attempt is blocked during lockout
    correct_payload = {
        "email": email,
        "password": "CorrectPassword123!"
    }
    blocked_resp = httpx.post(f"{base_url}/auth/login", json=correct_payload)
    assert blocked_resp.status_code == 429, "Correct password should be rejected with 429 during lockout"
    
    # 3. Cleanup: Delete attempts and lockouts in Redis to make the test stateless
    email_key = email.lower()
    await redis_client.delete(f"attempts::{email_key}")
    await redis_client.delete(f"lockout::{email_key}")
    
    # Confirm it's unlocked by verifying it doesn't return 429 anymore (returns 401 instead for wrong pwd)
    unlocked_resp = httpx.post(f"{base_url}/auth/login", json=login_payload)
    assert unlocked_resp.status_code == 401, "Should return 401 again after Redis cleanup"

