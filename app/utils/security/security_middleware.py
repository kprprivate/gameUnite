from flask import request, g
from app.utils.security.audit_logger import AuditLogger
import logging

class SecurityMiddleware:
    """Middleware para detectar e registrar tentativas de acesso suspeitas"""
    
    @staticmethod
    def detect_unauthorized_access():
        """Detecta tentativas de acesso não autorizado"""
        
        # Detectar tentativas de SQL injection (mesmo sendo MongoDB)
        suspicious_patterns = [
            'union select', 'drop table', 'delete from', 'insert into',
            'update set', 'or 1=1', 'and 1=1', '--', ';--',
            '<script>', 'javascript:', 'eval(', 'document.cookie'
        ]
        
        # Verificar parâmetros da query string
        query_string = request.query_string.decode('utf-8').lower()
        for pattern in suspicious_patterns:
            if pattern in query_string:
                AuditLogger.log_security_event(
                    event_type="suspicious_query_param",
                    description=f"Parâmetro suspeito detectado: {pattern}",
                    severity="medium",
                    user_id=g.user['_id'] if hasattr(g, 'user') and g.user else None,
                    additional_data={"query_string": request.query_string.decode('utf-8')[:200]}
                )
                break
        
        # Verificar payload JSON
        if request.is_json:
            try:
                data = request.get_json()
                if data:
                    json_str = str(data).lower()
                    for pattern in suspicious_patterns:
                        if pattern in json_str:
                            AuditLogger.log_security_event(
                                event_type="suspicious_json_payload",
                                description=f"Payload suspeito detectado: {pattern}",
                                severity="medium",
                                user_id=g.user['_id'] if hasattr(g, 'user') and g.user else None,
                                additional_data={"payload_sample": str(data)[:200]}
                            )
                            break
            except:
                pass
    
    @staticmethod
    def detect_admin_bypass_attempt():
        """Detecta tentativas de bypass de controle admin"""
        
        # Verificar se endpoint admin está sendo acessado sem autenticação adequada
        if '/admin/' in request.path:
            if not hasattr(g, 'user') or not g.user:
                AuditLogger.log_security_event(
                    event_type="admin_bypass_attempt",
                    description="Tentativa de acesso a endpoint admin sem autenticação",
                    severity="high",
                    additional_data={"endpoint": request.path, "method": request.method}
                )
            elif g.user.get('role') not in ['admin', 'support']:
                AuditLogger.log_security_event(
                    event_type="admin_privilege_escalation",
                    description="Usuário sem privilégios tentou acessar endpoint admin",
                    severity="high",
                    user_id=g.user['_id'],
                    additional_data={
                        "endpoint": request.path,
                        "user_role": g.user.get('role'),
                        "username": g.user.get('username')
                    }
                )
    
    @staticmethod
    def detect_enumeration_attempt():
        """Detecta tentativas de enumeração de recursos"""
        
        # Verificar padrões de requisições sequenciais que podem indicar enumeração
        # (Implementação simplificada - em produção usar cache distribuído)
        
        # Detectar múltiplos IDs inválidos em sequência
        if any(param.endswith('_id') for param in request.view_args or {}):
            for param_name, param_value in (request.view_args or {}).items():
                if param_name.endswith('_id') and param_value:
                    # Verificar se é um ObjectId válido
                    if len(param_value) != 24 or not all(c in '0123456789abcdef' for c in param_value.lower()):
                        AuditLogger.log_security_event(
                            event_type="resource_enumeration",
                            description=f"ID inválido usado para enumeração: {param_name}",
                            severity="low",
                            user_id=g.user['_id'] if hasattr(g, 'user') and g.user else None,
                            additional_data={"invalid_id": param_value, "parameter": param_name}
                        )
    
    @staticmethod
    def check_request_security():
        """Função principal para verificar segurança da requisição"""
        try:
            SecurityMiddleware.detect_unauthorized_access()
            SecurityMiddleware.detect_admin_bypass_attempt()
            SecurityMiddleware.detect_enumeration_attempt()
        except Exception as e:
            # Não deve falhar a requisição se houver erro no middleware de segurança
            logging.getLogger('security').error(f"Erro no middleware de segurança: {str(e)}")

# Função para registrar o middleware
def register_security_middleware(app):
    """Registra o middleware de segurança na aplicação Flask"""
    
    @app.before_request
    def before_request():
        SecurityMiddleware.check_request_security()
    
    @app.after_request
    def after_request(response):
        # Adicionar headers de segurança
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Remover headers que revelam informações do servidor
        response.headers.pop('Server', None)
        response.headers.pop('X-Powered-By', None)
        
        return response