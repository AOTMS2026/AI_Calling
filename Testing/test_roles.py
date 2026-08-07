import uuid
import httpx
from sqlmodel import Session, select
from app.models.domain import User, OTP

def test_roles_and_access_control(base_url, db_session):
    # 1. Register a standard customer user
    unique_id = uuid.uuid4().hex[:8]
    email = f"role_user_{unique_id}@example.com"
    name = f"Role User {unique_id}"
    phone = "9876543210"
    password = "StrongPassword123!"
    
    register_payload = {
        "name": name,
        "email": email,
        "phone": phone,
        "password": password,
        "confirm_password": password
    }
    
    # Register and activate
    httpx.post(f"{base_url}/auth/register", json=register_payload)
    user = db_session.exec(select(User).where(User.email == email)).first()
    otp_record = db_session.exec(select(OTP).where(OTP.user_id == user.id)).first()
    
    httpx.post(f"{base_url}/auth/verify-otp", json={"email": email, "code": otp_record.code})
    
    # Login to get Customer JWT Token
    login_resp = httpx.post(f"{base_url}/auth/login", json={"email": email, "password": password})
    customer_token = login_resp.json()["access_token"]
    
    # Try calling an Admin-Only endpoint (GET /api/appointments/)
    customer_headers = {"Authorization": f"Bearer {customer_token}"}
    unauthorized_resp = httpx.get(f"{base_url}/api/appointments/", headers=customer_headers)
    
    # Verify we get a HTTP 403 Forbidden / Not authorized
    assert unauthorized_resp.status_code == 403, f"Expected 403 Forbidden for customer, got {unauthorized_resp.status_code}"
    assert "Not authorized" in unauthorized_resp.json()["detail"]
    
    # 2. Upgrade user to administrator in the DB to test access
    user.role = "admin"
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Clean user cache in Redis so authorization loads fresh role info
    from app.core.redis_client import delete_cache
    import asyncio
    asyncio.run(delete_cache(f"user_auth_profile_{email}"))
        
    # User logins again to get updated Admin JWT Token or uses the profile sync
    admin_login_resp = httpx.post(f"{base_url}/auth/login", json={"email": email, "password": password})
    admin_token = admin_login_resp.json()["access_token"]
    
    # Re-call Admin-Only endpoint (GET /api/appointments/) with Admin privileges
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    authorized_resp = httpx.get(f"{base_url}/api/appointments/", headers=admin_headers)
    
    # Assert successful retrieval (status code 200)
    assert authorized_resp.status_code == 200, f"Expected 200 OK for Admin user, got {authorized_resp.status_code}: {authorized_resp.text}"
    assert authorized_resp.json()["success"] is True
