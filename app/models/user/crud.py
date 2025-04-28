from datetime import datetime
from bson import ObjectId
from app.db.mongo_client import db


def create_user(username, email, password_hash, first_name="", last_name=""):
    """Cria um novo usuário."""
    now = datetime.utcnow()

    user = {
        "username": username,
        "email": email,
        "password": password_hash,
        "first_name": first_name,
        "last_name": last_name,
        "profile_pic": "",
        "bio": "",
        "role": "user",
        "seller_rating": 0,
        "buyer_rating": 0,
        "seller_ratings_count": 0,
        "buyer_ratings_count": 0,
        "created_at": now,
        "updated_at": now,
        "last_login": None,
        "is_active": True,
        "is_verified": False,
        "verification_token": None,
        "reset_password_token": None,
        "reset_password_expires": None
    }

    result = db.users.insert_one(user)
    user["_id"] = str(result.inserted_id)
    return user


def get_user_by_email(email):
    """Busca um usuário pelo email."""
    user = db.users.find_one({"email": email})
    if user:
        user["_id"] = str(user["_id"])
    return user


def get_user_by_username(username):
    """Busca um usuário pelo nome de usuário."""
    user = db.users.find_one({"username": username})
    if user:
        user["_id"] = str(user["_id"])
    return user


def get_user_by_id(user_id):
    """Busca um usuário pelo ID."""
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if user:
            user["_id"] = str(user["_id"])
        return user
    except:
        return None


def update_user(user_id, data):
    """Atualiza dados do usuário."""
    try:
        update_data = {k: v for k, v in data.items() if k not in ["_id", "password"]}
        update_data["updated_at"] = datetime.utcnow()

        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )

        return get_user_by_id(user_id)
    except:
        return None


def update_password(user_id, password_hash):
    """Atualiza a senha do usuário."""
    try:
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "password": password_hash,
                "updated_at": datetime.utcnow()
            }}
        )
        return True
    except:
        return False


def update_last_login(user_id):
    """Atualiza o timestamp do último login."""
    try:
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        return True
    except:
        return False
