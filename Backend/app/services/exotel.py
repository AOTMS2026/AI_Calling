import requests
from requests.auth import HTTPBasicAuth
from app.core.config import settings

class ExotelService:
    def __init__(self):
        self.sid = settings.EXOTEL_SID
        self.api_key = settings.EXOTEL_API_KEY
        self.token = settings.EXOTEL_TOKEN
        self.caller_id = settings.EXOTEL_CALLER_ID
        self.webhook_url = settings.EXOTEL_WEBHOOK_URL
        self.base_url = f"https://api.exotel.com/v1/Accounts/{self.sid}/Calls/connect.json"

    def trigger_outbound_call(self, customer_phone: str, campaign_id: int):
        """
        Triggers an outbound call via Exotel.
        For Phase 4, we simply dial the customer and register the webhook to track state.
        Phase 5 (Sarvam AI) will inject stream URLs here later.
        """
        try:
            # Clean customer phone to ensure E.164 or basic ten digit compliance depending on region
            # We'll just strip non-digits. (Assuming India +91 is implicitly handled by Exotel if 10 digits)
            clean_phone = ''.join(filter(str.isdigit, customer_phone))
            
            data = {
                "From": clean_phone,
                "CallerId": self.caller_id,
                "StatusCallback": f"{self.webhook_url}/api/campaigns/exotel-webhook",
                "StatusCallbackEvents[0]": "terminal",
                "StatusCallbackEvents[1]": "answered",
                "CustomField": str(campaign_id) if campaign_id else "direct_call"
            }
            
            # Since we don't have Sarvam or an Applet yet, we will just use a dummy URL so Exotel doesn't reject it
            # In Phase 5, this will be replaced with our AI Stream Endpoint
            data["Url"] = "http://my.exotel.com/{}/dummy_flow".format(self.sid)

            response = requests.post(
                self.base_url,
                auth=HTTPBasicAuth(self.api_key, self.token),
                data=data,
                timeout=10
            )

            response.raise_for_status()
            res_json = response.json()
            call_info = res_json.get("Call", {})
            return {
                "success": True,
                "vendor_call_sid": call_info.get("Sid"),
                "status": call_info.get("Status")
            }

        except Exception as e:
            # We capture standard errors (e.g. 401 Unauthorized, 400 Bad Request)
            print(f"Exotel API Error: {e}")
            return {
                "success": False,
                "error": str(e)
            }

exotel_client = ExotelService()
