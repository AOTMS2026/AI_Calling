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

def generate_random_email():
    rand_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"tester_{rand_str}@example.com"

def generate_random_phone():
    # 10-digit phone number starting with 9, 8, 7 or 6
    num = random.choice(['9', '8', '7', '6']) + ''.join(random.choices(string.digits, k=9))
    return num

def run_automation_test():
    print("\n" + "="*60)
    print("🚀 AOTMS AUTOMATED WEBSITE TESTING AND DATA FILLER")
    print("="*60)
    
    target_url = "https://www.aotms.com/"
    print(f"Targeting: {target_url}\n")
    
    # Configure Chrome Options
    options = webdriver.ChromeOptions()
    # Keep browser open after script finishes
    options.add_experimental_option("detach", True)
    options.add_argument("--start-maximized")
    options.add_argument("--disable-gpu")
    
    # Initialize Chrome Driver
    print("Initializing automated Chrome session...")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    
    try:
        # 1. Open Landing Page
        print(f"Loading landing page: {target_url}")
        driver.get(target_url)
        wait = WebDriverWait(driver, 15)
        
        # 2. Wait until page loads and find register option
        print("Waiting for page load...")
        time.sleep(3)
        
        # Navigate directly to register page
        register_url = f"{target_url.rstrip('/')}/register"
        print(f"Navigating to Registration form: {register_url}")
        driver.get(register_url)
        
        # 3. Wait for register form to load
        name_input = wait.until(EC.presence_of_element_located((By.NAME, "name")))
        phone_input = driver.find_element(By.NAME, "phone")
        email_input = driver.find_element(By.NAME, "email")
        password_input = driver.find_element(By.NAME, "password")
        confirm_password_input = driver.find_element(By.NAME, "confirm_password")
        
        # Fill details
        test_name = "Automated Test Partner"
        test_phone = generate_random_phone()
        test_email = generate_random_email()
        test_pass = "SecurePass123!"
        
        print("\n✏️ Filling Form Details:")
        print(f"  - Full Name: {test_name}")
        print(f"  - Phone Number: {test_phone}")
        print(f"  - Email Address: {test_email}")
        print(f"  - Password: {test_pass}")
        
        name_input.send_keys(test_name)
        phone_input.send_keys(test_phone)
        email_input.send_keys(test_email)
        password_input.send_keys(test_pass)
        confirm_password_input.send_keys(test_pass)
        
        time.sleep(1.5)
        
        # Submit Form
        print("Clicking Complete Registration...")
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_btn.click()
        
        # Wait for redirect to verify-otp
        print("Waiting for redirection to OTP verification page...")
        wait.until(EC.url_contains("/verify-otp"))
        print("🎉 Successful Registration! Arrived at OTP Verification screen.")
        
        # Prompt user to input OTP (since OTP is emailed live to their webhook endpoint)
        print("\n" + "*"*60)
        print("ACTION REQUIRED:")
        print(f"An OTP has been dispatched to {test_email}.")
        print("Since this is the live website, check your admin logs or OTP dispatch webhook,")
        print("then type the code below to automatically proceed!")
        print("*"*60 + "\n")
        
        otp_code = input("Enter OTP Code: ").strip()
        
        otp_input = wait.until(EC.presence_of_element_located((By.NAME, "otp")))
        otp_input.send_keys(otp_code)
        
        time.sleep(1)
        verify_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        verify_btn.click()
        
        # Wait for redirect to login
        print("Verifying OTP...")
        wait.until(EC.url_contains("/login"))
        print("🎉 OTP Verified! Redirected to login page.")
        
        # Wait for login page input
        login_email = wait.until(EC.presence_of_element_located((By.NAME, "email")))
        login_pass = driver.find_element(By.NAME, "password")
        
        # Fill login credentials
        print(f"Autofilling login credentials for {test_email}...")
        login_email.send_keys(test_email)
        login_pass.send_keys(test_pass)
        
        time.sleep(1)
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        login_btn.click()
        
        # Wait for redirect to dashboard
        print("Submitting login...")
        wait.until(EC.url_contains("/dashboard"))
        print("\n🏆 SUCCESS! Dashboard Panel Opened Successfully!")
        print("The browser has been left open for you to interact with the system.")
        
    except Exception as e:
        print(f"\n❌ Automation Error: {e}")
        driver.quit()

if __name__ == "__main__":
    run_automation_test()
