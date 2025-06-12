from datetime import datetime
from bson import ObjectId
from app.db.mongo_client import db
from app.models.notification.schema import NotificationCreate, ReportCreate
import logging

logger = logging.getLogger(__name__)

def validate_object_id(obj_id):
    """Valida se um ID é um ObjectId válido."""
    if not obj_id:
        return False
    try:
        ObjectId(obj_id)
        return True
    except:
        return False

def create_notification(user_id, notification_type, title, message, data=None):
    """Cria uma nova notificação."""
    try:
        if not validate_object_id(user_id):
            return {"success": False, "message": "ID de usuário inválido"}

        notification_data = {
            "user_id": ObjectId(user_id),
            "type": notification_type,
            "title": title,
            "message": message,
            "read": False,
            "data": data or {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = db.notifications.insert_one(notification_data)
        
        if result.inserted_id:
            logger.info(f"Notificação criada para usuário {user_id}: {title}")
            
            # Removed real-time WebSocket notifications to prevent flooding
            # Notifications will be loaded when user refreshes or navigates
            
            return {
                "success": True,
                "message": "Notificação criada com sucesso",
                "notification_id": str(result.inserted_id)
            }
        else:
            return {"success": False, "message": "Erro ao criar notificação"}

    except Exception as e:
        logger.error(f"Erro ao criar notificação: {e}")
        return {"success": False, "message": "Erro interno ao criar notificação"}

def get_user_notifications(user_id, limit=20, skip=0, filter_type=None):
    """Busca notificações de um usuário."""
    try:
        if not validate_object_id(user_id):
            return {"success": False, "message": "ID de usuário inválido"}

        query = {"user_id": ObjectId(user_id)}
        
        if filter_type == "unread":
            query["read"] = False
        elif filter_type == "read":
            query["read"] = True

        notifications_cursor = db.notifications.find(query).sort("created_at", -1).skip(skip).limit(limit)
        
        notifications = []
        for notification in notifications_cursor:
            notifications.append({
                "_id": str(notification["_id"]),
                "user_id": str(notification["user_id"]),
                "type": notification["type"],
                "title": notification["title"],
                "message": notification["message"],
                "read": notification["read"],
                "data": notification.get("data", {}),
                "created_at": notification["created_at"].isoformat(),
                "updated_at": notification["updated_at"].isoformat()
            })

        total_count = db.notifications.count_documents(query)
        unread_count = db.notifications.count_documents({
            "user_id": ObjectId(user_id),
            "read": False
        })

        return {
            "success": True,
            "notifications": notifications,
            "total": total_count,
            "unread_count": unread_count
        }

    except Exception as e:
        logger.error(f"Erro ao buscar notificações: {e}")
        return {"success": False, "message": "Erro interno ao buscar notificações"}

def mark_notification_as_read(notification_id, user_id):
    """Marca uma notificação como lida."""
    try:
        if not validate_object_id(notification_id) or not validate_object_id(user_id):
            return {"success": False, "message": "IDs inválidos"}

        result = db.notifications.update_one(
            {
                "_id": ObjectId(notification_id),
                "user_id": ObjectId(user_id)
            },
            {
                "$set": {
                    "read": True,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        if result.modified_count > 0:
            return {"success": True, "message": "Notificação marcada como lida"}
        else:
            return {"success": False, "message": "Notificação não encontrada"}

    except Exception as e:
        logger.error(f"Erro ao marcar notificação como lida: {e}")
        return {"success": False, "message": "Erro interno"}

def mark_all_notifications_as_read(user_id):
    """Marca todas as notificações de um usuário como lidas."""
    try:
        if not validate_object_id(user_id):
            return {"success": False, "message": "ID de usuário inválido"}

        result = db.notifications.update_many(
            {
                "user_id": ObjectId(user_id),
                "read": False
            },
            {
                "$set": {
                    "read": True,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return {
            "success": True,
            "message": f"{result.modified_count} notificações marcadas como lidas"
        }

    except Exception as e:
        logger.error(f"Erro ao marcar todas as notificações como lidas: {e}")
        return {"success": False, "message": "Erro interno"}

def delete_notification(notification_id, user_id):
    """Remove uma notificação."""
    try:
        if not validate_object_id(notification_id) or not validate_object_id(user_id):
            return {"success": False, "message": "IDs inválidos"}

        result = db.notifications.delete_one({
            "_id": ObjectId(notification_id),
            "user_id": ObjectId(user_id)
        })

        if result.deleted_count > 0:
            return {"success": True, "message": "Notificação removida"}
        else:
            return {"success": False, "message": "Notificação não encontrada"}

    except Exception as e:
        logger.error(f"Erro ao remover notificação: {e}")
        return {"success": False, "message": "Erro interno"}

def create_report(reporter_id, reported_item_id, reported_item_type, reason, details=None):
    """Cria um novo report."""
    try:
        if not validate_object_id(reporter_id):
            return {"success": False, "message": "ID de usuário inválido"}

        report_data = {
            "reporter_id": ObjectId(reporter_id),
            "reported_item_id": reported_item_id,
            "reported_item_type": reported_item_type,
            "reason": reason,
            "details": details,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = db.reports.insert_one(report_data)
        
        if result.inserted_id:
            # Criar notificação para admins
            create_admin_notification(
                "report",
                "Novo report recebido",
                f"Um novo report foi criado para {reported_item_type}",
                {
                    "report_id": str(result.inserted_id),
                    "reported_item_id": reported_item_id,
                    "reported_item_type": reported_item_type,
                    "reason": reason
                }
            )
            
            return {
                "success": True,
                "message": "Report enviado com sucesso",
                "report_id": str(result.inserted_id)
            }
        else:
            return {"success": False, "message": "Erro ao criar report"}

    except Exception as e:
        logger.error(f"Erro ao criar report: {e}")
        return {"success": False, "message": "Erro interno ao criar report"}

def create_admin_notification(notification_type, title, message, data=None):
    """Cria notificação para todos os administradores."""
    try:
        # Buscar todos os usuários admin
        admins = db.users.find({"role": "admin"})
        
        for admin in admins:
            create_notification(str(admin["_id"]), notification_type, title, message, data)
        
        return {"success": True, "message": "Notificações criadas para admins"}

    except Exception as e:
        logger.error(f"Erro ao criar notificações para admins: {e}")
        return {"success": False, "message": "Erro interno"}

def get_reports(limit=50, skip=0, status_filter=None):
    """Busca reports para administradores."""
    try:
        query = {}
        if status_filter:
            query["status"] = status_filter

        reports_cursor = db.reports.find(query).sort("created_at", -1).skip(skip).limit(limit)
        
        reports = []
        for report in reports_cursor:
            # Buscar dados do reporter
            reporter = db.users.find_one({"_id": report["reporter_id"]})
            
            report_data = {
                "_id": str(report["_id"]),
                "reporter_id": str(report["reporter_id"]),
                "reporter": {
                    "username": reporter.get("username", "Usuário removido") if reporter else "Usuário removido",
                    "first_name": reporter.get("first_name", "") if reporter else "",
                    "last_name": reporter.get("last_name", "") if reporter else ""
                },
                "reported_item_id": report["reported_item_id"],
                "reported_item_type": report["reported_item_type"],
                "reason": report["reason"],
                "details": report.get("details", ""),
                "status": report["status"],
                "admin_notes": report.get("admin_notes", ""),
                "reviewed_by": report.get("reviewed_by", ""),
                "reviewed_at": report.get("reviewed_at"),
                "created_at": report["created_at"].isoformat(),
                "updated_at": report["updated_at"].isoformat()
            }
            
            reports.append(report_data)

        total_count = db.reports.count_documents(query)

        return {
            "success": True,
            "reports": reports,
            "total": total_count
        }

    except Exception as e:
        logger.error(f"Erro ao buscar reports: {e}")
        return {"success": False, "message": "Erro interno ao buscar reports"}

# Funções auxiliares para criar notificações específicas

def notify_new_question(ad_owner_id, questioner_name, ad_title, question_text):
    """Notifica sobre nova pergunta em anúncio."""
    return create_notification(
        ad_owner_id,
        "question",
        "Nova pergunta no seu anúncio",
        f"{questioner_name} perguntou: \"{question_text[:100]}{'...' if len(question_text) > 100 else ''}\"",
        {
            "ad_title": ad_title,
            "questioner_name": questioner_name
        }
    )

def notify_order_status_change(user_id, order_id, status, product_title):
    """Notifica sobre mudança de status do pedido."""
    status_messages = {
        "confirmed": "confirmado",
        "shipped": "enviado",
        "delivered": "entregue",
        "cancelled": "cancelado"
    }
    
    status_text = status_messages.get(status, status)
    
    return create_notification(
        user_id,
        "order",
        f"Pedido {status_text}",
        f"Seu pedido \"{product_title}\" foi {status_text}",
        {
            "order_id": order_id,
            "status": status,
            "product_title": product_title
        }
    )

def notify_ad_favorited(ad_owner_id, favoriter_name, ad_title):
    """Notifica sobre anúncio favoritado."""
    return create_notification(
        ad_owner_id,
        "favorite",
        "Anúncio favoritado",
        f"{favoriter_name} favoritou seu anúncio \"{ad_title}\"",
        {
            "ad_title": ad_title,
            "favoriter_name": favoriter_name
        }
    )