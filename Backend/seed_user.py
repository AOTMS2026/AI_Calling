import asyncio
import os
import sys

# Add the Backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.database.connection import get_session
from app.models.domain import User
from app.Authentication.auth import get_password_hash

def seed_test_user():
    db = next(get_session())
    email = "ramanadhamjayaveer@gmail.com"
    existing = db.query(User).filter(User.email == email).first()
    if not existing:
        new_user = User(
            name="Jayaveer Tester",
            email=email,
            phone="+918031449343",
            hashed_password=get_password_hash("Jayaveer!@#1837"),
            role="admin",
            allocated_credits=500.0
        )
        db.add(new_user)
        db.commit()
        print(f"User {email} seeded successfully.")
    else:
        print(f"User {email} already exists.")
    db.close()

if __name__ == "__main__":
    seed_test_user()
