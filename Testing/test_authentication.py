import uuid
import httpx
from sqlmodel import Session, select
from app.models.domain import User, OTP

def test_user_registration_and_activation(base_url, db_session):
    # 1. Create a registration request payload with a unique email to avoid conflicts
    unique_id = uuid.uuid4().hex[:8]
    email = f"test_user_{unique_id}@example.com"
    name = f"Test User {unique_id}"
    phone = "9876543210"
    password = "StrongPassword123!"
    
    register_payload = {
        "name": name,
        "email": email,
        "phone": phone,
        "password": password,
        "confirm_password": password
    }
    
    # Send Register request
    resp = httpx.post(f"{base_url}/auth/register", json=register_payload)
    assert resp.status_code == 200, f"Registration failed: {resp.text}"
    assert "User created. OTP sent to email." in resp.json()["message"]
    
    # 2. Extract OTP representing email webhook bypassing in register workflow
    user = db_session.exec(select(User).where(User.email == email)).first()
    assert user is not None, "User record was not created in database"
    assert user.role == "customer", "Default user role must be 'customer'"
    
    # Pull OTP code directly from DB
    otp_record = db_session.exec(
        select(OTP).where(OTP.user_id == user.id).order_by(OTP.id.desc())
    ).first()
    assert otp_record is not None, "OTP register token not persisted in database"
    otp_code = otp_record.code
    
    # 3. Call verification gateway
    verify_payload = {
        "email": email,
        "code": otp_code
    }
    verify_resp = httpx.post(f"{base_url}/auth/verify-otp", json=verify_payload)
    assert verify_resp.status_code == 200, f"OTP verification failed: {verify_resp.text}"
    assert "OTP Verified successfully." in verify_resp.json()["message"]
    
    # 4. Exchange username password for JWT Token
    login_payload = {
        "email": email,
        "password": password
    }
    login_resp = httpx.post(f"{base_url}/auth/login", json=login_payload)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    
    login_data = login_resp.json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data
    assert login_data["token_type"] == "bearer"
    assert login_data["role"] == "customer"
    
    # Save token for further authorization requests
    access_token = login_data["access_token"]
    
    # 5. Access profile page to verify JWT tokens decode and match identity
    headers = {"Authorization": f"Bearer {access_token}"}
    me_resp = httpx.get(f"{base_url}/auth/me", headers=headers)
    assert me_resp.status_code == 200, f"Protected /me endpoint returned error: {me_resp.text}"
    
    me_data = me_resp.json()
    assert me_data["email"] == email
    assert me_data["name"] == name
    assert me_data["role"] == "customer"
