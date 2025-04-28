import uuid
from datetime import datetime, timedelta
from app.models.user.crud import get_user_by_email, update_user, update_password
from app.utils.helpers.password_helpers import hash_password, verify_password


def request_password_reset(email):
    """Solicita redefinição de senha."""
    # Buscar usuário pelo email
    user = get_user_by_email(email)

    if not user:
        return {"success": False, "message": "Email não encontrado"}

    # Gerar token de reset
    reset_token = str(uuid.uuid4())
    expiration = datetime.utcnow() + timedelta(hours=1)  # Token válido por 1 hora

    # Atualizar usuário com token
    update_user(user["_id"], {
        "reset_password_token": reset_token,
        "reset_password_expires": expiration
    })

    # Em um cenário real, enviar email com o token
    # send_reset_email(user["email"], reset_token)

    return {
        "success": True,
        "message": "Email de redefinição enviado",
        # Apenas para fins de teste - em produção, não retornar o token!
        "reset_token": reset_token
    }


def reset_password(token, new_password):
    """Redefine senha com token."""
    # Buscar usuário pelo token
    from app.db.mongo_client import db
    from bson import ObjectId

    user = db.users.find_one({"reset_password_token": token})

    if not user:
        return {"success": False, "message": "Token inválido"}

    # Verificar se o token não expirou
    if "reset_password_expires" in user and user["reset_password_expires"] < datetime.utcnow():
        return {"success": False, "message": "Token expirado"}

    # Validar nova senha
    from app.services.auth.register_service import validate_password
    is_valid, error_message = validate_password(new_password)
    if not is_valid:
        return {"success": False, "message": error_message}

    # Gerar hash da nova senha
    password_hash = hash_password(new_password)

    # Atualizar senha e limpar token
    update_user(str(user["_id"]), {
        "password": password_hash,
        "reset_password_token": None,
        "reset_password_expires": None
    })

    return {"success": True, "message": "Senha redefinida com sucesso"}
