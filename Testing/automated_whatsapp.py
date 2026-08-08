import os
import sys
import time
import random
import string
import subprocess

# Ensure selenium and webdriver-manager are installed in the python environment
try:
    import selenium
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from webdriver_manager.chrome import ChromeDriverManager
    from selenium.webdriver.chrome.service import Service
except ImportError:
    print("Installing selenium and webdriver-manager dependencies automatically...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "selenium", "webdriver-manager"])
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from webdriver_manager.chrome import ChromeDriverManager
    from selenium.webdriver.chrome.service import Service

def slow_type(element, text, delay=0.1):
    """Types text one character at a time with a delay to simulate real human typing."""
    element.clear()
    for char in text:
        element.send_keys(char)
        time.sleep(delay)

def run_whatsapp_testing():
    print("\n" + "="*70)
    print("🚀 AOTMS WHATSAPP AUTOMATION PORTAL INTEGRATION TESTER (VISUAL DEMO MODE)")
    print("="*70)
    
    target_url = "https://www.aotms.com"
    email_cred = "ramanadhamjayaveer@mictech.edu.in"
    pass_cred = "Jayaveer!@#1837"
    
    print(f"Targeting: {target_url}")
    print(f"Credentials Profile: {email_cred}")
    print("This run uses slow transitions (sleeps) for better step visibility.\n")
    
    # Configure Chrome Options
    options = webdriver.ChromeOptions()
    options.add_experimental_option("detach", True)
    options.add_argument("--start-maximized")
    options.add_argument("--disable-gpu")
    
    # Initialize Chrome Driver
    print("Initializing automated Chrome driver session...")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    wait = WebDriverWait(driver, 20)
    
    try:
        # Step 1: Open Login Page
        login_url = f"{target_url.rstrip('/')}/login"
        print(f"Loading login route: {login_url}")
        driver.get(login_url)
        time.sleep(3)
        
        # Step 2: Fill in Credentials and Sign In
        print("Locating login input fields...")
        email_input = wait.until(EC.presence_of_element_located((By.NAME, "email")))
        password_input = driver.find_element(By.NAME, "password")
        
        print("Typing credentials slowly...")
        slow_type(email_input, email_cred, delay=0.08)
        time.sleep(1)
        slow_type(password_input, pass_cred, delay=0.08)
        time.sleep(2)
        
        print("Clicking Submit Sign-In Button...")
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        login_btn.click()
        
        # Step 3: Wait for dashboard loading with error detection
        print("Awaiting redirect to dashboard...")
        time.sleep(4) # Let redirect try to process
        
        current_url = driver.current_url
        if "/dashboard" not in current_url:
            # Check for error message dynamically
            try:
                error_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Invalid') or contains(text(), 'Error') or contains(text(), 'not found')]")
                if len(error_elements) > 0:
                    print(f"\n❌ Login Failed. Displayed message: '{error_elements[0].text}'")
                    print("Please make sure this credentials profile is registered first.")
                    input("\n(Press Enter here to continue anyway after you manually correct the login details...)")
            except Exception:
                pass
                
        wait.until(EC.url_contains("/dashboard"))
        print("✓ Logged in successfully! Located dashboard route.")
        time.sleep(3)
        
        # Step 4: Navigate to WhatsApp Module
        whatsapp_url = f"{target_url.rstrip('/')}/whatsapp"
        print(f"Navigating browser to WhatsApp Marketing Portal: {whatsapp_url}")
        driver.get(whatsapp_url)
        time.sleep(4)
        
        # Step 5: Test Portal Elements & Tabs
        print("\n" + "-"*50)
        print("💼 TABS DEMO [1/4]: CAMPAIGN MONITORS")
        print("-"*50)
        
        # Verify metrics loaded
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Total Broadcasted')]")))
        print("✓ Metric aggregates found.")
        time.sleep(2)
        
        # Click refresh portal
        refresh_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Refresh Portal')]")))
        refresh_btn.click()
        print("✓ Clicked 'Refresh Portal' button.")
        time.sleep(3)
        
        # Try to expand campaign details outbox logs if elements exist
        try:
            outbox_logs_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Outbox logs')]")
            outbox_logs_btn.click()
            print("✓ Expanded Outbox campaign log drawer.")
            time.sleep(3)
        except Exception:
            print("ℹ (No campaigns logged in list. Proceeding...)")

        # Step 6: Test Bulk Campaign Composer Tab
        print("\n" + "-"*50)
        print("💼 TABS DEMO [2/4]: BULK CAMPAIGN COMPOSER")
        print("-"*50)
        
        composer_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Bulk Campaign Composer')]")))
        composer_tab.click()
        print("✓ Switched tab path to 'Bulk Campaign Composer'.")
        time.sleep(3)
        
        # Fill Campaign Name using correct input selector
        print("Autofilling Campaign Name field...")
        campaign_name_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter campaign identifier, e.g. August Intake Followups']")))
        slow_type(campaign_name_input, "Automated Outbound Admission Drive", delay=0.08)
        time.sleep(2)
        
        # Click Import CRM Contacts
        crm_import_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Import CRM Contacts')]")))
        crm_import_btn.click()
        print("✓ Clicked 'Import CRM Contacts' dashboard option.")
        time.sleep(4)

        # Step 7: Test Direct Chat & Timelines Tab
        print("\n" + "-"*50)
        print("💼 TABS DEMO [3/4]: DIRECT CHAT & TIMELINES")
        print("-"*50)
        
        chat_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Direct Chat & Timelines')]")))
        chat_tab.click()
        print("✓ Switched tab path to 'Direct Chat & Timelines'.")
        time.sleep(3)
        
        # Select first contact from CRM Sidebar list
        try:
            crm_contact = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[contains(@class, 'cursor-pointer') and .//p]")))
            crm_contact.click()
            print("✓ Selected contact item from CRM chat sidebar.")
            time.sleep(3)
        except Exception:
            print("ℹ Selected active chat partner session.")

        # Fill direct messenger text area
        try:
            chat_textarea = wait.until(EC.presence_of_element_located((By.XPATH, "//textarea[contains(@placeholder, 'Type a message')]")))
            chat_textarea.clear()
            slow_type(chat_textarea, "Hello! This is a slow typing verification test for the AOTMS chat timeline.", delay=0.05)
            print("✓ Automated text message populated in chat text field.")
            time.sleep(3)
        except Exception as ex:
            print(f"ℹ Direct message text element could not be filled: {ex}")

        # Step 8: Test Outbox Media Library Tab
        print("\n" + "-"*50)
        print("💼 TABS DEMO [4/4]: OUTBOX MEDIA LIBRARY")
        print("-"*50)
        
        media_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Outbox Media Library')]")))
        media_tab.click()
        print("✓ Switched tab path to 'Outbox Media Library'.")
        time.sleep(3.5)
        
        # Verify media library layout
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Upload new media asset')]")))
        print("✓ Verified Media Asset management sections loaded.")
        time.sleep(2)
        
        print("\n" + "="*70)
        print("🏆 TESTING SUITE CONCLUDED SUCCESSFULLY!")
        print("The browser has been left open for you to verify.")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Automation Error: {e}")
        # Keep driver open for viewing errors
        pass

if __name__ == "__main__":
    run_whatsapp_testing()
