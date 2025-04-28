from datetime import datetime
from flask_jwt_extended import create_access_token, create_refresh_token
from app.models.user.crud import get_user_by_email, update_last_login
from app.utils.helpers.password_helpers import verify_password


def login_user(email, password):
    """Realiza login do usuário e gera tokens."""
    # Buscar usuário pelo email
    user = get_user_by_email(email)

    if not user:
        return {"success": False, "message": "Email ou senha inválidos"}

    # Verificar senha
    if not verify_password(password, user["password"]):
        return {"success": False, "message": "Email ou senha inválidos"}

    # Verificar se usuário está ativo
    if not user.get("is_active", False):
        return {"success": False, "message": "Conta inativa"}

    # Atualizar timestamp do último login
    update_last_login(user["_id"])

    # Gerar tokens
    access_token = create_access_token(identity=user["_id"])
    refresh_token = create_refresh_token(identity=user["_id"])

    # Remover senha antes de retornar
    user.pop("password", None)

    return {
        "success": True,
        "message": "Login realizado com sucesso",
        "user": user,
        "access_token": access_token,
        "refresh_token": refresh_token
    }


def refresh_auth_token(user_id):
    """Gera um novo token de acesso a partir do token de refresh."""
    access_token = create_access_token(identity=user_id)
    return {"success": True, "access_token": access_token}
