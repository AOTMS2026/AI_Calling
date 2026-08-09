#!/usr/bin/env python3
import os
import sys
import time
import random
import string
import argparse
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

def ensure_purchased_phone_number(email, db_url, phone_to_ensure="+918031449343"):
    """Inserts a dummy purchased phone number for the test user to ensure consistency."""
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
                            'INSERT INTO purchasedphonenumber (user_id, phone_number, price, per_minute_price_inbound, per_minute_price_outbound, status, created_at) VALUES (%s, %s, %s, %s, %s, %s, NOW())',
                            (user_id, phone_to_ensure, 295.0, 0.6, 0.6, 'Active')
                        )
                        conn.commit()
                        print(f"📦 Insured phone number '{phone_to_ensure}' is bound to user ID {user_id} in database.")
                    else:
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

def clean_test_entities_from_db(email, db_url, todo_title_prefix="Playwright Test Todo", contact_phone="+9199999999"):
    """Optionally cleans up created todos and contacts from database."""
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
                    # Clean up TodoActivity first then Todo
                    cur.execute(
                        'DELETE FROM todoactivity WHERE todo_id IN (SELECT id FROM todo WHERE user_id = %s AND title LIKE %s)',
                        (user_id, f"{todo_title_prefix}%")
                    )
                    cur.execute('DELETE FROM todo WHERE user_id = %s AND title LIKE %s', (user_id, f"{todo_title_prefix}%"))
                    
                    # Clean up Created Contact
                    cur.execute('DELETE FROM contact WHERE phone LIKE %s', (f"{contact_phone}%",))
                    
                    conn.commit()
                    print("🧹 Database cleanup of test contacts & todo items complete.")
    except Exception as e:
        print(f"⚠️ Pre-cleanup failed: {e}")

def run_modules_automation_test(base_url, email, password, db_url, headless=False):
    """Automates logging in and executing flows for Contacts, Todo List, and Phone Numbers."""
    print("\n--- 🤖 STARTING CONTACTS, TODOS, AND PHONE NUMBERS TEST FLOW ---")
    
    unique_id = random.randint(1000, 9999)
    contact_name = f"Playwright Contact {unique_id}"
    contact_phone = f"+91999999{unique_id}"
    contact_email = f"playwright_contact_{unique_id}@example.com"
    contact_company = "Testing Corp"
    
    todo_title = f"Playwright Test Todo {unique_id}"
    todo_description = "Automated test description mapping task parameters."

    # Step 0: Pre-clean
    clean_test_entities_from_db(email, db_url, todo_title_prefix="Playwright Test Todo", contact_phone="+91999999")

    with sync_playwright() as p:
        # Launch Browser
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
        
        # ==================================================
        # PART A: Contacts Workflow
        # ==================================================
        print("\n📂 PART A: Initiating Contacts Flow...")
        page.goto(f"{base_url}/contacts")
        page.wait_for_load_state("networkidle")
        print("Reached Contacts workspace.")

        # Click the "New Contact" button
        page.click('button:has-text("New Contact")')
        page.wait_for_selector('form', timeout=8000)
        print("New Contact modal is open, filling details...")

        # Fill contact forms
        page.locator('input[placeholder="John Doe"]').fill(contact_name)
        page.locator('input[placeholder="+914157774444"]').fill(contact_phone)
        page.locator('input[placeholder="alex@example.com"]').fill(contact_email)
        page.locator('input[placeholder="Acme Corp"]').fill(contact_company)
        
        # Save Contact
        print("Saving contact details...")
        page.click('button[type="submit"]:has-text("Save Contact")')
        
        # Wait for modal to disappear and confirm contact in list
        time.sleep(2)
        page.wait_for_load_state("networkidle")
        
        # Verify contact name is listed
        try:
            page.wait_for_selector(f'td:has-text("{contact_name}")', timeout=8000)
            print(f"✅ Contacts Flow Success! Mapped '{contact_name}' in core.")
        except Exception:
            print("❌ Contacts validation failed: Name not visible in table.")
            browser.close()
            return False

        # ==================================================
        # PART B: Todo List Workflow
        # ==================================================
        print("\n📝 PART B: Initiating Todo List Flow...")
        page.goto(f"{base_url}/todos")
        page.wait_for_load_state("networkidle")
        print("Reached Tasks Dashboard.")
        
        # Click the "Add Task" button
        page.click('button:has-text("Add Task")')
        page.wait_for_selector('form', timeout=8000)
        print("Add Task form rendered, filling details...")
        
        # Fill Form Data
        page.locator('input[placeholder="e.g. Optimize Telemarketing Prompt parameters"]').fill(todo_title)
        page.locator('textarea[placeholder="Provide any instructions or links..."]').fill(todo_description)
        
        # Select Priority -> Urgent
        page.locator('select').nth(0).select_option(value="Urgent")
        # Select Category -> Lead Follow-up
        page.locator('select').nth(1).select_option(value="Lead Follow-up")
        
        # Submit Task
        print("Submitting new task...")
        page.click('button[type="submit"]:has-text("Add Task")')
        
        # Verify task is created in list
        time.sleep(2)
        try:
            page.wait_for_selector(f'h4:has-text("{todo_title}")', timeout=8000)
            print(f"✅ Todo List Flow Success! Mapped '{todo_title}' on board.")
        except Exception:
            print("❌ Todo List validation failed: Task Title not visible on list cards.")
            browser.close()
            return False
            
        # Quick status toggle verifying
        print("Toggling task status quick action...")
        page.click(f'div:has(h4:has-text("{todo_title}")) >> button')
        time.sleep(1)
        print("✅ Quick toggle checked.")

        # ==================================================
        # PART C: Phone Numbers Workflow
        # ==================================================
        print("\n📞 PART C: Initiating Phone Numbers Flow...")
        page.goto(f"{base_url}/phone-numbers")
        page.wait_for_load_state("networkidle")
        print("Reached Phone Numbers workspace.")
        
        # Refresh List
        print("Verifying refresh controls...")
        page.click('button:has-text("Refresh List")')
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        
        # Verify lists rendering correctly
        try:
            # Look for active numbers headers or tables
            page.wait_for_selector('h2:has-text("My Active Numbers")', timeout=8000)
            print("✅ Phone Numbers Flow Success! Phone Workspace rendered correctly.")
        except Exception:
            print("❌ Phone numbers validation failed: Active Numbers container header not visible.")
            browser.close()
            return False

        browser.close()
        return True

def main():
    parser = argparse.ArgumentParser(description="Test Contacts, Todos, and Phone Numbers modules flow")
    parser.add_argument("--url", default=DEFAULT_BASE_URL, help=f"Target web application base URL (default: {DEFAULT_BASE_URL})")
    parser.add_argument("--email", default=DEFAULT_TEST_EMAIL, help=f"Email for test account (default: {DEFAULT_TEST_EMAIL})")
    parser.add_argument("--password", default=DEFAULT_TEST_PASSWORD, help=f"Password for test account")
    parser.add_argument("--headless", action="store_true", help="Run browser testing in headless mode")
    parser.add_argument("--cleanup", action="store_true", help="Clean up created test entities in backend DB afterwards")
    
    args = parser.parse_args()
    db_url = get_db_url(args.url)
    
    print("====================================================")
    print("   CONTACTS, TODOS, & PHONES AUTO-TESTER RUNNER     ")
    print("====================================================")
    print(f"🎯 Target URL       : {args.url}")
    print(f"📧 Account Email     : {args.email}")
    print(f"🔑 Account Password  : {args.password}")
    print(f"⚙️ Headless Mode     : {args.headless}")
    print("====================================================")
    
    global sync_playwright
    if not sync_playwright:
        print("⚠️ Playwright not detected. Installing dependencies...")
        import subprocess
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright"])
            subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
            from playwright.sync_api import sync_playwright
        except Exception as e:
            print(f"❌ Failed to auto-install playwright: {e}")
            sys.exit(1)
            
    success = run_modules_automation_test(args.url, args.email, args.password, db_url, headless=args.headless)
    
    if args.cleanup:
        clean_test_entities_from_db(args.email, db_url, contact_phone="+91999999")
        
    print("\n================ TEST SUMMARY ====================")
    print(f"Modules (Contacts, Todos, Phones): {'✅ PASSED' if success else '❌ FAILED'}")
    print("====================================================")
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()
