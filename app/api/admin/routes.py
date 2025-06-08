from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.utils.helpers.response_helpers import success_response, error_response
from app.utils.decorators.permissions import admin_required
from app.db.mongo_client import db
from bson import ObjectId

# Criar blueprint
admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/dashboard", methods=["GET"])
@jwt_required()
@admin_required
def get_dashboard():
    """Retorna dados do dashboard administrativo."""
    return success_response(message="Endpoint de dashboard administrativo")

@admin_bp.route("/ads", methods=["GET"])
@jwt_required()
@admin_required
def get_all_ads():
    """Lista todos os anúncios para administradores."""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '')
        status = request.args.get('status', 'all')
        
        skip = (page - 1) * limit
        
        # Construir query
        query = {}
        if status != 'all':
            query['status'] = status
        if search:
            query['$or'] = [
                {'title': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}}
            ]
        
        # Pipeline de agregação para incluir dados do usuário
        pipeline = [
            {'$match': query},
            {'$lookup': {
                'from': 'users',
                'localField': 'user_id', 
                'foreignField': '_id',
                'as': 'seller'
            }},
            {'$unwind': {'path': '$seller', 'preserveNullAndEmptyArrays': True}},
            {'$lookup': {
                'from': 'games',
                'localField': 'game_id',
                'foreignField': '_id', 
                'as': 'game'
            }},
            {'$unwind': {'path': '$game', 'preserveNullAndEmptyArrays': True}},
            {'$sort': {'created_at': -1}},
            {'$skip': skip},
            {'$limit': limit}
        ]
        
        ads = list(db.ads.aggregate(pipeline))
        total = db.ads.count_documents(query)
        
        # Converter ObjectIds para strings recursivamente
        def convert_objectids(obj):
            if isinstance(obj, ObjectId):
                return str(obj)
            elif isinstance(obj, dict):
                return {key: convert_objectids(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [convert_objectids(item) for item in obj]
            else:
                return obj
        
        # Aplicar conversão para todos os anúncios
        ads = convert_objectids(ads)
        
        return success_response(data={
            'ads': ads,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        })
        
    except Exception as e:
        print(f"Erro ao listar anúncios: {str(e)}")
        return error_response("Erro ao carregar anúncios")

@admin_bp.route("/ads/<ad_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_ad_admin(ad_id):
    """Deletar anúncio (admin pode deletar qualquer anúncio)."""
    try:
        # Verificar se o anúncio existe
        ad = db.ads.find_one({'_id': ObjectId(ad_id)})
        if not ad:
            return error_response("Anúncio não encontrado", 404)
        
        # Admin pode deletar qualquer anúncio
        result = db.ads.delete_one({'_id': ObjectId(ad_id)})
        
        if result.deleted_count == 0:
            return error_response("Falha ao deletar anúncio", 500)
        
        return success_response(message="Anúncio deletado com sucesso")
        
    except Exception as e:
        print(f"Erro ao deletar anúncio: {str(e)}")
        return error_response("Erro ao deletar anúncio")

@admin_bp.route("/ads/<ad_id>/status", methods=["PUT"])
@jwt_required()
@admin_required
def update_ad_status(ad_id):
    """Atualizar status do anúncio."""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['active', 'inactive', 'banned', 'pending']:
            return error_response("Status inválido")
        
        # Verificar se o anúncio existe
        ad = db.ads.find_one({'_id': ObjectId(ad_id)})
        if not ad:
            return error_response("Anúncio não encontrado", 404)
        
        # Atualizar status
        result = db.ads.update_one(
            {'_id': ObjectId(ad_id)},
            {'$set': {'status': new_status, 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return error_response("Falha ao atualizar status", 500)
        
        return success_response(message=f"Status atualizado para {new_status}")
        
    except Exception as e:
        print(f"Erro ao atualizar status: {str(e)}")
        return error_response("Erro ao atualizar status do anúncio")

@admin_bp.route("/orders/<order_id>", methods=["GET"])
@jwt_required()
@admin_required
def get_order_details_admin(order_id):
    """Buscar detalhes do pedido (admin)."""
    try:
        # Verificar se o pedido existe
        order = db.orders.find_one({'_id': ObjectId(order_id)})
        if not order:
            return error_response("Pedido não encontrado", 404)
        
        # Pipeline de agregação para incluir dados do comprador, vendedor e anúncio
        pipeline = [
            {'$match': {'_id': ObjectId(order_id)}},
            {'$lookup': {
                'from': 'users',
                'localField': 'buyer_id',
                'foreignField': '_id',
                'as': 'buyer'
            }},
            {'$unwind': {'path': '$buyer', 'preserveNullAndEmptyArrays': True}},
            {'$lookup': {
                'from': 'users',
                'localField': 'seller_id',
                'foreignField': '_id',
                'as': 'seller'
            }},
            {'$unwind': {'path': '$seller', 'preserveNullAndEmptyArrays': True}},
            {'$lookup': {
                'from': 'ads',
                'localField': 'ad_id',
                'foreignField': '_id',
                'as': 'ad'
            }},
            {'$unwind': {'path': '$ad', 'preserveNullAndEmptyArrays': True}}
        ]
        
        order_details = list(db.orders.aggregate(pipeline))
        if not order_details:
            return error_response("Pedido não encontrado", 404)
        
        order_data = order_details[0]
        
        # Converter ObjectIds para strings recursivamente
        def convert_objectids(obj):
            if isinstance(obj, ObjectId):
                return str(obj)
            elif isinstance(obj, dict):
                return {key: convert_objectids(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [convert_objectids(item) for item in obj]
            else:
                return obj
        
        order_data = convert_objectids(order_data)
        
        return success_response(data=order_data)
        
    except Exception as e:
        print(f"Erro ao buscar detalhes do pedido: {str(e)}")
        return error_response("Erro ao buscar detalhes do pedido")
