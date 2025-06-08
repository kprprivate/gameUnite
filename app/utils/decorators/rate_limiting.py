from functools import wraps
from flask import request, jsonify, g
from datetime import datetime, timedelta
from collections import defaultdict
import logging

# Armazenamento em memória para rate limiting (em produção, usar Redis)
rate_limit_storage = defaultdict(list)

logger = logging.getLogger(__name__)

def rate_limit(requests_per_minute=60):
    """
    Decorator para implementar rate limiting baseado no IP ou usuário.
    
    Args:
        requests_per_minute (int): Número máximo de requests por minuto
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Identificar cliente (usuário logado ou IP)
            if hasattr(g, 'user') and g.user:
                client_id = f"user_{g.user['_id']}"
            else:
                client_id = f"ip_{request.remote_addr}"
            
            current_time = datetime.utcnow()
            
            # Limpar requests antigos (mais de 1 minuto)
            cutoff_time = current_time - timedelta(minutes=1)
            rate_limit_storage[client_id] = [
                req_time for req_time in rate_limit_storage[client_id] 
                if req_time > cutoff_time
            ]
            
            # Verificar se excedeu o limite
            if len(rate_limit_storage[client_id]) >= requests_per_minute:
                logger.warning(f"Rate limit excedido para {client_id}")
                return jsonify({
                    "success": False,
                    "message": "Muitas requisições. Tente novamente em alguns minutos.",
                    "retry_after": 60
                }), 429
            
            # Adicionar request atual
            rate_limit_storage[client_id].append(current_time)
            
            return f(*args, **kwargs)
        return decorated
    return decorator

def strict_rate_limit(requests_per_minute=10):
    """
    Rate limiting mais restritivo para operações críticas
    """
    return rate_limit(requests_per_minute)

def admin_rate_limit(requests_per_minute=120):
    """
    Rate limiting mais permissivo para admins
    """
    return rate_limit(requests_per_minute)