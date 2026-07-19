import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv
import os
import json

load_dotenv("c:/Users/raman/Videos/AI_Calling/Backend/.env")

sid = os.getenv("EXOTEL_SID")
api_key = os.getenv("EXOTEL_API_KEY")
token = os.getenv("EXOTEL_TOKEN")
caller_id = os.getenv("EXOTEL_CALLER_ID")

url = f"https://api.exotel.com/v1/Accounts/{sid}/Calls/connect.json"
data = {
    "From": "8121016848",
    "CallerId": caller_id,
    "Url": "http://my.exotel.com/aotms1/dummy_flow"
}

res = requests.post(url, auth=HTTPBasicAuth(api_key, token), data=data)

output = {
    "target_url": url,
    "status_code": res.status_code,
    "response_text": res.text
}

with open("debug.json", "w", encoding="utf-8") as f:
    json.dump(output, f)
