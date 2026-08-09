#!/usr/bin/env python3
import os
import sys
import time
import random
import string
import argparse
import requests
from dotenv import load_dotenv

# Try importing psycopg for postgres connection, fallback gracefully if not installed
try:
    import psycopg
except ImportError:
    psycopg = None

# Try importing playwright for browser testing, fallback gracefully if not installed
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None

# Constants & Configurations
DEFAULT_TEST_EMAIL = "yantirababu@gmail.com"
DEFAULT_TEST_PASSWORD = "Jayaveer!@#1837"
DEFAULT_BASE_URL = "https://www.aotms.com"

def get_db_url(base_url):
    """Tries to find the DATABASE_URL from environment or local .env file matching target base URL."""
    # 1. If production target, prioritize Neon DB URL directly
    if 'aotms.com' in base_url or 'academyoftechmasters.com' in base_url:
        return "postgresql://neondb_owner:npg_NTJ9lv6cZuiL@ep-muddy-bonus-ayb4w3ar.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"

    # 2. Check direct env variable
    url = os.getenv("DATABASE_URL")
    if url:
        return url

    # 3. Check Backend/.env
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(base_dir, 'Backend', '.env')
    
    if os.path.exists(env_path):
        load_dotenv(env_path)
        url = os.getenv("DATABASE_URL")
        if url:
            return url
            
        try:
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("DATABASE_URL="):
                        temp_url = line.split("=", 1)[1].strip("'\"")
                        if temp_url:
                            return temp_url
                    # Look for raw Neon connection string line
                    if "neon.tech" in line and not line.startswith("#") and "postgresql" in line:
                        return line.strip("'\"")
        except Exception:
            pass

    # 4. Fallback to production NEON DB URL
    return "postgresql://neondb_owner:npg_NTJ9lv6cZuiL@ep-muddy-bonus-ayb4w3ar.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"

def resolve_api_base_url(base_url):
    """Maps frontend base URL to backend base URL."""
    base_url = base_url.rstrip('/')
    if 'localhost:5173' in base_url or '127.0.0.1:5173' in base_url:
        return "http://localhost:8000"
    elif 'localhost:8000' in base_url or '127.0.0.1:8000' in base_url:
        return base_url
    elif 'aotms.com' in base_url or 'academyoftechmasters.com' in base_url:
        return "https://ai-calling-7h7q.onrender.com"
    elif 'onrender.com' in base_url:
        return base_url
    else:
        return base_url

def cleanup_user_from_db(email, db_url):
    """Deletes the test user and associated OTP records so registration can be repeated."""
    if not psycopg:
        print("⚠️ psycopg is not installed. Skipping database cleanup.")
        return False
        
    clean_url = db_url.replace("postgresql+psycopg://", "postgresql://")
    try:
        with psycopg.connect(clean_url) as conn:
            with conn.cursor() as cur:
                # Get the user ID
                cur.execute('SELECT id FROM "user" WHERE email = %s', (email,))
                row = cur.fetchone()
                if row:
                    user_id = row[0]
                    # 1. Delete todo activities and todos
                    try:
                        cur.execute('DELETE FROM todoactivity WHERE todo_id IN (SELECT id FROM todo WHERE user_id = %s)', (user_id,))
                        cur.execute('DELETE FROM todo WHERE user_id = %s', (user_id,))
                    except Exception:
                        pass
                    # 2. Delete calls linked to user campaigns
                    try:
                        cur.execute('DELETE FROM call WHERE campaign_id IN (SELECT id FROM campaign WHERE user_id = %s)', (user_id,))
                    except Exception:
                        pass
                    # 3. Delete whatsapp messages and whatsapp campaigns
                    try:
                        cur.execute('DELETE FROM whatsappmessage WHERE user_id = %s', (user_id,))
                        cur.execute('DELETE FROM whatsappcampaign WHERE user_id = %s', (user_id,))
                    except Exception:
                        pass
                    # 4. Delete whatsapp templates, groups, import logs
                    try:
                        cur.execute('DELETE FROM whatsapptemplate WHERE user_id = %s', (user_id,))
                        cur.execute('DELETE FROM whatsappgroup WHERE user_id = %s', (user_id,))
                        cur.execute('DELETE FROM whatsappimportlog WHERE user_id = %s', (user_id,))
                    except Exception:
                        pass
                    # 5. Delete OTP codes
                    cur.execute('DELETE FROM otp WHERE user_id = %s', (user_id,))
                    # 6. Delete other assignments & entities
                    cur.execute('DELETE FROM campaign WHERE user_id = %s', (user_id,))
                    cur.execute('DELETE FROM purchasedphonenumber WHERE user_id = %s', (user_id,))
                    cur.execute('DELETE FROM assign_agents WHERE user_id = %s', (user_id,))
                    cur.execute('DELETE FROM assign_campaigns WHERE user_id = %s', (user_id,))
                    # 7. Delete the user
                    cur.execute('DELETE FROM "user" WHERE id = %s', (user_id,))
                    conn.commit()
                    print(f"🧹 Database Cleaned: Existing user '{email}' and all related records removed successfully.")
                    return True
                else:
                    print(f"ℹ️ Pre-test Cleanup: User '{email}' does not exist in database yet.")
                    return True
    except Exception as e:
        print(f"⚠️ Pre-test clean up skipped (could not delete existing user): {e}")
        return False

def get_latest_otp_from_db(email, db_url):
    """Retrieves the latest unused OTP code for the user email from the Postgres database."""
    if not psycopg:
        raise RuntimeError("psycopg package is required to connect to Postgres DB & retrieve OTP.")
        
    clean_url = db_url.replace("postgresql+psycopg://", "postgresql://")
    # Add a short retry delay to allow the background task on the backend to commit the OTP
    for attempt in range(5):
        try:
            with psycopg.connect(clean_url) as conn:
                with conn.cursor() as cur:
                    cur.execute('SELECT id FROM "user" WHERE email = %s', (email,))
                    row = cur.fetchone()
                    if not row:
                        time.sleep(1.5)
                        continue
                    user_id = row[0]
                    
                    cur.execute(
                        'SELECT code FROM otp WHERE user_id = %s AND is_used = FALSE ORDER BY id DESC LIMIT 1',
                        (user_id,)
                    )
                    otp_row = cur.fetchone()
                    if otp_row:
                        return otp_row[0]
            time.sleep(1.5)
        except Exception as e:
            print(f"⏳ Waiting for OTP in database... (Attempt {attempt+1}/5) details: {e}")
            time.sleep(1.5)
            
    raise RuntimeError(f"Could not retrieve unused OTP from database for {email}.")

def generate_random_user():
    """Generates random registration data."""
    rand_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    name = f"Test User {rand_suffix.upper()}"
    email = f"jayaveer_test_{rand_suffix}@gmail.com"
    # Clean 10 digit phone number (strictly numbers)
    phone = "9" + "".join(random.choices(string.digits, k=9))
    return name, email, phone

def run_api_authentication_test(base_url, name, email, phone, password, db_url):
    """Tests the Auth Flow (Registration, Verification, and Login) directly using API calls."""
    print("\n--- ⚡ STARTING API AUTH FLOW INTEGRATION TEST ---")
    
    api_url = resolve_api_base_url(base_url)
    print(f"🔗 API Endpoint Base: {api_url}")
    
    # Step 1: Register
    print(f"Step 1: Registering User '{name}' ({email}) via POST /auth/register...")
    reg_payload = {
        "name": name,
        "email": email,
        "phone": phone,
        "password": password,
        "confirm_password": password
    }
    
    try:
        response = requests.post(f"{api_url}/auth/register", json=reg_payload)
        print(f"📥 Register response ({response.status_code}): {response.text}")
        if response.status_code != 200:
            print("❌ Registration Failed.")
            return False
    except Exception as e:
        print(f"❌ Failed to reach registration API: {e}")
        return False
        
    # Step 2: Fetch OTP
    print("Step 2: Retrieving OTP verification code from database...")
    try:
        otp_code = get_latest_otp_from_db(email, db_url)
        print(f"🔑 Retracted Verification OTP: {otp_code}")
    except Exception as e:
        print(f"❌ Failed to fetch OTP: {e}")
        return False
        
    # Step 3: Verify OTP
    print(f"Step 3: Verification OTP '{otp_code}' via POST /auth/verify-otp...")
    verify_payload = {
        "email": email,
        "code": otp_code
    }
    try:
        response = requests.post(f"{api_url}/auth/verify-otp", json=verify_payload)
        print(f"📥 Verification response ({response.status_code}): {response.text}")
        if response.status_code != 200:
            print("❌ OTP Verification Failed.")
            return False
    except Exception as e:
        print(f"❌ Failed to reach OTP verification API: {e}")
        return False
        
    # Step 4: Login
    print(f"Step 4: Authenticating / Log in via POST /auth/login...")
    login_payload = {
        "email": email,
        "password": password
    }
    try:
        response = requests.post(f"{api_url}/auth/login", json=login_payload)
        print(f"📥 Login response ({response.status_code}): {response.text[:200]}...")
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                print("✅ API Authentication test completed successfully!")
                return True
        print("❌ Login Failed.")
        return False
    except Exception as e:
        print(f"❌ Failed to reach login API: {e}")
        return False

def run_browser_automation_test(base_url, name, email, phone, password, db_url, headless=True):
    """Test login and register by automating browser layout actions using Playwright."""
    if not sync_playwright:
        print("❌ Playwright is not installed. Please run: pip install playwright && playwright install")
        return False
        
    print("\n--- 📱 STARTING BROWSER AUTOMATION FLOW TEST ---")
    print(f"🔗 Target App URL: {base_url}")
    
    with sync_playwright() as p:
        # Launch Chromium browser
        browser = p.chromium.launch(headless=headless)
        page = browser.new_page()
        
        # Step 1: Fill Registration Form
        print(f"Step 1: Navigating to {base_url}/register...")
        page.goto(f"{base_url}/register")
        
        print("Filling out user signup fields...")
        page.locator('input[name="name"]').fill(name)
        page.locator('input[name="phone"]').fill(phone)
        page.locator('input[name="email"]').fill(email)
        page.locator('input[name="password"]').fill(password)
        page.locator('input[name="confirm_password"]').fill(password)
        
        print("Submitting registration form...")
        page.click('button[type="submit"]')
        
        # Step 2: Retrieve OTP and verify
        print("Step 2: Waiting for OTP verification page to load...")
        try:
            page.wait_for_url("**/verify-otp", timeout=12000)
            print("OTP Page loaded successfully.")
        except Exception as e:
            # Check for form validation errors or backend errors displayed on page
            error_elements = page.locator('span.text-red-500, div.text-red-650, div.bg-red-50, div.bg-red-50\/80').all()
            on_page_errors = []
            for el in error_elements:
                try:
                    txt = el.inner_text().strip()
                    if txt and txt not in on_page_errors:
                        on_page_errors.append(txt)
                except Exception:
                    pass
            if on_page_errors:
                print("❌ Registration failed with visible error messages:")
                for msg in on_page_errors:
                    print(f"   -> {msg}")
            else:
                print("❌ Registration timed out without displaying any known error banner.")
                print(f"   Current URL is: {page.url}")
                # Print body snippet
                try:
                    body_text = page.locator('body').inner_text().strip()
                    print(f"   On-page content snippet:\n{body_text[:500]}")
                except Exception:
                    pass
            browser.close()
            return False
        
        print("Fetching signup OTP code from the Postgres database...")
        try:
            otp_code = get_latest_otp_from_db(email, db_url)
            print(f"🔑 Successfully fetched OTP: {otp_code}")
        except Exception as e:
            print(f"❌ DB Retrieval Error: {e}")
            browser.close()
            return False
            
        print("Typing 6-digit OTP code into inputs...")
        # Since it auto-focuses, type character by character
        for i, char in enumerate(otp_code):
            page.locator('input[type="text"]').nth(i).fill(char)
            
        print("Confirming registration OTP submission...")
        page.click('button[type="submit"]')
        
        # Step 3: Login Redirect & Dashboard Verification
        print("Step 3: Checking redirect to Dashboard...")
        # Verification code redirect takes ~1.8 seconds inside OtpVerification.tsx
        page.wait_for_url("**/dashboard", timeout=8000)
        print("🎉 Successfully routed to dashboard page!")
        
        # Log out or sign out to perform an explicit login page test
        print("Step 4: Logging out to test the manual Login page (/login)...")
        # Navigate to /login directly to verify login flow
        page.goto(f"{base_url}/login")
        page.wait_for_url("**/login")
        
        print(f"Logging in with: {email} / {password}...")
        page.locator('input[type="email"]').fill(email)
        page.locator('input[type="password"]').fill(password)
        page.click('button[type="submit"]')
        
        # Wait for redirect back to dashboard
        page.wait_for_url("**/dashboard", timeout=8000)
        print("🎉 Dashboard loaded after manual Login!")
        
        print("✅ Browser-based authentication test completed successfully!")
        browser.close()
        return True

def main():
    parser = argparse.ArgumentParser(description="AOTMS Authentication Test Automation Script")
    parser.add_argument("--url", default=DEFAULT_BASE_URL, help=f"Target web application base URL (default: {DEFAULT_BASE_URL})")
    parser.add_argument("--email", default=DEFAULT_TEST_EMAIL, help=f"Email for test account (default: {DEFAULT_TEST_EMAIL})")
    parser.add_argument("--password", default=DEFAULT_TEST_PASSWORD, help=f"Password for test account")
    parser.add_argument("--random", action="store_true", help="Generate a random dynamic signup user email and phone instead")
    parser.add_argument("--mode", choices=["api", "browser", "both"], default="browser", help="Testing technique (default: browser)")
    parser.add_argument("--headless", action="store_true", help="Run browser testing in headless mode (without visible Chrome window)")
    
    args = parser.parse_args()
    
    # 1. Setup User account details
    if args.random:
        name, email, phone = generate_random_user()
    else:
        name = "Jayaveer AOTMS Tester"
        email = args.email
        phone = "9876543210" # default 10-digit number
    
    password = args.password
    
    # 2. Get DB connection details
    db_url = get_db_url(args.url)
    
    print("====================================================")
    print("      AOTMS ACCOUNT REGISTRATION & LOGIN TESTER     ")
    print("====================================================")
    print(f"🎯 Target URL       : {args.url}")
    print(f"👤 Account Name      : {name}")
    print(f"📧 Account Email     : {email}")
    print(f"📱 Account Phone     : {phone}")
    print(f"🔑 Account Password  : {password}")
    print(f"⚙️ Test Mode         : {args.mode.upper()}")
    print("====================================================")
    
    # 3. Clean up the database first
    if not args.random:
        cleanup_user_from_db(email, db_url)
        
    api_success = True
    browser_success = True
    
    # 4. Execute Selected Mode
    if args.mode in ["api", "both"]:
        api_success = run_api_authentication_test(args.url, name, email, phone, password, db_url)
        
    if args.mode in ["browser", "both"]:
        global sync_playwright
        if not sync_playwright:
            print("⚠️ Playwright not detected. Installing dependencies for browser mode...")
            import subprocess
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright"])
                subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
                from playwright.sync_api import sync_playwright
                print("✅ Playwright and Chromium installed successfully!")
            except Exception as e:
                print(f"❌ Failed to auto-install playwright: {e}")
                print("💡 Run: pip install playwright && playwright install")
                sys.exit(1)

        # Clear database again if mode is 'both' to register user a second time in browser
        if args.mode == "both" and not args.random:
            cleanup_user_from_db(email, db_url)
            
        browser_success = run_browser_automation_test(args.url, name, email, phone, password, db_url, headless=args.headless)
        
    # 5. Summary Report
    print("\n================ TEST SUMMARY ====================")
    if args.mode in ["api", "both"]:
        print(f"API Mode:     {'✅ PASSED' if api_success else '❌ FAILED'}")
    if args.mode in ["browser", "both"]:
        print(f"Browser Mode: {'✅ PASSED' if browser_success else '❌ FAILED'}")
    print("====================================================")
    
    if not (api_success and browser_success):
        sys.exit(1)

if __name__ == "__main__":
    main()
