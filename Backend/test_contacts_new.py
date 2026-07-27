import os
import requests
import json
from dotenv import load_dotenv

load_dotenv(override=True)
api_key = os.environ.get("RAVAN_AGNI_AI")
campaign_id = "019f89f7-ae1d-70c6-b026-5db49f894941"

headers = {"X-Api-Key": api_key, "Accept": "application/json"}

print("--- TEST: FETCH CONTACTS QUERY ---")
url1 = f"https://api.ravan.ai/api/v1/contacts?campaignId={campaign_id}"
resp1 = requests.get(url1, headers=headers)
print(f"Status: {resp1.status_code}")
try:
    print("Response:", json.dumps(resp1.json())[:800])
except Exception:
    print("Raw text:", resp1.text[:500])

print("--- TEST: FETCH OLD ENDPOINT ---")
url2 = f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}/contacts"
resp2 = requests.get(url2, headers=headers)
print(f"Status: {resp2.status_code}")
try:
    print("Response:", json.dumps(resp2.json())[:800])
except Exception:
    print("Raw text:", resp2.text[:500])
