from datetime import datetime
from bson import ObjectId
from app.db.mongo_client import db
from app.models.support_ticket.schema import (
    SupportTicket, SupportTicketCreate, SupportTicketUpdate,
    SellerRating, SellerRatingCreate, GameCategory, GameCategoryCreate, GameCategoryUpdate
)

def convert_objectids(obj):
    """Converte recursivamente ObjectIds para strings"""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: convert_objectids(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectids(item) for item in obj]
    else:
        return obj

class SupportService:
    
    @staticmethod
    def create_ticket(user_id, data):
        ticket_data = SupportTicketCreate(**data)
        
        # Generate protocol number
        protocol_number = SupportService.generate_protocol_number()
        
        # Garantir que user_id seja sempre ObjectId para consistência
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        ticket = {
            "user_id": user_id,
            "protocol_number": protocol_number,
            "subject": ticket_data.subject,
            "message": ticket_data.message,
            "category": ticket_data.category,
            "priority": ticket_data.priority,
            "status": "open",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = db.support_tickets.insert_one(ticket)
        ticket["_id"] = str(result.inserted_id)
        ticket["user_id"] = str(ticket["user_id"])
        
        return {"ticket": ticket}
    
    @staticmethod
    def generate_protocol_number():
        """Generate a unique protocol number for support tickets"""
        import random
        import string
        from datetime import datetime
        
        # Format: SUP-YYYY-NNNNNN (e.g., SUP-2025-000123)
        year = datetime.now().year
        
        # Get the count of tickets created this year
        start_of_year = datetime(year, 1, 1)
        ticket_count = db.support_tickets.count_documents({
            "created_at": {"$gte": start_of_year}
        })
        
        # Increment for next ticket
        next_number = ticket_count + 1
        
        # Format with leading zeros
        protocol_number = f"SUP-{year}-{next_number:06d}"
        
        # Ensure uniqueness (in rare case of concurrent creation)
        while db.support_tickets.find_one({"protocol_number": protocol_number}):
            next_number += 1
            protocol_number = f"SUP-{year}-{next_number:06d}"
        
        return protocol_number
    
    @staticmethod
    def get_user_tickets(user_id):
        print(f"🔍 SupportService.get_user_tickets - user_id: {user_id} (tipo: {type(user_id)})")
        
        # Buscar com AMBOS os tipos - string E ObjectId
        # Isso resolve a inconsistência no banco de dados
        user_id_str = str(user_id)
        
        try:
            user_id_obj = ObjectId(user_id_str)
        except:
            user_id_obj = user_id
            
        query = {
            "$or": [
                {"user_id": user_id_str},      # Para tickets salvos como string
                {"user_id": user_id_obj}       # Para tickets salvos como ObjectId
            ]
        }
        
        print(f"📋 Query: buscar user_id como string OU ObjectId")
        
        tickets = list(db.support_tickets.find(query).sort("created_at", -1))
        print(f"📄 Tickets encontrados no banco: {len(tickets)}")
        
        for i, ticket in enumerate(tickets):
            print(f"  Ticket {i+1}: ID={ticket['_id']}, Protocol={ticket.get('protocol_number', 'SEM PROTOCOL')}, user_id_type={type(ticket['user_id'])}")
            ticket["_id"] = str(ticket["_id"])
            if "user_id" in ticket:
                ticket["user_id"] = str(ticket["user_id"])
                
        result = {"tickets": tickets}
        print(f"🎯 Retornando: {result}")
        return result
    
    @staticmethod
    def get_ticket_by_protocol(protocol_number, user_id):
        """Buscar ticket por protocolo (apenas do usuário)"""
        try:
            print(f"🔍 SupportService: Buscando protocolo {protocol_number} para user {user_id}")
            
            # Buscar com AMBOS os tipos - string E ObjectId
            user_id_str = str(user_id)
            
            try:
                user_id_obj = ObjectId(user_id_str)
            except:
                user_id_obj = user_id
            
            query = {
                "protocol_number": protocol_number,
                "$or": [
                    {"user_id": user_id_str},      # Para tickets salvos como string
                    {"user_id": user_id_obj}       # Para tickets salvos como ObjectId
                ]
            }
            
            print(f"📋 Query MongoDB: buscar protocolo {protocol_number} com user_id como string OU ObjectId")
            
            ticket = db.support_tickets.find_one(query)
            
            print(f"📄 Resultado do MongoDB: {ticket}")
            
            if ticket:
                ticket["_id"] = str(ticket["_id"])
                ticket["user_id"] = str(ticket["user_id"])
                
            return ticket
        except Exception as e:
            print(f"❌ Erro no get_ticket_by_protocol: {str(e)}")
            return None
    
    @staticmethod
    def get_ticket_by_id(ticket_id):
        """Buscar ticket por ID para auditoria"""
        try:
            ticket = db.support_tickets.find_one({"_id": ObjectId(ticket_id)})
            if ticket:
                ticket["_id"] = str(ticket["_id"])
                if "user_id" in ticket:
                    ticket["user_id"] = str(ticket["user_id"])
            return ticket
        except:
            return None
    
    @staticmethod
    def get_ticket_by_id_and_user(ticket_id, user_id):
        """Buscar ticket por ID (apenas do usuário)"""
        try:
            # Buscar com AMBOS os tipos - string E ObjectId
            user_id_str = str(user_id)
            
            try:
                user_id_obj = ObjectId(user_id_str)
            except:
                user_id_obj = user_id
            
            query = {
                "_id": ObjectId(ticket_id),
                "$or": [
                    {"user_id": user_id_str},      # Para tickets salvos como string
                    {"user_id": user_id_obj}       # Para tickets salvos como ObjectId
                ]
            }
            
            ticket = db.support_tickets.find_one(query)
            
            if ticket:
                ticket["_id"] = str(ticket["_id"])
                ticket["user_id"] = str(ticket["user_id"])
                
            return ticket
        except:
            return None
    
    @staticmethod
    def add_ticket_reply(ticket_id, user_id, message):
        """Adicionar resposta/informação adicional ao ticket"""
        try:
            # Buscar com AMBOS os tipos - string E ObjectId
            user_id_str = str(user_id)
            
            try:
                user_id_obj = ObjectId(user_id_str)
            except:
                user_id_obj = user_id
            
            # Verificar se o ticket existe e pertence ao usuário
            ticket = db.support_tickets.find_one({
                "_id": ObjectId(ticket_id),
                "$or": [
                    {"user_id": user_id_str},      # Para tickets salvos como string
                    {"user_id": user_id_obj}       # Para tickets salvos como ObjectId
                ]
            })
            
            if not ticket:
                return None
            
            # Verificar se o ticket ainda está aberto
            if ticket["status"] not in ["open", "in_progress"]:
                return None
            
            # Adicionar a mensagem como resposta adicional do usuário
            additional_info = ticket.get("additional_info", [])
            additional_info.append({
                "message": message,
                "created_at": datetime.utcnow(),
                "from_user": True
            })
            
            # Atualizar ticket
            update_data = {
                "additional_info": additional_info,
                "updated_at": datetime.utcnow()
            }
            
            db.support_tickets.update_one(
                {"_id": ObjectId(ticket_id)},
                {"$set": update_data}
            )
            
            # Buscar ticket atualizado
            updated_ticket = db.support_tickets.find_one({"_id": ObjectId(ticket_id)})
            if updated_ticket:
                updated_ticket["_id"] = str(updated_ticket["_id"])
                updated_ticket["user_id"] = str(updated_ticket["user_id"])
                
            return updated_ticket
        except Exception as e:
            print(f"Erro ao adicionar resposta ao ticket: {str(e)}")
            return None
    
    @staticmethod
    def get_all_tickets(page=1, limit=10, status=None, category=None, priority=None):
        query = {}
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        if priority:
            query["priority"] = priority
        
        skip = (page - 1) * limit
        
        pipeline = [
            {"$match": query},
            # Converter user_id para ObjectId se for string
            {"$addFields": {
                "user_id_object": {
                    "$cond": {
                        "if": {"$type": "$user_id"},
                        "then": {
                            "$cond": {
                                "if": {"$eq": [{"$type": "$user_id"}, "string"]},
                                "then": {"$toObjectId": "$user_id"},
                                "else": "$user_id"
                            }
                        },
                        "else": "$user_id"
                    }
                }
            }},
            {"$lookup": {
                "from": "users",
                "localField": "user_id_object",
                "foreignField": "_id",
                "as": "user"
            }},
            {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        tickets = list(db.support_tickets.aggregate(pipeline))
        total = db.support_tickets.count_documents(query)
        
        for ticket in tickets:
            ticket["_id"] = str(ticket["_id"])
            if "user_id" in ticket:
                ticket["user_id"] = str(ticket["user_id"])
            if "user" in ticket and ticket["user"]:
                ticket["user"]["_id"] = str(ticket["user"]["_id"])
            if "admin_id" in ticket and ticket["admin_id"]:
                ticket["admin_id"] = str(ticket["admin_id"])
        
        result = {
            "tickets": tickets,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
        
        # Converter todos os ObjectIds recursivamente
        return convert_objectids(result)
    
    @staticmethod
    def update_ticket(ticket_id, admin_id, data):
        update_data = SupportTicketUpdate(**data)
        
        update_fields = {}
        if update_data.status:
            update_fields["status"] = update_data.status
            if update_data.status == "resolved":
                update_fields["resolved_at"] = datetime.utcnow()
        
        if update_data.admin_response:
            update_fields["admin_response"] = update_data.admin_response
            update_fields["admin_id"] = admin_id
        
        if update_data.priority:
            update_fields["priority"] = update_data.priority
        
        update_fields["updated_at"] = datetime.utcnow()
        
        result = db.support_tickets.find_one_and_update(
            {"_id": ObjectId(ticket_id)},
            {"$set": update_fields},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
            if "user_id" in result:
                result["user_id"] = str(result["user_id"])
            if "admin_id" in result and result["admin_id"]:
                result["admin_id"] = str(result["admin_id"])
        
        return result
    
    @staticmethod
    def create_game(data):
        game = {
            "name": data.get("name"),
            "description": data.get("description", ""),
            "image_url": data.get("image_url", ""),
            "category": data.get("category", ""),
            "platform": data.get("platform", "PC"),
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = db.games.insert_one(game)
        game["_id"] = str(result.inserted_id)
        
        return game
    
    @staticmethod
    def update_game(game_id, data):
        update_fields = {}
        
        if "name" in data:
            update_fields["name"] = data["name"]
        if "description" in data:
            update_fields["description"] = data["description"]
        if "image_url" in data:
            update_fields["image_url"] = data["image_url"]
        if "category" in data:
            update_fields["category"] = data["category"]
        if "platform" in data:
            update_fields["platform"] = data["platform"]
        if "is_active" in data:
            update_fields["is_active"] = data["is_active"]
        
        update_fields["updated_at"] = datetime.utcnow()
        
        result = db.games.find_one_and_update(
            {"_id": ObjectId(game_id)},
            {"$set": update_fields},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
        
        return result
    
    @staticmethod
    def delete_game(game_id):
        db.games.update_one(
            {"_id": ObjectId(game_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
    
    @staticmethod
    def get_all_categories():
        categories = list(db.game_categories.find({"is_active": True}))
        for category in categories:
            category["_id"] = str(category["_id"])
        return categories
    
    @staticmethod
    def create_category(data):
        category_data = GameCategoryCreate(**data)
        
        category = {
            "name": category_data.name,
            "description": category_data.description,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        
        result = db.game_categories.insert_one(category)
        category["_id"] = str(result.inserted_id)
        
        return category
    
    @staticmethod
    def update_category(category_id, data):
        update_data = GameCategoryUpdate(**data)
        
        update_fields = {}
        if update_data.name:
            update_fields["name"] = update_data.name
        if update_data.description is not None:
            update_fields["description"] = update_data.description
        if update_data.is_active is not None:
            update_fields["is_active"] = update_data.is_active
        
        result = db.game_categories.find_one_and_update(
            {"_id": ObjectId(category_id)},
            {"$set": update_fields},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
        
        return result
    
    @staticmethod
    def delete_category(category_id):
        db.game_categories.update_one(
            {"_id": ObjectId(category_id)},
            {"$set": {"is_active": False}}
        )
    
    @staticmethod
    def submit_rating(order_id, user_id, data):
        try:
            # Buscar pedido com validação de ObjectId
            order = db.orders.find_one({"_id": ObjectId(order_id)})
            if not order:
                raise ValueError("Pedido não encontrado")
            
            # Verificar se o pedido está em status adequado para avaliação
            valid_statuses = ["completed", "delivered"]
            if order.get("status") not in valid_statuses:
                raise ValueError("Pedido deve estar completo para avaliar")
            
            rating_data = SellerRatingCreate(**data)
            
            # CRÍTICO: Verificar se o usuário pertence ao pedido
            # Converter IDs para string para comparação consistente
            order_buyer_id = str(order.get("buyer_id", ""))
            order_seller_id = str(order.get("seller_id", ""))
            current_user_id = str(user_id)
            
            is_buyer = order_buyer_id == current_user_id
            is_seller = order_seller_id == current_user_id
            
            if not (is_buyer or is_seller):
                raise ValueError("Usuário não autorizado para avaliar este pedido")
            
            # Verificar se já avaliou
            if is_buyer and order.get("seller_rating"):
                raise ValueError("Você já avaliou este vendedor")
            elif is_seller and order.get("buyer_rating"):
                raise ValueError("Você já avaliou este comprador")
            
            # Preparar campos para atualização
            update_fields = {}
            target_user_id = None
            
            if is_buyer:
                # Comprador avaliando vendedor
                update_fields["seller_rating"] = rating_data.rating
                if rating_data.comment:
                    update_fields["seller_review"] = rating_data.comment
                target_user_id = order_seller_id
            else:
                # Vendedor avaliando comprador
                update_fields["buyer_rating"] = rating_data.rating
                if rating_data.comment:
                    update_fields["buyer_review"] = rating_data.comment
                target_user_id = order_buyer_id
            
            # Verificar se ambas as avaliações foram feitas para marcar como completo
            if is_buyer and order.get("buyer_rating"):
                update_fields["rating_submitted"] = True
            elif is_seller and order.get("seller_rating"):
                update_fields["rating_submitted"] = True
            
            # Atualizar pedido
            result = db.orders.update_one(
                {"_id": ObjectId(order_id)},
                {"$set": update_fields}
            )
            
            if result.modified_count == 0:
                raise ValueError("Falha ao atualizar pedido com avaliação")
            
            # Salvar avaliação separada para histórico
            rating = {
                "order_id": order_id,
                "rated_user_id": target_user_id,  # Usuário que foi avaliado
                "rating_user_id": current_user_id,  # Usuário que fez a avaliação
                "rating": rating_data.rating,
                "comment": rating_data.comment,
                "created_at": datetime.utcnow()
            }
            
            result = db.seller_ratings.insert_one(rating)
            rating["_id"] = str(result.inserted_id)
            
            return rating
            
        except ValueError:
            # Re-raise ValueError para tratamento específico na rota
            raise
        except Exception as e:
            raise Exception(f"Erro ao processar avaliação: {str(e)}")
    
    @staticmethod
    def get_admin_stats():
        try:
            # Contar tickets
            total_tickets = db.support_tickets.count_documents({})
            open_tickets = db.support_tickets.count_documents({"status": "open"})
            in_progress_tickets = db.support_tickets.count_documents({"status": "in_progress"})
            
            # Contar jogos - verificar se existe is_active field
            total_games = db.games.count_documents({})
            active_games = db.games.count_documents({"$or": [{"is_active": True}, {"is_active": {"$exists": False}}]})
            
            # Contar usuários
            total_users = db.users.count_documents({})
            active_users = db.users.count_documents({"$or": [{"is_active": True}, {"is_active": {"$exists": False}}]})
            
            # Contar pedidos
            total_orders = db.orders.count_documents({})
            completed_orders = db.orders.count_documents({"status": "completed"})
            pending_orders = db.orders.count_documents({"status": "pending"})
            
            # Calcular receita
            try:
                pipeline = [
                    {"$match": {"status": "completed"}},
                    {"$group": {"_id": None, "total": {"$sum": "$total_price"}}}
                ]
                revenue_result = list(db.orders.aggregate(pipeline))
                total_revenue = revenue_result[0]["total"] if revenue_result else 0
            except:
                total_revenue = 0
            
            # Tickets recentes
            recent_tickets = list(db.support_tickets.find().sort("created_at", -1).limit(5))
            for ticket in recent_tickets:
                ticket["_id"] = str(ticket["_id"])
                if "user_id" in ticket and ticket["user_id"]:
                    ticket["user_id"] = str(ticket["user_id"])
                if "admin_id" in ticket and ticket["admin_id"]:
                    ticket["admin_id"] = str(ticket["admin_id"])
            
            # Últimos usuários registrados
            recent_users = list(db.users.find({}, {"username": 1, "created_at": 1, "role": 1}).sort("created_at", -1).limit(5))
            for user in recent_users:
                user["_id"] = str(user["_id"])
            
            stats = {
                "tickets": {
                    "total": total_tickets,
                    "open": open_tickets,
                    "in_progress": in_progress_tickets,
                    "recent": recent_tickets
                },
                "games": {
                    "total": total_games,
                    "active": active_games
                },
                "users": {
                    "total": total_users,
                    "active": active_users,
                    "recent": recent_users
                },
                "orders": {
                    "total": total_orders,
                    "completed": completed_orders,
                    "pending": pending_orders
                },
                "revenue": {
                    "total": float(total_revenue),
                    "monthly": float(total_revenue * 0.8)  # Estimativa mês atual
                }
            }
            
            # Converter todos os ObjectIds para strings recursivamente
            return convert_objectids(stats)
        except Exception as e:
            print(f"Erro ao calcular estatísticas: {str(e)}")
            # Retornar stats padrão em caso de erro
            return convert_objectids({
                "tickets": {"total": 0, "open": 0, "in_progress": 0, "recent": []},
                "games": {"total": 0, "active": 0},
                "users": {"total": 0, "active": 0, "recent": []},
                "orders": {"total": 0, "completed": 0, "pending": 0},
                "revenue": {"total": 0.0, "monthly": 0.0}
            })