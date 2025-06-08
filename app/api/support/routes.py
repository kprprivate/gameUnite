from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.support.support_service import SupportService, convert_objectids
from app.utils.decorators.auth_decorators import admin_required, jwt_required as custom_jwt_required
from app.utils.decorators.rate_limiting import rate_limit, strict_rate_limit, admin_rate_limit
from app.utils.helpers.response_helpers import success_response, error_response
from app.utils.security.audit_logger import AuditLogger
from app.utils.security.input_validator import InputValidator
from app.db.mongo_client import db
from bson import ObjectId
import logging

support_bp = Blueprint('support', __name__, url_prefix='/api/support')

# Configurar logging para auditoria
logger = logging.getLogger(__name__)

@support_bp.route('/tickets', methods=['POST'])
@strict_rate_limit(10)  # Máximo 10 tickets por minuto
@custom_jwt_required
def create_ticket():
    try:
        user_id = g.user['_id']
        data = request.get_json()
        
        # Validação e sanitização usando InputValidator
        try:
            validated_data = InputValidator.validate_support_ticket_data(data)
        except ValueError as e:
            return error_response(str(e), 400)
        
        ticket = SupportService.create_ticket(user_id, validated_data)
        
        # Log de auditoria
        AuditLogger.log_admin_action(
            action="create",
            resource_type="support_ticket",
            resource_id=ticket.get('_id'),
            new_data=validated_data,
            success=True
        )
        
        return success_response(data=ticket, message="Ticket criado com sucesso")
    except Exception as e:
        logger.error(f"Erro ao criar ticket: {str(e)}")
        return error_response("Erro interno do servidor", 500)

@support_bp.route('/tickets', methods=['GET'])
@rate_limit(60)  # Máximo 60 consultas por minuto
@custom_jwt_required
def get_user_tickets():
    try:
        user_id = g.user['_id']
        print(f"🔍 GET /tickets - Buscando tickets para usuário: {user_id}")
        
        # Usuário só pode ver seus próprios tickets
        tickets = SupportService.get_user_tickets(user_id)
        print(f"📋 Resultado SupportService.get_user_tickets: {tickets}")
        
        return success_response(data=tickets, message="Tickets recuperados com sucesso")
    except Exception as e:
        print(f"❌ Erro na rota /tickets: {str(e)}")
        logger.error(f"Erro ao buscar tickets do usuário {user_id}: {str(e)}")
        return error_response("Erro interno do servidor", 500)

@support_bp.route('/tickets/protocol/<protocol_number>', methods=['GET'])
@rate_limit(30)  # Máximo 30 consultas por protocolo por minuto
@custom_jwt_required
def get_ticket_by_protocol(protocol_number):
    try:
        user_id = g.user['_id']
        
        print(f"🔍 Buscando ticket por protocolo: {protocol_number} para usuário: {user_id}")
        
        # Buscar ticket por protocolo
        ticket = SupportService.get_ticket_by_protocol(protocol_number, user_id)
        
        print(f"📋 Ticket encontrado: {ticket}")
        
        if not ticket:
            print(f"❌ Ticket não encontrado com protocolo: {protocol_number}")
            return error_response("Ticket não encontrado ou você não tem permissão para vê-lo", 404)
        
        return success_response(data={"ticket": ticket}, message="Ticket encontrado")
    except Exception as e:
        print(f"❌ Erro na busca por protocolo: {str(e)}")
        logger.error(f"Erro ao buscar ticket por protocolo {protocol_number}: {str(e)}")
        return error_response("Erro interno do servidor", 500)

@support_bp.route('/tickets/<ticket_id>', methods=['GET'])
@rate_limit(50)  # Máximo 50 consultas por minuto
@custom_jwt_required
def get_ticket_by_id(ticket_id):
    try:
        user_id = g.user['_id']
        
        # Validar ticket_id
        if not InputValidator.validate_object_id(ticket_id):
            return error_response("ID do ticket inválido", 400)
        
        # Buscar ticket por ID
        ticket = SupportService.get_ticket_by_id_and_user(ticket_id, user_id)
        
        if not ticket:
            return error_response("Ticket não encontrado ou você não tem permissão para vê-lo", 404)
        
        return success_response(data={"ticket": ticket}, message="Ticket encontrado")
    except Exception as e:
        logger.error(f"Erro ao buscar ticket por ID {ticket_id}: {str(e)}")
        return error_response("Erro interno do servidor", 500)

@support_bp.route('/tickets/<ticket_id>/reply', methods=['POST'])
@rate_limit(5)  # Máximo 5 respostas por minuto
@custom_jwt_required
def add_ticket_reply(ticket_id):
    try:
        user_id = g.user['_id']
        data = request.get_json()
        
        # Validar dados
        if not data or 'message' not in data:
            return error_response("Mensagem é obrigatória", 400)
        
        message = data['message'].strip()
        if not message:
            return error_response("Mensagem não pode estar vazia", 400)
        
        if len(message) < 5:
            return error_response("Mensagem deve ter pelo menos 5 caracteres", 400)
        
        if len(message) > 1000:
            return error_response("Mensagem não pode ter mais de 1000 caracteres", 400)
        
        # Validar ticket_id
        if not InputValidator.validate_object_id(ticket_id):
            return error_response("ID do ticket inválido", 400)
        
        # Adicionar resposta
        result = SupportService.add_ticket_reply(ticket_id, user_id, message)
        
        if not result:
            return error_response("Ticket não encontrado ou você não tem permissão", 404)
        
        return success_response(data={"ticket": result}, message="Mensagem adicionada com sucesso")
    except Exception as e:
        logger.error(f"Erro ao adicionar resposta ao ticket {ticket_id}: {str(e)}")
        return error_response("Erro interno do servidor", 500)

@support_bp.route('/admin/tickets', methods=['GET'])
@admin_rate_limit(60)  # Máximo 60 consultas admin por minuto
@admin_required
def get_all_tickets():
    try:
        # Validar parâmetros de paginação
        pagination = InputValidator.validate_pagination(
            request.args.get('page'),
            request.args.get('limit'),
            max_limit=100
        )
        page = pagination['page']
        limit = pagination['limit']
        
        # Validar filtros
        status = request.args.get('status')
        category = request.args.get('category')
        priority = request.args.get('priority')
        
        valid_statuses = ['open', 'in_progress', 'resolved', 'closed']
        valid_categories = ['general', 'technical', 'billing', 'account']
        valid_priorities = ['low', 'medium', 'high', 'urgent']
        
        if status and not InputValidator.validate_enum(status, valid_statuses):
            status = None
        if category and not InputValidator.validate_enum(category, valid_categories):
            category = None
        if priority and not InputValidator.validate_enum(priority, valid_priorities):
            priority = None
        
        tickets = SupportService.get_all_tickets(page, limit, status, category, priority)
        
        # Log de auditoria para acesso a dados sensíveis
        AuditLogger.log_data_access(
            resource_type="support_tickets",
            resource_ids=f"page_{page}_limit_{limit}",
            access_type="read",
            authorized=True
        )
        
        return success_response(data=tickets, message="Tickets recuperados com sucesso")
    except Exception as e:
        logger.error(f"Erro ao buscar todos os tickets: {str(e)}")
        return error_response("Erro interno do servidor", 500)

@support_bp.route('/admin/tickets/<ticket_id>', methods=['PUT'])
@admin_required
def update_ticket(ticket_id):
    try:
        admin_id = g.user['_id']
        data = request.get_json()
        
        # Validação de entrada
        if not data or not isinstance(data, dict):
            return error_response("Dados inválidos", 400)
        
        # Validar ticket_id
        if not InputValidator.validate_object_id(ticket_id):
            return error_response("ID do ticket inválido", 400)
        
        # Validar campos permitidos para atualização
        allowed_fields = ['status', 'admin_response', 'priority']
        filtered_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not filtered_data:
            return error_response("Nenhum campo válido para atualização", 400)
        
        # Validar valores
        if 'status' in filtered_data:
            valid_statuses = ['open', 'in_progress', 'resolved', 'closed']
            if filtered_data['status'] not in valid_statuses:
                return error_response("Status inválido", 400)
        
        if 'priority' in filtered_data:
            valid_priorities = ['low', 'medium', 'high', 'urgent']
            if filtered_data['priority'] not in valid_priorities:
                return error_response("Prioridade inválida", 400)
        
        if 'admin_response' in filtered_data:
            if not isinstance(filtered_data['admin_response'], str):
                return error_response("Resposta deve ser uma string", 400)
            filtered_data['admin_response'] = filtered_data['admin_response'].strip()[:2000]
        
        # Buscar dados antigos para auditoria
        old_ticket = SupportService.get_ticket_by_id(ticket_id)
        
        ticket = SupportService.update_ticket(ticket_id, admin_id, filtered_data)
        
        if not ticket:
            return error_response("Ticket não encontrado", 404)
        
        # Log de auditoria detalhado
        AuditLogger.log_admin_action(
            action="update",
            resource_type="support_ticket",
            resource_id=ticket_id,
            old_data=old_ticket,
            new_data=filtered_data,
            success=True
        )
        
        return success_response(data=ticket, message="Ticket atualizado com sucesso")
    except Exception as e:
        logger.error(f"Erro ao atualizar ticket {ticket_id}: {str(e)}")
        return error_response("Erro interno do servidor", 500)

@support_bp.route('/admin/games', methods=['POST'])
@admin_required
def create_game():
    try:
        data = request.get_json()
        game = SupportService.create_game(data)
        return success_response(data=game, message="Jogo criado com sucesso")
    except Exception as e:
        return error_response(str(e), 400)

@support_bp.route('/admin/games/<game_id>', methods=['PUT'])
@admin_required
def update_game(game_id):
    try:
        data = request.get_json()
        game = SupportService.update_game(game_id, data)
        return success_response(data=game, message="Jogo atualizado com sucesso")
    except Exception as e:
        return error_response(str(e), 400)

@support_bp.route('/admin/games/<game_id>', methods=['DELETE'])
@admin_required
def delete_game(game_id):
    try:
        SupportService.delete_game(game_id)
        return success_response(message="Jogo deletado com sucesso")
    except Exception as e:
        return error_response(str(e), 400)

@support_bp.route('/admin/categories', methods=['GET'])
@admin_required
def get_categories():
    try:
        categories = SupportService.get_all_categories()
        return success_response(data=categories, message="Categorias recuperadas com sucesso")
    except Exception as e:
        return error_response(str(e), 400)

@support_bp.route('/admin/categories', methods=['POST'])
@admin_required
def create_category():
    try:
        data = request.get_json()
        category = SupportService.create_category(data)
        return success_response(data=category, message="Categoria criada com sucesso")
    except Exception as e:
        return error_response(str(e), 400)

@support_bp.route('/admin/categories/<category_id>', methods=['PUT'])
@admin_required
def update_category(category_id):
    try:
        data = request.get_json()
        category = SupportService.update_category(category_id, data)
        return success_response(data=category, message="Categoria atualizada com sucesso")
    except Exception as e:
        return error_response(str(e), 400)

@support_bp.route('/admin/categories/<category_id>', methods=['DELETE'])
@admin_required
def delete_category(category_id):
    try:
        SupportService.delete_category(category_id)
        return success_response(message="Categoria deletada com sucesso")
    except Exception as e:
        return error_response(str(e), 400)

@support_bp.route('/ratings/<order_id>', methods=['POST'])
@strict_rate_limit(5)  # Máximo 5 avaliações por minuto (evita spam)
@custom_jwt_required
def submit_rating():
    try:
        user_id = g.user['_id']
        order_id = request.view_args['order_id']
        data = request.get_json()
        
        # Validação de entrada
        if not data or not isinstance(data, dict):
            return error_response("Dados inválidos", 400)
        
        # Validar order_id
        if not InputValidator.validate_object_id(order_id):
            return error_response("ID do pedido inválido", 400)
        
        # Validar e sanitizar dados da avaliação
        try:
            validated_data = InputValidator.validate_rating_data(data)
        except ValueError as e:
            return error_response(str(e), 400)
        
        rating = SupportService.submit_rating(order_id, user_id, validated_data)
        
        # Log de auditoria
        AuditLogger.log_admin_action(
            action="create",
            resource_type="rating",
            resource_id=rating.get('_id'),
            new_data={"order_id": order_id, "rating": validated_data['rating']},
            success=True
        )
        
        return success_response(data=rating, message="Avaliação enviada com sucesso")
    except ValueError as e:
        # Erros de validação específicos do serviço
        return error_response(str(e), 400)
    except Exception as e:
        logger.error(f"Erro ao enviar avaliação: {str(e)}")
        return error_response("Erro interno do servidor", 500)


@support_bp.route('/admin/stats', methods=['GET'])
@admin_rate_limit(30)
@admin_required
def get_admin_stats():
    try:
        stats = SupportService.get_admin_stats()
        return success_response(data=stats, message="Estatísticas recuperadas com sucesso")
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {str(e)}")
        return error_response(f"Erro ao obter estatísticas: {str(e)}", 500)

@support_bp.route('/admin/users', methods=['GET'])
@admin_rate_limit(30)
@admin_required
def get_all_users():
    try:
        # Validar parâmetros
        pagination = InputValidator.validate_pagination(
            request.args.get('page'),
            request.args.get('limit'),
            max_limit=100
        )
        page = pagination['page']
        limit = pagination['limit']
        
        # Filtros
        search = request.args.get('search')
        role = request.args.get('role')
        status = request.args.get('status')
        
        query = {}
        
        # Filtro de busca
        if search:
            query['$or'] = [
                {'username': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}}
            ]
        
        # Filtro de role
        if role and role != 'all':
            query['role'] = role
            
        # Filtro de status
        if status and status != 'all':
            if status == 'active':
                query['is_active'] = True
            elif status == 'inactive':
                query['is_active'] = False
        
        # Buscar usuários
        skip = (page - 1) * limit
        users_cursor = db.users.find(query).sort("created_at", -1).skip(skip).limit(limit)
        users = []
        
        for user in users_cursor:
            user['_id'] = str(user['_id'])
            # Remover campos sensíveis
            user.pop('password', None)
            users.append(user)
        
        total = db.users.count_documents(query)
        
        
        result = {
            'users': users,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }
        
        return success_response(data=convert_objectids(result), message="Usuários recuperados com sucesso")
    except Exception as e:
        logger.error(f"Erro ao buscar usuários: {str(e)}")
        return error_response("Erro interno do servidor", 500)

@support_bp.route('/admin/users/<user_id>', methods=['PUT'])
@admin_rate_limit(20)
@admin_required
def update_user(user_id):
    try:
        # Validar user_id
        if not InputValidator.validate_object_id(user_id):
            return error_response("ID do usuário inválido", 400)
            
        data = request.get_json()
        if not data:
            return error_response("Dados inválidos", 400)
        
        # Campos permitidos para atualização por admins
        allowed_fields = [
            'is_active', 'role', 'username', 'email', 
            'first_name', 'last_name', 'bio', 'profile_pic', 'is_verified'
        ]
        update_data = {}
        
        # Validar e processar cada campo
        for field, value in data.items():
            if field not in allowed_fields:
                continue
                
            # Validações específicas por campo
            if field == 'email' and value:
                if not InputValidator.validate_email(value):
                    return error_response("Email inválido", 400)
                # Verificar se email já existe (exceto para o próprio usuário)
                existing_user = db.users.find_one({"email": value, "_id": {"$ne": ObjectId(user_id)}})
                if existing_user:
                    return error_response("Email já está em uso por outro usuário", 400)
                    
            elif field == 'username' and value:
                if not InputValidator.validate_username(value):
                    return error_response("Username inválido", 400)
                # Verificar se username já existe (exceto para o próprio usuário)
                existing_user = db.users.find_one({"username": value, "_id": {"$ne": ObjectId(user_id)}})
                if existing_user:
                    return error_response("Username já está em uso por outro usuário", 400)
                    
            elif field == 'role' and value:
                if value not in ['user', 'admin', 'support']:
                    return error_response("Role inválido", 400)
                    
            elif field in ['first_name', 'last_name'] and value:
                if len(value.strip()) < 2:
                    return error_response(f"{field} deve ter pelo menos 2 caracteres", 400)
                    
            elif field == 'bio' and value:
                if len(value) > 500:
                    return error_response("Bio não pode ter mais de 500 caracteres", 400)
                    
            elif field == 'is_active':
                if not isinstance(value, bool):
                    return error_response("is_active deve ser um valor booleano", 400)
                    
            elif field == 'is_verified':
                if not isinstance(value, bool):
                    return error_response("is_verified deve ser um valor booleano", 400)
            
            update_data[field] = value
        
        if not update_data:
            return error_response("Nenhum campo válido para atualização", 400)
        
        # Buscar usuário atual
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return error_response("Usuário não encontrado", 404)
        
        # Adicionar timestamp de atualização
        update_data['updated_at'] = datetime.utcnow()
        
        # Atualizar usuário
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return error_response("Nenhuma alteração realizada", 400)
        
        # Buscar usuário atualizado
        updated_user = db.users.find_one({"_id": ObjectId(user_id)})
        updated_user['_id'] = str(updated_user['_id'])
        updated_user.pop('password', None)
        
        # Log de auditoria - capturar valores antigos dos campos modificados
        old_data = {field: user.get(field) for field in update_data.keys() if field != 'updated_at'}
        new_data = {field: value for field, value in update_data.items() if field != 'updated_at'}
        
        AuditLogger.log_admin_action(
            action="update_user",
            resource_type="user",
            resource_id=user_id,
            old_data=old_data,
            new_data=new_data,
            success=True
        )
        
        return success_response(data=convert_objectids(updated_user), message="Usuário atualizado com sucesso")
    except Exception as e:
        logger.error(f"Erro ao atualizar usuário: {str(e)}")
        return error_response("Erro interno do servidor", 500)

@support_bp.route('/admin/orders', methods=['GET'])
@admin_rate_limit(30)
@admin_required
def get_all_orders():
    try:
        # Validar parâmetros
        pagination = InputValidator.validate_pagination(
            request.args.get('page'),
            request.args.get('limit'),
            max_limit=100
        )
        page = pagination['page']
        limit = pagination['limit']
        
        # Filtros
        search = request.args.get('search')
        status = request.args.get('status')
        
        query = {}
        
        # Filtro de status
        if status and status != 'all':
            query['status'] = status
        
        # Buscar pedidos com informações de usuários
        skip = (page - 1) * limit
        pipeline = [
            {"$match": query},
            {"$lookup": {
                "from": "users",
                "localField": "buyer_id",
                "foreignField": "_id",
                "as": "buyer"
            }},
            {"$lookup": {
                "from": "users",
                "localField": "seller_id", 
                "foreignField": "_id",
                "as": "seller"
            }},
            {"$lookup": {
                "from": "ads",
                "localField": "ad_id",
                "foreignField": "_id",
                "as": "ad"
            }},
            {"$unwind": {"path": "$buyer", "preserveNullAndEmptyArrays": True}},
            {"$unwind": {"path": "$seller", "preserveNullAndEmptyArrays": True}},
            {"$unwind": {"path": "$ad", "preserveNullAndEmptyArrays": True}},
            {"$addFields": {
                "buyer_name": "$buyer.username",
                "seller_name": "$seller.username",
                "ad_title": "$ad.title"
            }},
            {"$project": {
                "buyer": 0,
                "seller": 0,
                "ad": 0
            }},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        orders = list(db.orders.aggregate(pipeline))
        total = db.orders.count_documents(query)
        
        
        # Converter ObjectIds
        for order in orders:
            order['_id'] = str(order['_id'])
            if 'buyer_id' in order:
                order['buyer_id'] = str(order['buyer_id'])
            if 'seller_id' in order:
                order['seller_id'] = str(order['seller_id'])
            if 'ad_id' in order:
                order['ad_id'] = str(order['ad_id'])
        
        result = {
            'orders': orders,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }
        
        return success_response(data=convert_objectids(result), message="Pedidos recuperados com sucesso")
    except Exception as e:
        logger.error(f"Erro ao buscar pedidos: {str(e)}")
        return error_response("Erro interno do servidor", 500)

@support_bp.route('/admin/orders/<order_id>', methods=['PUT'])
@admin_rate_limit(20)
@admin_required  
def update_order(order_id):
    try:
        # Validar order_id
        if not InputValidator.validate_object_id(order_id):
            return error_response("ID do pedido inválido", 400)
            
        data = request.get_json()
        if not data:
            return error_response("Dados inválidos", 400)
        
        # Campos permitidos para atualização
        allowed_fields = ['status']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return error_response("Nenhum campo válido para atualização", 400)
        
        # Buscar pedido atual
        order = db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            return error_response("Pedido não encontrado", 404)
        
        # Atualizar pedido
        from datetime import datetime
        update_data['updated_at'] = datetime.utcnow()
        
        result = db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return error_response("Nenhuma alteração realizada", 400)
        
        # Buscar pedido atualizado
        updated_order = db.orders.find_one({"_id": ObjectId(order_id)})
        updated_order['_id'] = str(updated_order['_id'])
        
        # Log de auditoria
        AuditLogger.log_admin_action(
            action="update",
            resource_type="order",
            resource_id=order_id,
            old_data={'status': order.get('status')},
            new_data=update_data,
            success=True
        )
        
        return success_response(data=convert_objectids(updated_order), message="Pedido atualizado com sucesso")
    except Exception as e:
        logger.error(f"Erro ao atualizar pedido: {str(e)}")
        return error_response("Erro interno do servidor", 500)

@support_bp.route('/admin/audit-logs', methods=['GET'])
@admin_rate_limit(20)  # Logs são dados sensíveis, rate limit mais restritivo
@admin_required
def get_audit_logs():
    try:
        # Validar parâmetros
        pagination = InputValidator.validate_pagination(
            request.args.get('page'),
            request.args.get('limit'),
            max_limit=50  # Limitar mais para logs
        )
        
        admin_id = request.args.get('admin_id')
        if admin_id and not InputValidator.validate_object_id(admin_id):
            admin_id = None
        
        # Buscar logs de auditoria
        from app.utils.security.audit_logger import AuditLogger
        logs = AuditLogger.get_admin_activity_report(
            admin_id=admin_id,
            limit=pagination['limit']
        )
        
        # Log de auditoria para acesso aos logs (meta-auditoria)
        AuditLogger.log_data_access(
            resource_type="audit_logs",
            resource_ids="admin_activity_report",
            access_type="read",
            authorized=True
        )
        
        return success_response(data={
            "logs": logs,
            "page": pagination['page'],
            "limit": pagination['limit']
        }, message="Logs de auditoria recuperados com sucesso")
    except Exception as e:
        logger.error(f"Erro ao buscar logs de auditoria: {str(e)}")
        return error_response("Erro interno do servidor", 500)