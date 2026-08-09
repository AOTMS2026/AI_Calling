import time
from playwright.sync_api import sync_playwright

def run():
    print("Starting Playwright UI Automation to create contact 'Jayaveer'...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # 1. Login
        print("Navigating to https://www.aotms.com/login")
        page.goto("https://www.aotms.com/login")
        
        # Wait for login form
        page.wait_for_selector('input[type="email"]', timeout=10000)
        page.locator('input[type="email"]').fill("ramanadhamjayaveer@gmail.com")
        page.locator('input[type="password"]').fill("Jayaveer!@#1837")
        page.click('button[type="submit"]')
        
        # Wait for redirect
        page.wait_for_url("**/dashboard", timeout=12000)
        print("Successfully logged in!")
        
        # 2. Go to Contacts
        print("Navigating to Contacts...")
        page.goto("https://www.aotms.com/contacts")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        
        # 3. Open Create Modal
        print("Clicking 'New Contact'...")
        page.click('button:has-text("New Contact")')
        page.wait_for_selector('form', timeout=8000)
        
        # 4. Fill details
        print("Filling out form for Jayaveer...")
        # Full Name
        page.locator('input[placeholder="John Doe"]').fill("jayaveer")
        # Phone Number
        page.locator('input[placeholder="+914157774444"]').fill("+918121016848")
        
        # Email Address
        page.locator('input[placeholder="alex@example.com"]').fill("jayaveer@example.com")
        
        # Company
        page.locator('input[placeholder="Acme Corp"]').fill("TechMasters")
        
        # Target Campaign
        # Wait a moment for campaigns to load in the dropdown
        time.sleep(1)
        # Select the second option (first campaign) since first option is "-- Let Backend Auto-Map --"
        select_locator = page.locator('form select')
        options = select_locator.locator('option').all()
        if len(options) > 1:
            select_locator.select_option(options[1].get_attribute("value"))
        
        # Tags
        page.locator('input[placeholder="VIP, lead..."]').fill("Testing folder")
        page.keyboard.press("Enter")
        time.sleep(0.5)
        
        # Custom Variables (Metadata)
        print("Adding Custom Variables...")
        # Click the Add button for Metadata
        page.click('button:has-text("Add")')
        page.locator('input[placeholder="key"]').fill("source")
        page.locator('input[placeholder="value"]').fill("playwright_automation")
        
        # 5. Save
        print("Saving contact...")
        page.click('button[type="submit"]:has-text("Save Contact")')
        
        # Wait for network and UI to update
        time.sleep(3)
        page.wait_for_load_state("networkidle")
        
        print("Contact created successfully via the web UI!")
        
        # Keep open briefly for user to see
        time.sleep(5)
        browser.close()

if __name__ == "__main__":
    run()
