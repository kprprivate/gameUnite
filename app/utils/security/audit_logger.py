import logging
from datetime import datetime
from flask import request, g
from app.db.mongo_client import db
from bson import ObjectId
import json

class AuditLogger:
    """Sistema de auditoria para ações sensíveis"""
    
    @staticmethod
    def log_admin_action(action, resource_type, resource_id=None, old_data=None, new_data=None, success=True, error_message=None):
        """
        Registra ações administrativas
        
        Args:
            action (str): Tipo de ação (create, update, delete, view)
            resource_type (str): Tipo de recurso (ticket, game, category, etc.)
            resource_id (str): ID do recurso afetado
            old_data (dict): Dados anteriores (para updates)
            new_data (dict): Dados novos
            success (bool): Se a ação foi bem-sucedida
            error_message (str): Mensagem de erro se aplicável
        """
        try:
            admin_id = str(g.user['_id']) if hasattr(g, 'user') and g.user and '_id' in g.user else None
            
            audit_entry = {
                "timestamp": datetime.utcnow(),
                "admin_id": admin_id,
                "admin_username": g.user.get('username') if hasattr(g, 'user') and g.user else None,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "ip_address": request.remote_addr,
                "user_agent": request.headers.get('User-Agent'),
                "success": success,
                "error_message": error_message,
                "old_data": AuditLogger._sanitize_data(old_data),
                "new_data": AuditLogger._sanitize_data(new_data),
                "endpoint": request.endpoint,
                "method": request.method
            }
            
            # Salvar no MongoDB
            db.audit_logs.insert_one(audit_entry)
            
            # Log também no sistema de logging
            logger = logging.getLogger('audit')
            log_message = f"Admin {admin_id} {action} {resource_type} {resource_id} - Success: {success}"
            if success:
                logger.info(log_message)
            else:
                logger.warning(f"{log_message} - Error: {error_message}")
                
        except Exception as e:
            # Não deve falhar a operação principal se logging falhar
            logging.getLogger('audit').error(f"Falha ao registrar auditoria: {str(e)}")
    
    @staticmethod
    def log_security_event(event_type, description, severity="medium", user_id=None, additional_data=None):
        """
        Registra eventos de segurança
        
        Args:
            event_type (str): Tipo do evento (unauthorized_access, rate_limit_exceeded, etc.)
            description (str): Descrição do evento
            severity (str): Severidade (low, medium, high, critical)
            user_id (str): ID do usuário envolvido
            additional_data (dict): Dados adicionais
        """
        try:
            security_entry = {
                "timestamp": datetime.utcnow(),
                "event_type": event_type,
                "description": description,
                "severity": severity,
                "user_id": user_id,
                "ip_address": request.remote_addr,
                "user_agent": request.headers.get('User-Agent'),
                "endpoint": request.endpoint,
                "method": request.method,
                "additional_data": AuditLogger._sanitize_data(additional_data)
            }
            
            # Salvar no MongoDB
            db.security_logs.insert_one(security_entry)
            
            # Log crítico também no sistema de logging
            logger = logging.getLogger('security')
            if severity in ['high', 'critical']:
                logger.warning(f"SECURITY EVENT: {event_type} - {description} - User: {user_id} - IP: {request.remote_addr}")
            else:
                logger.info(f"Security event: {event_type} - {description}")
                
        except Exception as e:
            logging.getLogger('security').error(f"Falha ao registrar evento de segurança: {str(e)}")
    
    @staticmethod
    def log_data_access(resource_type, resource_ids, access_type="read", authorized=True):
        """
        Registra acesso a dados sensíveis
        
        Args:
            resource_type (str): Tipo de recurso acessado
            resource_ids (list): IDs dos recursos acessados
            access_type (str): Tipo de acesso (read, write, delete)
            authorized (bool): Se o acesso foi autorizado
        """
        try:
            user_id = str(g.user['_id']) if hasattr(g, 'user') and g.user and '_id' in g.user else None
            
            access_entry = {
                "timestamp": datetime.utcnow(),
                "user_id": user_id,
                "resource_type": resource_type,
                "resource_ids": resource_ids if isinstance(resource_ids, list) else [resource_ids],
                "access_type": access_type,
                "authorized": authorized,
                "ip_address": request.remote_addr,
                "endpoint": request.endpoint
            }
            
            # Salvar no MongoDB
            db.data_access_logs.insert_one(access_entry)
            
            if not authorized:
                AuditLogger.log_security_event(
                    "unauthorized_data_access",
                    f"Tentativa não autorizada de acesso a {resource_type}",
                    "high",
                    user_id,
                    {"resource_ids": resource_ids, "access_type": access_type}
                )
                
        except Exception as e:
            logging.getLogger('audit').error(f"Falha ao registrar acesso a dados: {str(e)}")
    
    @staticmethod
    def _sanitize_data(data):
        """Remove dados sensíveis dos logs e converte ObjectIds"""
        if not data:
            return data
        
        # Converter ObjectId para string
        if isinstance(data, ObjectId):
            return str(data)
            
        if isinstance(data, dict):
            sanitized = {}
            sensitive_fields = ['password', 'token', 'secret', 'key', 'credit_card', 'ssn']
            
            for key, value in data.items():
                if any(sensitive in key.lower() for sensitive in sensitive_fields):
                    sanitized[key] = "[REDACTED]"
                elif isinstance(value, ObjectId):
                    sanitized[key] = str(value)
                elif isinstance(value, dict):
                    sanitized[key] = AuditLogger._sanitize_data(value)
                elif isinstance(value, list):
                    sanitized[key] = [AuditLogger._sanitize_data(item) for item in value]
                else:
                    sanitized[key] = value
            return sanitized
        
        elif isinstance(data, list):
            return [AuditLogger._sanitize_data(item) for item in data]
        
        return data
    
    @staticmethod
    def get_admin_activity_report(admin_id=None, start_date=None, end_date=None, limit=100):
        """
        Gera relatório de atividades administrativas
        """
        try:
            query = {}
            
            if admin_id:
                query["admin_id"] = admin_id
            
            if start_date or end_date:
                date_query = {}
                if start_date:
                    date_query["$gte"] = start_date
                if end_date:
                    date_query["$lte"] = end_date
                query["timestamp"] = date_query
            
            activities = list(
                db.audit_logs.find(query)
                .sort("timestamp", -1)
                .limit(limit)
            )
            
            # Converter ObjectIds para strings
            for activity in activities:
                activity["_id"] = str(activity["_id"])
                if "admin_id" in activity and activity["admin_id"]:
                    activity["admin_id"] = str(activity["admin_id"])
                if "user_id" in activity and activity["user_id"]:
                    activity["user_id"] = str(activity["user_id"])
            
            return activities
            
        except Exception as e:
            logging.getLogger('audit').error(f"Erro ao gerar relatório de atividades: {str(e)}")
            return []