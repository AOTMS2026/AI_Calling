import time
from playwright.sync_api import sync_playwright

def run():
    print("Starting Playwright UI Automation to create a Todo List item...")
    with sync_playwright() as p:
        # Run with headless=False to open Chrome automatically as requested
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
        
        # 2. Go to Todos
        print("Navigating to Todos...")
        page.goto("https://www.aotms.com/todos")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        
        # 3. Open Create Modal
        print("Clicking 'Add Task'...")
        page.click('button:has-text("Add Task")')
        page.wait_for_selector('form', timeout=8000)
        
        # 4. Fill details
        print("Filling out form for Todo List...")
        # Title
        page.locator('input[placeholder="e.g. Optimize Telemarketing Prompt parameters"]').fill("Automated Todo List Item")
        # Description
        page.locator('textarea[placeholder="Provide any instructions or links..."]').fill("This is an auto-generated todo list item created using Playwright automation.")
        
        # Select Priority -> Urgent
        page.locator('select').nth(0).select_option(value="Urgent")
        # Select Category -> Lead Follow-up
        page.locator('select').nth(1).select_option(value="Lead Follow-up")
        
        # 5. Save
        print("Saving task...")
        page.click('button[type="submit"]:has-text("Add Task")')
        
        # Wait for network and UI to update
        time.sleep(3)
        page.wait_for_load_state("networkidle")
        
        print("Todo item created successfully via the web UI!")
        
        # Keep open briefly for user to see
        time.sleep(5)
        browser.close()

if __name__ == "__main__":
    run()
