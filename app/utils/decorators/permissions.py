from functools import wraps
from flask import g, jsonify
from app.utils.decorators.auth_decorators import jwt_required
from app.utils.helpers.response_helpers import error_response

def admin_required(f):
    """Decorator que requer que o usuário seja um administrador."""
    @wraps(f)
    @jwt_required
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'user') or not g.user:
            return error_response("Acesso negado", status_code=401)
        
        if g.user.get('role') != 'admin':
            return error_response("Acesso negado - privilégios de administrador necessários", status_code=403)
        
        return f(*args, **kwargs)
    return decorated_function

def moderator_required(f):
    """Decorator que requer que o usuário seja moderador ou administrador."""
    @wraps(f)
    @jwt_required
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'user') or not g.user:
            return error_response("Acesso negado", status_code=401)
        
        user_role = g.user.get('role')
        if user_role not in ['admin', 'moderator']:
            return error_response("Acesso negado - privilégios de moderador necessários", status_code=403)
        
        return f(*args, **kwargs)
    return decorated_function

def owner_or_admin_required(resource_user_id_key='user_id'):
    """Decorator que permite acesso ao dono do recurso ou administrador."""
    def decorator(f):
        @wraps(f)
        @jwt_required
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'user') or not g.user:
                return error_response("Acesso negado", status_code=401)
            
            # Admin sempre tem acesso
            if g.user.get('role') == 'admin':
                return f(*args, **kwargs)
            
            # Verificar se é o dono do recurso
            # O ID do usuário pode vir dos kwargs, args ou request data
            resource_user_id = kwargs.get(resource_user_id_key)
            if not resource_user_id:
                # Tentar buscar no request data se não estiver nos kwargs
                from flask import request
                if request.json:
                    resource_user_id = request.json.get(resource_user_id_key)
            
            if str(g.user['_id']) == str(resource_user_id):
                return f(*args, **kwargs)
            
            return error_response("Acesso negado - você só pode acessar seus próprios recursos", status_code=403)
        return decorated_function
    return decorator