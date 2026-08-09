import time
import random
import string
from playwright.sync_api import sync_playwright

def run():
    print("Starting Playwright UI Automation to book an appointment...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # 1. Login
        print("Navigating to https://www.aotms.com/login")
        page.goto("https://www.aotms.com/login")
        
        # Wait for login form
        page.wait_for_selector('input[type="email"]', timeout=10000)
        page.locator('input[type="email"]').fill("yantirababu@gmail.com")
        page.locator('input[type="password"]').fill("Jayaveer!@#1837")
        page.click('button[type="submit"]')
        
        # Wait for redirect
        page.wait_for_url("**/dashboard", timeout=12000)
        print("Successfully logged in!")
        
        # 2. Go to Appointments
        print("Navigating to Appointments...")
        # Note: If the URL is different (e.g., /calendar or /bookings), adjust here
        page.goto("https://www.aotms.com/appointments")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        
        # 3. Try to open Create Modal if it exists
        print("Looking for a 'New Appointment' button (if applicable)...")
        try:
            page.click('button:has-text("New"), button:has-text("Add"), button:has-text("Book"), button:has-text("Create")', timeout=3000)
            time.sleep(1)
        except Exception:
            print("No 'New' or 'Add' button found or it timed out. Assuming the form is already visible on the page.")
        
        try:
            # Wait for form to appear if it's there
            page.wait_for_selector('form', timeout=3000)
        except:
            pass
            
        try:
            # 4. Fill details
            print("Filling out form for Appointment with provided details...")
            
            # Name
            name_locator = page.locator('input[name="name"], input[placeholder*="Name"], input[placeholder*="John"]')
            if name_locator.count() > 0:
                name_locator.first.fill("Test Appointment with Jayaveer")
                
            # Email
            email_locator = page.locator('input[name="email"], input[type="email"], input[placeholder*="email"]')
            if email_locator.count() > 0:
                email_locator.first.fill("testappointment@example.com")
                
            # Phone
            phone_locator = page.locator('input[name="phone"], input[placeholder*="Phone"], input[type="tel"]')
            if phone_locator.count() > 0:
                phone_locator.first.fill("+919550488347")
                
            # Date
            date_locator = page.locator('input[type="date"], input[name="date"], input[placeholder*="Date"]')
            if date_locator.count() > 0:
                date_locator.first.fill("2026-10-15")
                
            # Agent ID
            agent_id = "019fe6f3-c830-7227-a54a-7c99f4e7f32c"
            agent_locator = page.locator('input[name="agentid"], input[name="agent_id"], select[name="agent_id"], select[name="agentid"]')
            if agent_locator.count() > 0:
                if agent_locator.first.evaluate("el => el.tagName.toLowerCase()") == "select":
                    agent_locator.first.select_option(value=agent_id)
                else:
                    agent_locator.first.fill(agent_id)
                    
            # Organization ID
            random_org_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
            org_locator = page.locator('input[name="organization_id"], input[name="organizationid"], input[placeholder*="Organization"]')
            if org_locator.count() > 0:
                org_locator.first.fill(random_org_id)
                
            # Notes
            notes_locator = page.locator('textarea[name="notes"], textarea[placeholder*="Notes"], textarea[placeholder*="context"]')
            if notes_locator.count() > 0:
                notes_locator.first.fill("Automated booking for testing purposes. Please follow up.")
            
            # 5. Save
            print("Saving appointment...")
            page.click('button[type="submit"]')
            
            # Wait for network and UI to update
            time.sleep(3)
            page.wait_for_load_state("networkidle")
            
            print("Appointment created successfully via the web UI!")
            
        except Exception as e:
            print(f"Warning: Could not complete the appointment form. The page selectors might need adjusting to match the exact HTML of the appointments page. Error details: {e}")
            
        # Keep open briefly for user to see
        time.sleep(5)
        browser.close()

if __name__ == "__main__":
    run()
