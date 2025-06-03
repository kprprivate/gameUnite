from datetime import datetime
from bson import ObjectId
from app.db.mongo_client import db
from app.models.user.crud import get_user_by_id, update_user, update_password
from app.utils.helpers.password_helpers import hash_password, verify_password


def get_user_profile(user_id):
    """Busca o perfil completo do usuário."""
    try:
        user = get_user_by_id(user_id)
        if not user:
            return {"success": False, "message": "Usuário não encontrado"}

        # Calcular estatísticas do usuário
        stats = get_user_stats(user_id)

        # Remover campos sensíveis
        user.pop("password", None)
        user.pop("reset_password_token", None)
        user.pop("reset_password_expires", None)
        user.pop("verification_token", None)

        # Adicionar estatísticas
        user.update(stats)

        return {
            "success": True,
            "user": user
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao buscar perfil: {str(e)}"}


def update_user_profile(user_id, update_data):
    """Atualiza o perfil do usuário."""
    try:
        # Campos permitidos para atualização (INCLUINDO profile_pic)
        allowed_fields = [
            "first_name", "last_name", "bio", "profile_pic",
            "phone", "location"
        ]

        # Filtrar apenas campos permitidos
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}

        if not filtered_data:
            return {"success": False, "message": "Nenhum campo válido para atualização"}

        # Atualizar usuário
        updated_user = update_user(user_id, filtered_data)

        if updated_user:
            # Remover campos sensíveis
            updated_user.pop("password", None)
            updated_user.pop("reset_password_token", None)
            updated_user.pop("reset_password_expires", None)
            updated_user.pop("verification_token", None)

            return {
                "success": True,
                "message": "Perfil atualizado com sucesso",
                "user": updated_user
            }
        else:
            return {"success": False, "message": "Erro ao atualizar perfil"}

    except Exception as e:
        return {"success": False, "message": f"Erro ao atualizar perfil: {str(e)}"}


def change_password(user_id, current_password, new_password):
    """Altera a senha do usuário."""
    try:
        # Buscar usuário com senha
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {"success": False, "message": "Usuário não encontrado"}

        # Verificar senha atual - CORREÇÃO: converter explicitamente para string
        current_password_str = str(current_password).strip()
        stored_password = user.get("password", "")

        print(f"Debug - Verificando senha para usuário: {user_id}")
        print(f"Debug - Senha recebida (limpa): '{current_password_str}'")
        print(f"Debug - Tamanho da senha recebida: {len(current_password_str)}")
        print(f"Debug - Hash armazenado tem {len(stored_password)} caracteres")

        # CORREÇÃO: Verificar se a senha atual está correta
        if not stored_password:
            return {"success": False, "message": "Usuário sem senha definida"}

        # Usar bcrypt para verificar a senha
        if not verify_password(current_password_str, stored_password):
            print("Debug - Senha atual incorreta na verificação bcrypt")
            return {"success": False, "message": "Senha atual incorreta"}

        # Validar nova senha
        new_password_str = str(new_password).strip()
        if len(new_password_str) < 6:
            return {"success": False, "message": "Nova senha deve ter pelo menos 6 caracteres"}

        # Verificar se a nova senha é diferente da atual
        if verify_password(new_password_str, stored_password):
            return {"success": False, "message": "A nova senha deve ser diferente da atual"}

        # Gerar hash da nova senha
        new_password_hash = hash_password(new_password_str)

        # Atualizar senha no banco
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "password": new_password_hash,
                "updated_at": datetime.utcnow()
            }}
        )

        if result.modified_count > 0:
            print("Debug - Senha alterada com sucesso")
            return {"success": True, "message": "Senha alterada com sucesso"}
        else:
            return {"success": False, "message": "Erro ao alterar senha no banco de dados"}

    except Exception as e:
        print(f"Debug - Erro na alteração de senha: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "message": f"Erro interno: {str(e)}"}


def get_user_stats(user_id):
    """Calcula estatísticas do usuário."""
    try:
        # Contar anúncios
        total_ads = db.ads.count_documents({"user_id": ObjectId(user_id)})
        active_ads = db.ads.count_documents({"user_id": ObjectId(user_id), "status": "active"})

        # Contar visualizações totais
        pipeline = [
            {"$match": {"user_id": ObjectId(user_id)}},
            {"$group": {"_id": None, "total_views": {"$sum": "$view_count"}}}
        ]
        views_result = list(db.ads.aggregate(pipeline))
        total_views = views_result[0]["total_views"] if views_result else 0

        # Calcular valor total dos anúncios ativos de venda
        pipeline = [
            {"$match": {
                "user_id": ObjectId(user_id),
                "status": "active",
                "ad_type": "venda"
            }},
            {"$group": {"_id": None, "total_value": {"$sum": "$price_per_hour"}}}
        ]
        value_result = list(db.ads.aggregate(pipeline))
        total_value = value_result[0]["total_value"] if value_result else 0

        return {
            "total_ads": total_ads,
            "active_ads": active_ads,
            "total_views": total_views,
            "total_value": total_value
        }

    except Exception as e:
        return {
            "total_ads": 0,
            "active_ads": 0,
            "total_views": 0,
            "total_value": 0
        }


def get_user_dashboard_data(user_id):
    """Busca dados para o dashboard do usuário."""
    try:
        # Buscar usuário
        user = get_user_by_id(user_id)
        if not user:
            return {"success": False, "message": "Usuário não encontrado"}

        # Buscar estatísticas
        stats = get_user_stats(user_id)

        # Buscar anúncios recentes
        from app.services.ad.ad_service import get_user_ads
        ads_result = get_user_ads(user_id, limit=10)
        recent_ads = ads_result["ads"] if ads_result["success"] else []

        return {
            "success": True,
            "data": {
                "user": {
                    "_id": user["_id"],
                    "username": user["username"],
                    "first_name": user.get("first_name", ""),
                    "last_name": user.get("last_name", ""),
                    "email": user["email"]
                },
                "stats": stats,
                "recent_ads": recent_ads
            }
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao buscar dados do dashboard: {str(e)}"}


def get_user_public_profile(user_id):
    """Busca o perfil público de um usuário."""
    try:
        user = get_user_by_id(user_id)
        if not user:
            return {"success": False, "message": "Usuário não encontrado"}

        # Buscar estatísticas
        stats = get_user_stats(user_id)

        # Criar perfil público (sem informações sensíveis)
        public_profile = {
            "_id": user["_id"],
            "username": user["username"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "bio": user.get("bio", ""),
            "profile_pic": user.get("profile_pic", ""),
            "seller_rating": user.get("seller_rating", 0),
            "buyer_rating": user.get("buyer_rating", 0),
            "seller_ratings_count": user.get("seller_ratings_count", 0),
            "buyer_ratings_count": user.get("buyer_ratings_count", 0),
            "created_at": user.get("created_at", ""),
            "location": user.get("location", ""),
            **stats
        }

        return {
            "success": True,
            "user": public_profile
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao buscar perfil público: {str(e)}"}