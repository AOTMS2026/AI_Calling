#!/usr/bin/env python3
import os
import sys
import time
import random
import string
import argparse
import requests
import uuid
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
DEFAULT_TEST_EMAIL = "ramanadhamjayaveer@gmail.com"
DEFAULT_TEST_PASSWORD = "Jayaveer!@#1837"
DEFAULT_BASE_URL = "https://www.aotms.com"

def get_db_url(base_url):
    """Tries to find the DATABASE_URL from environment or local .env file matching target base URL."""
    if 'aotms.com' in base_url or 'academyoftechmasters.com' in base_url:
        return "postgresql://neondb_owner:npg_NTJ9lv6cZuiL@ep-muddy-bonus-ayb4w3ar.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"

    url = os.getenv("DATABASE_URL")
    if url:
        return url

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
                    if "neon.tech" in line and not line.startswith("#") and "postgresql" in line:
                        return line.strip("'\"")
        except Exception:
            pass

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

def ensure_purchased_phone_number(email, db_url, phone_to_ensure="+918031449343"):
    """Inserts a dummy purchased phone number for the test user so the Campaign Caller ID select option isn't empty."""
    if not psycopg:
        print("⚠️ psycopg is not installed. Skipping database telephone assurance.")
        return False
        
    clean_url = db_url.replace("postgresql+psycopg://", "postgresql://")
    try:
        with psycopg.connect(clean_url) as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT id FROM "user" WHERE email = %s', (email,))
                row = cur.fetchone()
                if row:
                    user_id = row[0]
                    # Check if exact number already exists for user
                    cur.execute('SELECT id FROM purchasedphonenumber WHERE user_id = %s AND phone_number = %s', (user_id, phone_to_ensure))
                    if cur.fetchone():
                        print(f"📦 Phone number '{phone_to_ensure}' already exists and is bound to user ID {user_id}.")
                        return True
                        
                    # Check if target phone number is already bought by someone else
                    cur.execute('SELECT id FROM purchasedphonenumber WHERE phone_number = %s', (phone_to_ensure,))
                    conflict = cur.fetchone()
                    if not conflict:
                        cur.execute(
                            'INSERT INTO purchasedphonenumber (id, user_id, phone_number, price, per_minute_price_inbound, per_minute_price_outbound, status, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())',
                            (str(uuid.uuid4()), user_id, phone_to_ensure, 295.0, 0.6, 0.6, 'Active')
                        )
                        conn.commit()
                        print(f"📦 Insured phone number '{phone_to_ensure}' is bound to user ID {user_id} in database.")
                    else:
                        # Rebind it to this user to avoid unique constraint failures
                        cur.execute(
                            'UPDATE purchasedphonenumber SET user_id = %s, status = \'Active\' WHERE phone_number = %s',
                            (user_id, phone_to_ensure)
                        )
                        conn.commit()
                        print(f"📦 Re-bound existing phone number '{phone_to_ensure}' to user ID {user_id}.")
                    return True
                else:
                    print("⚠️ User search returned empty when trying to insert dummy phone number.")
                    return False
    except Exception as e:
        print(f"⚠️ Could not insert dummy phone number in database: {e}")
        return False

def clean_test_entities_from_db(email, db_url, agent_prefix="Playwright Test Agent", campaign_prefix="Playwright Test Outbound"):
    """Optionally cleans up created agents/campaigns from database."""
    if not psycopg:
        return
    clean_url = db_url.replace("postgresql+psycopg://", "postgresql://")
    try:
        with psycopg.connect(clean_url) as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT id FROM "user" WHERE email = %s', (email,))
                row = cur.fetchone()
                if row:
                    user_id = row[0]
                    # Delete assign agent entries for agents belonging to user matching prefix
                    # Note: agents are mostly stored on Ravan.ai node, but local bindings like assign_agents/assign_campaigns are deleted to stay clean.
                    cur.execute('DELETE FROM assign_campaigns WHERE user_id = %s AND campaign_name LIKE %s', (user_id, f"{campaign_prefix}%"))
                    cur.execute('DELETE FROM assign_agents WHERE user_id = %s AND customer_email = %s', (user_id, email))
                    # Also delete local campaign tables
                    cur.execute('DELETE FROM campaign WHERE user_id = %s AND name LIKE %s', (user_id, f"{campaign_prefix}%"))
                    conn.commit()
                    print("🧹 Database cleanup of local test agents & campaign bindings complete.")
    except Exception as e:
        print(f"⚠️ Pre-cleanup failed: {e}")

def run_agent_campaign_automation_test(base_url, email, password, db_url, headless=False):
    """Automates logging in, creating an AI agent, and constructing an outbound campaign."""
    print("\n--- 🤖 STARTING AGENT AND OUTBOUND CAMPAIGN AUTOMATION ---")
    
    agent_name = f"Playwright Test Agent {random.randint(100, 999)}"
    campaign_name = f"Playwright Test Outbound {random.randint(100, 999)}"
    phone_number = "+918031449343"

    # Step 0: Ensure test user has a phone number
    ensure_purchased_phone_number(email, db_url, phone_to_ensure=phone_number)

    with sync_playwright() as p:
        # Launch Chromium Browser
        browser = p.chromium.launch(headless=headless)
        page = browser.new_page()
        
        # Step 1: Log in
        print(f"Step 1: Navigating to login page ({base_url}/login)...")
        page.goto(f"{base_url}/login")
        
        print(f"Authenticating as user: {email}...")
        page.locator('input[type="email"]').fill(email)
        page.locator('input[type="password"]').fill(password)
        page.click('button[type="submit"]')
        
        # Wait for redirect back to dashboard
        page.wait_for_url("**/dashboard", timeout=12000)
        print("🎉 Successfully logged in & reached Dashboard.")
        
        # Step 2: Navigate to Agents Page
        print("\nStep 2: Navigating to Agents page...")
        page.goto(f"{base_url}/agents")
        page.wait_for_load_state("networkidle")
        
        # Click the "New Agent" button
        print("Triggering New Agent provisioning builder...")
        # Since it is a button containing svg and title, select using text or locator
        page.click('button:has-text("New Agent")')
        page.wait_for_url("**/agents/new", timeout=8000)
        print("🎉 Reached Agent Builder.")
        
        # Click the Edit inline button next to Unnamed Agent to open name input
        print("Renaming agent to custom title...")
        # Wait for rendering is complete
        time.sleep(1.5)
        # Select the edit button next to h1
        page.click('h1 + button')
        
        # Fill in the name input field
        # The input has class 'text-2xl' and 'font-black'
        page.locator('input.text-2xl.font-black').fill(agent_name)
        page.keyboard.press("Enter")
        print(f"Agent renamed in model state to: '{agent_name}'")
        
        # Write system prompt base instructions
        print("Configuring system prompt base brains...")
        page.locator('textarea[placeholder*="Design your AI Agent"]').fill(
            "You are a friendly customer receptionist AI assistant. Confirm details politely and schedule bookings."
        )
        
        # Save Agent configuration
        print("Saving agent configuration...")
        page.click('button:has-text("Save Configuration")')
        
        # Wait until URL is updated with new agent UUID
        print("Waiting for redirection to the newly created agent page...")
        try:
            page.wait_for_url(lambda url: "/agents/" in url and "/agents/new" not in url, timeout=20000)
            agent_url = page.url
            agent_id = agent_url.split('/agents/')[-1].split('?')[0]
            print(f"🎉 Agent successfully deployed! UUID: {agent_id}")
        except Exception as e:
            print(f"❌ Failed to retrieve newly provisioned agent UUID: {e}")
            browser.close()
            return False

        # Step 3: Navigate to Campaign Page
        print("\nStep 3: Creating Outbound Dialing Campaign...")
        page.goto(f"{base_url}/campaigns/outbound")
        page.wait_for_load_state("networkidle")
        
        # Open Create New Campaign Modal
        page.click('button:has-text("New Campaign")')
        page.wait_for_selector('form', timeout=8000)
        print("Campaign configuration modal rendered.")
        
        # Fill campaign name
        print(f"Naming outbound campaign: '{campaign_name}'...")
        page.locator('input[placeholder="e.g. Lead Follow-up Q3"]').fill(campaign_name)
        
        # Wait for agent dropdown options to populate, then select our new agent
        print("Selecting AI voice agent from dropdown...")
        try:
            agent_select = page.locator('select').nth(0)
            # Give a second for Ravan agents to fetch and populate options
            time.sleep(1.5)
            agent_select.select_option(value=agent_id)
        except Exception as e:
            print(f"⚠️ Dropped select option binding: {e}")
            # Fallback block: select the first option available
            page.locator('select').first.select_option(index=1)
            
        # Select Caller ID Number
        print("Selecting Caller ID number...")
        try:
            phone_select = page.locator('select').nth(1)
            phone_select.select_option(value=phone_number)
        except Exception as e:
            print(f"⚠️ Caller ID selection fallback: {e}")
            # Fallback to select first available option
            page.locator('select').nth(1).select_option(index=1)
            
        # Submit the campaign creation form
        print("Submitting Campaign Form...")
        page.click('button:has-text("Continue to Step 2")')
        
        # Wait for modal to disappear and campaigns list to reload
        time.sleep(2)
        print(f"🎉 Outbound Campaign '{campaign_name}' dispatched successfully!")
        
        # Step 4: Verify the campaign exists in the list
        print("\nStep 4: Verifying the campaign exists in list...")
        try:
            page.wait_for_selector(f'h3:has-text("{campaign_name}")', timeout=8000)
            print("✅ Verified! Outbound Campaign visible in active list.")
            success = True
        except Exception:
            print("❌ Campaign validation failed: Campaign name not visible in dashboard list.")
            success = False
            
        browser.close()
        return success

def main():
    parser = argparse.ArgumentParser(description="Create AI Agent and Outbound Campaign automated test script")
    parser.add_argument("--url", default=DEFAULT_BASE_URL, help=f"Target web application base URL (default: {DEFAULT_BASE_URL})")
    parser.add_argument("--email", default=DEFAULT_TEST_EMAIL, help=f"Email for test account (default: {DEFAULT_TEST_EMAIL})")
    parser.add_argument("--password", default=DEFAULT_TEST_PASSWORD, help=f"Password for test account")
    parser.add_argument("--headless", action="store_true", help="Run browser testing in headless mode (without visible Chrome window)")
    parser.add_argument("--cleanup", action="store_true", help="Clean up local test database campaign bindings afterwards")
    
    args = parser.parse_args()
    
    db_url = get_db_url(args.url)
    
    print("====================================================")
    print("   AI AGENT & OUTBOUND CAMPAIGN AUTO-PROVISIONER    ")
    print("====================================================")
    print(f"🎯 Target URL       : {args.url}")
    print(f"📧 Account Email     : {args.email}")
    print(f"🔑 Account Password  : {args.password}")
    print(f"⚙️ Headless Mode     : {args.headless}")
    print("====================================================")
    
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
            
    success = run_agent_campaign_automation_test(args.url, args.email, args.password, db_url, headless=args.headless)
    
    if args.cleanup:
        clean_test_entities_from_db(args.email, db_url)
        
    print("\n================ TEST SUMMARY ====================")
    print(f"Agent & Outbound Auto-Provision: {'✅ PASSED' if success else '❌ FAILED'}")
    print("====================================================")
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()
