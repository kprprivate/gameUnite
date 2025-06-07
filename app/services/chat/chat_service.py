from datetime import datetime
from bson import ObjectId
from app.db.mongo_client import db
from app.models.user.crud import get_user_by_id


def create_chat_room(order_id):
    """Cria uma sala de chat para um pedido."""
    try:
        # Verificar se já existe chat room para este pedido
        existing_room = db.chat_rooms.find_one({"order_id": ObjectId(order_id)})
        if existing_room:
            existing_room["_id"] = str(existing_room["_id"])
            existing_room["order_id"] = str(existing_room["order_id"])
            existing_room["buyer_id"] = str(existing_room["buyer_id"])
            existing_room["seller_id"] = str(existing_room["seller_id"])
            return {"success": True, "data": {"room": existing_room}}

        # Buscar dados do pedido
        order = db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            return {"success": False, "message": "Pedido não encontrado"}

        # Criar sala de chat
        chat_room = {
            "order_id": ObjectId(order_id),
            "buyer_id": order["buyer_id"],
            "seller_id": order["seller_id"],
            "admin_id": None,
            "has_support_request": False,
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = db.chat_rooms.insert_one(chat_room)
        chat_room["_id"] = str(result.inserted_id)
        chat_room["order_id"] = str(chat_room["order_id"])
        chat_room["buyer_id"] = str(chat_room["buyer_id"])
        chat_room["seller_id"] = str(chat_room["seller_id"])

        # Adicionar mensagem de sistema de boas-vindas
        welcome_message = {
            "room_id": result.inserted_id,
            "user_id": None,
            "user_role": None,
            "content": f"💬 Chat criado para o pedido. Conversem sobre detalhes da transação.",
            "is_system": True,
            "created_at": datetime.utcnow(),
            "read_by": []
        }
        db.chat_messages.insert_one(welcome_message)

        return {
            "success": True,
            "data": {"room": chat_room},
            "message": "Sala de chat criada com sucesso"
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao criar sala de chat: {str(e)}"}


def get_chat_room(order_id, user_id):
    """Busca a sala de chat de um pedido."""
    try:
        # Buscar sala de chat
        room = db.chat_rooms.find_one({"order_id": ObjectId(order_id)})
        if not room:
            # Criar sala se não existir
            return create_chat_room(order_id)

        # Verificar se o usuário tem acesso à sala
        if str(room["buyer_id"]) != str(user_id) and str(room["seller_id"]) != str(user_id):
            return {"success": False, "message": "Acesso negado à sala de chat"}

        # Converter ObjectIds
        room["_id"] = str(room["_id"])
        room["order_id"] = str(room["order_id"])
        room["buyer_id"] = str(room["buyer_id"])
        room["seller_id"] = str(room["seller_id"])

        return {
            "success": True,
            "data": {"room": room}
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao buscar sala de chat: {str(e)}"}


def get_chat_messages(room_id, user_id, limit=50, skip=0):
    """Busca mensagens de uma sala de chat."""
    try:
        # Verificar se o usuário tem acesso à sala
        room = db.chat_rooms.find_one({"_id": ObjectId(room_id)})
        if not room:
            return {"success": False, "message": "Sala de chat não encontrada"}

        if str(room["buyer_id"]) != str(user_id) and str(room["seller_id"]) != str(user_id):
            return {"success": False, "message": "Acesso negado"}

        # Buscar mensagens
        messages_cursor = db.chat_messages.find({"room_id": ObjectId(room_id)}) \
            .sort("created_at", -1) \
            .skip(skip) \
            .limit(limit)

        messages = list(messages_cursor)
        messages.reverse()  # Inverter para ordem cronológica

        # Converter ObjectIds e adicionar dados do usuário
        for message in messages:
            message["_id"] = str(message["_id"])
            message["room_id"] = str(message["room_id"])

            if message["user_id"]:
                message["user_id"] = str(message["user_id"])
                # Buscar dados do usuário
                user = get_user_by_id(message["user_id"])
                message["user"] = {
                    "username": user["username"] if user else "Usuário",
                    "first_name": user.get("first_name", "") if user else "",
                    "profile_pic": user.get("profile_pic", "") if user else ""
                }

        # Marcar mensagens como lidas pelo usuário atual
        db.chat_messages.update_many(
            {
                "room_id": ObjectId(room_id),
                "read_by": {"$ne": ObjectId(user_id)}
            },
            {"$addToSet": {"read_by": ObjectId(user_id)}}
        )

        return {
            "success": True,
            "data": {"messages": messages}
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao buscar mensagens: {str(e)}"}


def send_message(room_id, user_id, content, user_role=None):
    """Envia uma mensagem para a sala de chat."""
    try:
        # Verificar se o usuário tem acesso à sala
        room = db.chat_rooms.find_one({"_id": ObjectId(room_id)})
        if not room:
            return {"success": False, "message": "Sala de chat não encontrada"}

        if str(room["buyer_id"]) != str(user_id) and str(room["seller_id"]) != str(user_id):
            return {"success": False, "message": "Acesso negado"}

        # Determinar role do usuário
        if not user_role:
            if str(room["buyer_id"]) == str(user_id):
                user_role = "buyer"
            elif str(room["seller_id"]) == str(user_id):
                user_role = "seller"

        # Criar mensagem
        message = {
            "room_id": ObjectId(room_id),
            "user_id": ObjectId(user_id),
            "user_role": user_role,
            "content": content.strip(),
            "is_system": False,
            "created_at": datetime.utcnow(),
            "read_by": [ObjectId(user_id)]  # Marcado como lido pelo remetente
        }

        result = db.chat_messages.insert_one(message)

        # Atualizar timestamp da sala
        db.chat_rooms.update_one(
            {"_id": ObjectId(room_id)},
            {"$set": {"updated_at": datetime.utcnow()}}
        )

        # Preparar resposta
        message["_id"] = str(result.inserted_id)
        message["room_id"] = str(message["room_id"])
        message["user_id"] = str(message["user_id"])

        # Adicionar dados do usuário
        user = get_user_by_id(str(user_id))
        message["user"] = {
            "username": user["username"] if user else "Usuário",
            "first_name": user.get("first_name", "") if user else "",
            "profile_pic": user.get("profile_pic", "") if user else ""
        }

        return {
            "success": True,
            "data": {"message": message},
            "message": "Mensagem enviada"
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao enviar mensagem: {str(e)}"}


def send_system_message(room_id, content):
    """Envia uma mensagem do sistema."""
    try:
        message = {
            "room_id": ObjectId(room_id),
            "user_id": None,
            "user_role": None,
            "content": content,
            "is_system": True,
            "created_at": datetime.utcnow(),
            "read_by": []
        }

        result = db.chat_messages.insert_one(message)

        message["_id"] = str(result.inserted_id)
        message["room_id"] = str(message["room_id"])

        return {
            "success": True,
            "data": {"message": message}
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao enviar mensagem do sistema: {str(e)}"}


def get_user_chat_rooms(user_id):
    """Busca todas as salas de chat do usuário."""
    try:
        # Buscar salas onde o usuário é buyer ou seller
        rooms_cursor = db.chat_rooms.find({
            "$or": [
                {"buyer_id": ObjectId(user_id)},
                {"seller_id": ObjectId(user_id)}
            ]
        }).sort("updated_at", -1)

        rooms = []
        for room in rooms_cursor:
            # Buscar dados do pedido
            order = db.orders.find_one({"_id": room["order_id"]})
            if not order:
                continue

            # Buscar última mensagem
            last_message = db.chat_messages.find_one(
                {"room_id": room["_id"]},
                sort=[("created_at", -1)]
            )

            # Contar mensagens não lidas
            unread_count = db.chat_messages.count_documents({
                "room_id": room["_id"],
                "read_by": {"$ne": ObjectId(user_id)},
                "user_id": {"$ne": ObjectId(user_id)}  # Não contar próprias mensagens
            })

            # Determinar o outro usuário
            other_user_id = room["seller_id"] if str(room["buyer_id"]) == str(user_id) else room["buyer_id"]
            other_user = get_user_by_id(str(other_user_id))

            room_data = {
                "_id": str(room["_id"]),
                "order_id": str(room["order_id"]),
                "status": room["status"],
                "created_at": room["created_at"],
                "updated_at": room["updated_at"],
                "order": {
                    "ad_title": order.get("ad_snapshot", {}).get("title", ""),
                    "game_name": order.get("ad_snapshot", {}).get("game_name", ""),
                    "total_price": order.get("total_price", 0),
                    "status": order.get("status", "")
                },
                "other_user": {
                    "username": other_user["username"] if other_user else "Usuário",
                    "first_name": other_user.get("first_name", "") if other_user else "",
                    "profile_pic": other_user.get("profile_pic", "") if other_user else ""
                },
                "last_message": {
                    "content": last_message["content"] if last_message else "",
                    "created_at": last_message["created_at"] if last_message else room["created_at"],
                    "is_system": last_message.get("is_system", False) if last_message else False
                },
                "unread_count": unread_count
            }

            rooms.append(room_data)

        return {
            "success": True,
            "data": {"rooms": rooms}
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao buscar salas de chat: {str(e)}"}