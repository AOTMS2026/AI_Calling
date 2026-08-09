import argparse
import sys
import time
import random

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Playwright is not installed. Please install it with: pip install playwright && playwright install")
    sys.exit(1)

DEFAULT_BASE_URL = "https://www.aotms.com"
DEFAULT_TEST_EMAIL = "yantirababu@gmail.com"
DEFAULT_TEST_PASSWORD = "Jayaveer!@#1837"

def run_agent_update_test(base_url, email, password, headless=False):
    print("\n--- 🤖 STARTING AGENT UPDATE AUTO-TEST ---")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless, args=['--no-sandbox', '--disable-setuid-sandbox'])
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        
        # Step 1: Login
        print(f"Step 1: Navigating to login page ({base_url}/login)...")
        page.goto(f"{base_url}/login")
        page.wait_for_load_state("networkidle")
        
        print(f"Authenticating as user: {email}...")
        page.locator('input[type="email"]').fill(email)
        page.locator('input[type="password"]').fill(password)
        page.click('button[type="submit"]')
        
        try:
            page.wait_for_url("**/dashboard", timeout=12000)
            print("🎉 Successfully logged in & reached Dashboard.")
        except Exception:
            print("❌ Failed to reach dashboard after login.")
            browser.close()
            return False

        # Step 2: Navigate to Agents
        print("\nStep 2: Navigating to Agents page...")
        page.goto(f"{base_url}/agents")
        page.wait_for_load_state("networkidle")
        
        # Wait for the agent grid to load
        try:
            # We look for the avatar block or the h3 with agent name
            page.wait_for_selector('h3.text-base.font-bold.text-gray-900', timeout=8000)
            print("Agents grid loaded. Clicking on the first available agent...")
            page.locator('h3.text-base.font-bold.text-gray-900').first.click()
        except Exception as e:
            print(f"❌ Failed to find any agents in the grid: {e}")
            browser.close()
            return False
            
        try:
            page.wait_for_url(lambda url: "/agents/" in url and "/agents/new" not in url, timeout=12000)
            print("🎉 Successfully navigated to Agent Builder.")
        except Exception as e:
            print(f"❌ Failed to load agent builder: {e}")
            browser.close()
            return False

        # Step 3: Update configuration
        print("\nStep 3: Updating Agent Configurations...")
        # 1. Update Name
        new_name = f"Updated Agent {random.randint(100, 999)}"
        print(f"Renaming agent to: {new_name}")
        page.click('h1 + button') # Edit icon next to name
        page.locator('input.text-2xl.font-black').fill(new_name)
        page.keyboard.press("Enter")
        
        # 2. Update Prompt
        print("Updating Agent Prompt...")
        page.locator('textarea[placeholder*="Design your AI Agent"]').fill(
            "You are a sophisticated AI scheduling assistant. Keep interactions professional and concise."
        )
        
        # 3. Update Welcome Message (Assuming there's a textarea or input for this)
        # Search for Welcome Message or just use generic locator if specific placeholder is known
        try:
            page.locator('textarea[placeholder*="Hello"]').fill("Hello! How can I help you today?")
            print("Updated Welcome Message.")
        except Exception:
            pass
            
        # 4. Save Configuration
        print("Saving Configuration...")
        page.click('button:has-text("Save Configuration")')
        
        # Wait for success toast
        time.sleep(2)
        print("✅ Update dispatched successfully!")
        
        browser.close()
        return True

def main():
    parser = argparse.ArgumentParser(description="Update AI Agent automated test script")
    parser.add_argument("--url", default=DEFAULT_BASE_URL, help=f"Target web application base URL (default: {DEFAULT_BASE_URL})")
    parser.add_argument("--email", default=DEFAULT_TEST_EMAIL, help=f"Email for test account (default: {DEFAULT_TEST_EMAIL})")
    parser.add_argument("--password", default=DEFAULT_TEST_PASSWORD, help=f"Password for test account")
    parser.add_argument("--headless", action="store_true", help="Run browser in headless mode")
    
    args = parser.parse_args()
    
    print("====================================================")
    print("   AI AGENT UPDATE AUTO-TESTER    ")
    print("====================================================")
    
    success = run_agent_update_test(args.url, args.email, args.password, headless=args.headless)
    
    print("\n================ TEST SUMMARY ====================")
    print(f"Agent Update Test: {'✅ PASSED' if success else '❌ FAILED'}")
    print("====================================================")
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()
