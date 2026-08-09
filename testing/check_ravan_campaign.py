import httpx
import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'Backend'))
from app.core.config import settings

api_key = settings.RAVAN_AGNI_AI


async def test_campaign():
    url = "https://api.ravan.ai/api/v1/campaigns/"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    # Send a dummy payload similar to the frontend
    body = {
        "name": "Test Campaign",
        "agentId": "019f85d4-0222-759d-939e-0f6b91065c94",
        "phoneNumberId": "phone-id-placeholder",
        "fromPhoneNumber": "+918031449343",
        "contactIds": [],
        "schedule": {
            "timezone": "Asia/Kolkata",
            "windowStart": "09:00",
            "windowEnd": "17:00",
            "windowDays": [1, 2, 3, 4, 5],
            "maxConcurrent": 1,
            "retryAttempts": 2,
            "retryGapMin": 30
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=body, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_campaign())
