# app/websockets/chat_events.py - CORREÇÃO DA SERIALIZAÇÃO DATETIME
from flask import request as flask_request
from flask_socketio import emit, join_room, leave_room, disconnect
from flask_jwt_extended import decode_token
from app.extensions.socketio import socketio
from app.services.chat.chat_service import send_message, get_chat_messages
from app.models.user.crud import get_user_by_id
from datetime import datetime
import jwt as pyjwt
import logging
from bson import ObjectId

# Configurar logging
logger = logging.getLogger(__name__)

# Dicionário para rastrear usuários conectados
connected_users = {}


def serialize_datetime(obj):
    """Converte datetime para string ISO format para serialização JSON."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: serialize_datetime(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [serialize_datetime(item) for item in obj]
    return obj


def sanitize_message_data(message):
    """Sanitiza dados de mensagem para WebSocket."""
    if not message:
        return message

    # Criar cópia sanitizada
    sanitized = {}

    # Campos obrigatórios
    sanitized['_id'] = str(message.get('_id', ''))
    sanitized['room_id'] = str(message.get('room_id', ''))
    sanitized['user_id'] = str(message.get('user_id', ''))
    sanitized['content'] = str(message.get('content', ''))
    sanitized['is_system'] = bool(message.get('is_system', False))

    # Datas
    sanitized['created_at'] = message.get('created_at').isoformat() if message.get('created_at') else None
    sanitized['updated_at'] = message.get('updated_at').isoformat() if message.get('updated_at') else None

    # Dados do usuário (se disponível)
    if 'user' in message and message['user']:
        user_data = message['user']
        sanitized['user'] = {
            '_id': str(user_data.get('_id', '')),
            'username': str(user_data.get('username', '')),
            'first_name': str(user_data.get('first_name', '')),
            'profile_pic': str(user_data.get('profile_pic', '')) if user_data.get('profile_pic') else None
        }

    # Dados de leitura
    if 'read_by' in message:
        sanitized['read_by'] = [str(user_id) for user_id in message.get('read_by', [])]

    # Outros campos opcionais
    for field in ['edited', 'edit_history']:
        if field in message:
            sanitized[field] = serialize_datetime(message[field])

    return sanitized


def sanitize_room_data(room):
    """Sanitiza dados da sala para WebSocket."""
    if not room:
        return room

    return {
        '_id': str(room.get('_id', '')),
        'order_id': str(room.get('order_id', '')),
        'buyer_id': str(room.get('buyer_id', '')),
        'seller_id': str(room.get('seller_id', '')),
        'status': str(room.get('status', 'active')),
        'created_at': room.get('created_at').isoformat() if room.get('created_at') else None,
        'updated_at': room.get('updated_at').isoformat() if room.get('updated_at') else None,
        'last_message_at': room.get('last_message_at').isoformat() if room.get('last_message_at') else None,
        'unread_count': int(room.get('unread_count', 0))
    }


@socketio.on('connect')
def handle_connect(auth=None):
    """Usuário conectado ao WebSocket."""
    try:
        logger.info(f"Nova conexão tentando conectar: {flask_request.sid}")

        # Verificar token de autorização
        if not auth or 'token' not in auth:
            logger.warning("Token não fornecido na conexão")
            emit('error', {'message': 'Token não fornecido'})
            disconnect()
            return False

        token = auth['token'].replace('Bearer ', '')

        # Decodificar token JWT
        try:
            from flask import current_app
            payload = pyjwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            user_id = payload['sub']
        except Exception as e:
            logger.error(f"Erro ao decodificar token: {e}")
            emit('error', {'message': 'Token inválido'})
            disconnect()
            return False

        # Buscar dados do usuário
        user = get_user_by_id(user_id)
        if not user:
            logger.error("Usuário não encontrado")
            emit('error', {'message': 'Usuário não encontrado'})
            disconnect()
            return False

        # Registrar usuário conectado
        connected_users[flask_request.sid] = {
            'user_id': user_id,
            'username': user['username'],
            'user_data': user
        }

        emit('connected', {
            'message': 'Conectado ao chat',
            'user_id': user_id,
            'username': user['username']
        })

        logger.info(f"Usuário {user['username']} conectado com sucesso")
        return True

    except Exception as e:
        logger.error(f"Erro na conexão: {e}")
        emit('error', {'message': 'Erro interno na conexão'})
        disconnect()
        return False


@socketio.on('disconnect')
def handle_disconnect():
    """Usuário desconectado do WebSocket."""
    try:
        if flask_request.sid in connected_users:
            user_info = connected_users[flask_request.sid]
            logger.info(f"Usuário {user_info['username']} desconectado")
            del connected_users[flask_request.sid]
        else:
            logger.info(f"Conexão {flask_request.sid} desconectada (usuário não identificado)")
    except Exception as e:
        logger.error(f"Erro na desconexão: {e}")


@socketio.on('join_chat_room')
def handle_join_room(data):
    """Usuário entra em uma sala de chat."""
    try:
        if flask_request.sid not in connected_users:
            emit('error', {'message': 'Usuário não autenticado'})
            return

        user_id = connected_users[flask_request.sid]['user_id']
        room_id = data.get('room_id')

        if not room_id:
            emit('error', {'message': 'ID da sala é obrigatório'})
            return

        logger.info(f"Usuário {user_id} tentando entrar na sala {room_id}")

        # Verificar se o usuário tem acesso à sala
        from app.db.mongo_client import db

        try:
            room = db.chat_rooms.find_one({"_id": ObjectId(room_id)})
        except Exception as e:
            logger.error(f"Erro ao buscar sala {room_id}: {e}")
            emit('error', {'message': 'ID da sala inválido'})
            return

        if not room:
            logger.warning(f"Sala {room_id} não encontrada")
            emit('error', {'message': 'Sala não encontrada'})
            return

        # Verificar permissões de acesso
        if str(room["buyer_id"]) != user_id and str(room["seller_id"]) != user_id:
            logger.warning(f"Usuário {user_id} tentou acessar sala {room_id} sem permissão")
            emit('error', {'message': 'Acesso negado à sala'})
            return

        # Entrar na sala
        join_room(room_id)
        logger.info(f"Usuário {user_id} entrou na sala {room_id}")

        # Buscar mensagens recentes
        try:
            messages_result = get_chat_messages(room_id, user_id, limit=20)

            if messages_result["success"]:
                # CORREÇÃO: Sanitizar mensagens antes de enviar
                raw_messages = messages_result["data"]["messages"]
                sanitized_messages = [sanitize_message_data(msg) for msg in raw_messages]

                logger.info(f"Enviando {len(sanitized_messages)} mensagens para usuário {user_id}")

                emit('room_joined', {
                    'room_id': room_id,
                    'messages': sanitized_messages,
                    'room_data': sanitize_room_data(room)
                })

            else:
                logger.error(f"Erro ao buscar mensagens: {messages_result['message']}")
                emit('error', {'message': messages_result["message"]})

        except Exception as msg_error:
            logger.error(f"Erro ao processar mensagens: {msg_error}")
            # Enviar resposta mesmo sem mensagens
            emit('room_joined', {
                'room_id': room_id,
                'messages': [],
                'room_data': sanitize_room_data(room)
            })

    except Exception as e:
        logger.error(f"Erro geral ao entrar na sala: {e}", exc_info=True)
        emit('error', {'message': f'Erro ao entrar na sala: {str(e)}'})


@socketio.on('leave_chat_room')
def handle_leave_room(data):
    """Usuário sai de uma sala de chat."""
    try:
        room_id = data.get('room_id')
        if room_id:
            leave_room(room_id)
            emit('room_left', {'room_id': room_id})

            if flask_request.sid in connected_users:
                user_id = connected_users[flask_request.sid]['user_id']
                logger.info(f"Usuário {user_id} saiu da sala {room_id}")

    except Exception as e:
        logger.error(f"Erro ao sair da sala: {e}")
        emit('error', {'message': f'Erro ao sair da sala: {str(e)}'})


@socketio.on('send_message')
def handle_send_message(data):
    """Usuário envia uma mensagem."""
    try:
        if flask_request.sid not in connected_users:
            emit('error', {'message': 'Usuário não autenticado'})
            return

        user_id = connected_users[flask_request.sid]['user_id']
        room_id = data.get('room_id')
        content = data.get('content', '').strip()

        if not room_id or not content:
            emit('error', {'message': 'Room ID e conteúdo são obrigatórios'})
            return

        if len(content) > 1000:
            emit('error', {'message': 'Mensagem muito longa (máximo 1000 caracteres)'})
            return

        logger.info(f"Enviando mensagem na sala {room_id} por usuário {user_id}")

        # Enviar mensagem
        result = send_message(room_id, user_id, content)

        if result["success"]:
            # CORREÇÃO: Sanitizar mensagem antes de enviar
            raw_message = result["data"]["message"]
            sanitized_message = sanitize_message_data(raw_message)

            # Emitir mensagem para todos na sala
            socketio.emit('new_message', {
                'message': sanitized_message
            }, to=room_id)

            logger.info(f"Mensagem enviada com sucesso na sala {room_id}")

        else:
            logger.error(f"Erro ao enviar mensagem: {result['message']}")
            emit('error', {'message': result["message"]})

    except Exception as e:
        logger.error(f"Erro ao enviar mensagem: {e}", exc_info=True)
        emit('error', {'message': f'Erro ao enviar mensagem: {str(e)}'})


@socketio.on('typing')
def handle_typing(data):
    """Usuário está digitando."""
    try:
        if flask_request.sid not in connected_users:
            return

        user_info = connected_users[flask_request.sid]
        room_id = data.get('room_id')

        if room_id:
            # Emitir para todos na sala exceto o remetente
            socketio.emit('user_typing', {
                'username': user_info['username'],
                'user_id': user_info['user_id']
            }, to=room_id, skip_sid=flask_request.sid)

    except Exception as e:
        logger.error(f"Erro no typing: {e}")


@socketio.on('stop_typing')
def handle_stop_typing(data):
    """Usuário parou de digitar."""
    try:
        if flask_request.sid not in connected_users:
            return

        user_info = connected_users[flask_request.sid]
        room_id = data.get('room_id')

        if room_id:
            # Emitir para todos na sala exceto o remetente
            socketio.emit('user_stop_typing', {
                'user_id': user_info['user_id']
            }, to=room_id, skip_sid=flask_request.sid)

    except Exception as e:
        logger.error(f"Erro no stop typing: {e}")


# Função helper para enviar notificações do sistema
def send_system_notification(room_id, message):
    """Envia uma notificação do sistema para uma sala."""
    try:
        socketio.emit('system_notification', {
            'message': message,
            'timestamp': datetime.utcnow().isoformat()  # CORREÇÃO: converter para string
        }, to=room_id)
        logger.info(f"Notificação do sistema enviada para sala {room_id}")
    except Exception as e:
        logger.error(f"Erro ao enviar notificação do sistema: {e}")


# Função helper para enviar atualizações de status de pedido
def send_order_status_update(room_id, order_id, new_status, updated_by_username):
    """Envia atualização de status de pedido para a sala."""
    try:
        status_messages = {
            'paid': '💰 Pagamento confirmado!',
            'shipped': '📦 Produto enviado!',
            'delivered': '✅ Produto entregue!',
            'cancelled': '❌ Pedido cancelado'
        }

        message = status_messages.get(new_status, f'Status atualizado para: {new_status}')

        socketio.emit('order_status_update', {
            'order_id': str(order_id),  # CORREÇÃO: converter para string
            'new_status': new_status,
            'message': message,
            'updated_by': updated_by_username,
            'timestamp': datetime.utcnow().isoformat()  # CORREÇÃO: converter para string
        }, to=room_id)

        logger.info(f"Atualização de status enviada para sala {room_id}: {new_status}")

    except Exception as e:
        logger.error(f"Erro ao enviar atualização de status: {e}")


# Event handler para debug (apenas em desenvolvimento)
@socketio.on('ping')
def handle_ping(data):
    """Responde ping para teste de conexão."""
    try:
        if flask_request.sid in connected_users:
            user_info = connected_users[flask_request.sid]
            emit('pong', {
                'message': 'pong',
                'user_id': user_info['user_id'],
                'timestamp': datetime.utcnow().isoformat()  # CORREÇÃO: converter para string
            })
        else:
            emit('pong', {
                'message': 'pong - not authenticated',
                'timestamp': datetime.utcnow().isoformat()  # CORREÇÃO: converter para string
            })
    except Exception as e:
        logger.error(f"Erro no ping: {e}")
        emit('error', {'message': 'Erro no ping'})


# Função para obter usuários conectados (apenas para debug/admin)
def get_connected_users():
    """Retorna lista de usuários conectados."""
    return {
        'count': len(connected_users),
        'users': [
            {
                'sid': sid,
                'user_id': info['user_id'],
                'username': info['username']
            }
            for sid, info in connected_users.items()
        ]
    }


# Event handler para admin verificar conexões
@socketio.on('admin_get_connections')
def handle_admin_connections(data):
    """Handler admin para verificar conexões ativas."""
    try:
        if flask_request.sid not in connected_users:
            emit('error', {'message': 'Não autenticado'})
            return

        user_info = connected_users[flask_request.sid]
        user = user_info.get('user_data', {})

        # Verificar se é admin
        if user.get('role') not in ['admin', 'support']:
            emit('error', {'message': 'Acesso negado - apenas administradores'})
            return

        connections = get_connected_users()
        emit('admin_connections_data', connections)

    except Exception as e:
        logger.error(f"Erro ao buscar conexões (admin): {e}")
        emit('error', {'message': 'Erro ao buscar conexões'})


# Função helper para teste de conexão
@socketio.on('test_connection')
def handle_test_connection(data):
    """Testa a conexão WebSocket."""
    try:
        if flask_request.sid in connected_users:
            user_info = connected_users[flask_request.sid]
            emit('test_response', {
                'status': 'connected',
                'user_id': user_info['user_id'],
                'username': user_info['username'],
                'timestamp': datetime.utcnow().isoformat(),
                'message': 'Conexão WebSocket funcionando corretamente'
            })
        else:
            emit('test_response', {
                'status': 'not_authenticated',
                'timestamp': datetime.utcnow().isoformat(),
                'message': 'Conectado mas não autenticado'
            })
    except Exception as e:
        logger.error(f"Erro no teste de conexão: {e}")
        emit('error', {'message': f'Erro no teste: {str(e)}'})


# Função para debug de sala
@socketio.on('debug_room')
def handle_debug_room(data):
    """Debug de informações da sala."""
    try:
        if flask_request.sid not in connected_users:
            emit('error', {'message': 'Usuário não autenticado'})
            return

        user_id = connected_users[flask_request.sid]['user_id']
        room_id = data.get('room_id')

        if not room_id:
            emit('error', {'message': 'Room ID é obrigatório'})
            return

        from app.db.mongo_client import db

        # Buscar informações da sala
        room = db.chat_rooms.find_one({"_id": ObjectId(room_id)})
        if not room:
            emit('debug_room_response', {
                'room_id': room_id,
                'found': False,
                'message': 'Sala não encontrada'
            })
            return

        # Buscar mensagens
        messages = list(db.chat_messages.find(
            {"room_id": ObjectId(room_id)}
        ).sort("created_at", -1).limit(5))

        emit('debug_room_response', {
            'room_id': room_id,
            'found': True,
            'room_data': sanitize_room_data(room),
            'message_count': len(messages),
            'recent_messages': [sanitize_message_data(msg) for msg in messages],
            'user_access': {
                'is_buyer': str(room.get('buyer_id')) == user_id,
                'is_seller': str(room.get('seller_id')) == user_id,
                'user_id': user_id
            }
        })

    except Exception as e:
        logger.error(f"Erro no debug da sala: {e}")
        emit('error', {'message': f'Erro no debug: {str(e)}'})


# Log de estatísticas a cada minuto (apenas em desenvolvimento)
def log_stats():
    """Log de estatísticas do WebSocket."""
    try:
        stats = {
            'connected_users': len(connected_users),
            'timestamp': datetime.utcnow().isoformat()
        }
        logger.info(f"WebSocket Stats: {stats}")
    except Exception as e:
        logger.error(f"Erro ao gerar stats: {e}")