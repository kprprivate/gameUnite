import re
from app.models.user.crud import create_user, get_user_by_email, get_user_by_username
from app.utils.helpers.password_helpers import hash_password


def validate_email(email):
    """Valida o formato do email."""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """Valida a força da senha."""
    if len(password) < 8:
        return False, "A senha deve ter pelo menos 8 caracteres"

    if not any(char.isdigit() for char in password):
        return False, "A senha deve conter pelo menos um número"

    if not any(char.isupper() for char in password):
        return False, "A senha deve conter pelo menos uma letra maiúscula"

    return True, ""


def register_user(username, email, password, first_name="", last_name=""):
    """Registra um novo usuário."""
    # Validar email
    if not validate_email(email):
        return {"success": False, "message": "Formato de email inválido"}

    # Validar senha
    is_valid_password, password_error = validate_password(password)
    if not is_valid_password:
        return {"success": False, "message": password_error}

    # Verificar se email já existe
    if get_user_by_email(email):
        return {"success": False, "message": "Email já está em uso"}

    # Verificar se username já existe
    if get_user_by_username(username):
        return {"success": False, "message": "Nome de usuário já está em uso"}

    # Gerar hash da senha
    password_hash = hash_password(password)

    # Criar usuário
    user = create_user(
        username=username,
        email=email,
        password_hash=password_hash,
        first_name=first_name,
        last_name=last_name
    )

    # Remover senha do resultado
    if "password" in user:
        user.pop("password")

    return {"success": True, "message": "Usuário registrado com sucesso", "user": user}
