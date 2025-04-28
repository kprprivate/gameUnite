from functools import wraps
from flask import g, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from bson import ObjectId
from app.db.mongo_client import db


def jwt_required(f):
    """Decorator para exigir JWT válido e carregar usuário no contexto."""

    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            # Verificar se o JWT é válido
            verify_jwt_in_request()

            # Obter ID do usuário do token
            user_id = get_jwt_identity()

            # Buscar usuário no banco de dados
            try:
                user = db.users.find_one({"_id": ObjectId(user_id)})
            except:
                return jsonify({
                    "success": False,
                    "message": "ID de usuário inválido"
                }), 401

            if not user:
                return jsonify({
                    "success": False,
                    "message": "Usuário não encontrado"
                }), 401

            # Verificar se usuário está ativo
            if not user.get("is_active", False):
                return jsonify({
                    "success": False,
                    "message": "Conta inativa"
                }), 403

            # Converter ObjectId para string
            user["_id"] = str(user["_id"])

            # Armazenar usuário no contexto global
            g.user = user

            # Executar função original
            return f(*args, **kwargs)

        except Exception as e:
            return jsonify({
                "success": False,
                "message": "Token inválido ou expirado"
            }), 401

    return decorated


def admin_required(f):
    """Decorator para exigir JWT válido e permissão de administrador."""

    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            # Verificar se o JWT é válido
            verify_jwt_in_request()

            # Obter ID do usuário do token
            user_id = get_jwt_identity()

            # Buscar usuário no banco de dados
            try:
                user = db.users.find_one({"_id": ObjectId(user_id)})
            except:
                return jsonify({
                    "success": False,
                    "message": "ID de usuário inválido"
                }), 401

            if not user:
                return jsonify({
                    "success": False,
                    "message": "Usuário não encontrado"
                }), 401

            # Verificar se usuário está ativo
            if not user.get("is_active", False):
                return jsonify({
                    "success": False,
                    "message": "Conta inativa"
                }), 403

            # Verificar se é administrador
            if user.get("role") not in ["admin", "support"]:
                return jsonify({
                    "success": False,
                    "message": "Permissão negada. Acesso apenas para administradores."
                }), 403

            # Converter ObjectId para string
            user["_id"] = str(user["_id"])

            # Armazenar usuário no contexto global
            g.user = user

            # Executar função original
            return f(*args, **kwargs)

        except Exception as e:
            return jsonify({
                "success": False,
                "message": "Token inválido ou expirado"
            }), 401

    return decorated
