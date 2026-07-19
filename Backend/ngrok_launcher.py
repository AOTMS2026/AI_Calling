import subprocess
import time
import requests
import json

# Start ngrok natively
print("Spinning up ngrok tunnel on port 8000...")
proc = subprocess.Popen(["npx", "ngrok", "http", "8000"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)

# Wait for tunnel connection
time.sleep(5)

try:
    res = requests.get("http://127.0.0.1:4040/api/tunnels")
    tunnels = res.json().get("tunnels", [])
    if not tunnels:
        print("NGROK_AUTH_ERROR: Ngrok started but no tunnels active. Authentication token likely required.")
    else:
        for t in tunnels:
            if t["proto"] == "https":
                ngrok_url = t["public_url"]
                wss_url = ngrok_url.replace("https://", "wss://") + "/ai-caller/stream"
                print("\n==============================================")
                print(f"Generated Secure Ngrok Domain: {ngrok_url}")
                print(f"Final WebSocket Stream URL: {wss_url}")
                print("==============================================\n")
except Exception as e:
    print(f"NGROK_CRITICAL_FAILURE: {str(e)}")

# Don't kill proc so the tunnel remains open for the user
