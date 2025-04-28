from flask import Blueprint

from app.api.auth.register import register_handler
from app.api.auth.login import login_handler, refresh_token_handler
from app.api.auth.password import request_reset_handler, reset_password_handler

# Criar blueprint
auth_bp = Blueprint("auth", __name__)

# Rota de registro
auth_bp.add_url_rule("/register", view_func=register_handler, methods=["POST"])

# Rotas de login
auth_bp.add_url_rule("/login", view_func=login_handler, methods=["POST"])
auth_bp.add_url_rule("/refresh", view_func=refresh_token_handler, methods=["POST"])

# Rotas de recuperação de senha
auth_bp.add_url_rule("/password/reset-request", view_func=request_reset_handler, methods=["POST"])
auth_bp.add_url_rule("/password/reset", view_func=reset_password_handler, methods=["POST"])
