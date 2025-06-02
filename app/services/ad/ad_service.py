from datetime import datetime
from bson import ObjectId
from app.db.mongo_client import db
from app.models.user.crud import get_user_by_id


def create_ad(user_id, ad_data):
    """Cria um novo anúncio."""
    try:
        # Verificar se o usuário existe
        user = get_user_by_id(user_id)
        if not user:
            return {"success": False, "message": "Usuário não encontrado"}

        # Verificar se o jogo existe
        game = db.games.find_one({"_id": ObjectId(ad_data["game_id"])})
        if not game:
            return {"success": False, "message": "Jogo não encontrado"}

        # Preparar dados do anúncio
        now = datetime.utcnow()

        ad = {
            "user_id": ObjectId(user_id),
            "game_id": ObjectId(ad_data["game_id"]),
            "title": ad_data["title"],
            "description": ad_data["description"],
            "ad_type": ad_data["ad_type"],  # venda, troca, procura
            "platform": ad_data["platform"],
            "condition": ad_data["condition"],
            "status": "active",
            "is_boosted": False,
            "boost_expires_at": None,
            "view_count": 0,
            "likes": [],  # Array de user_ids que curtiram
            "created_at": now,
            "updated_at": now
        }

        # Campos específicos por tipo de anúncio
        if ad_data["ad_type"] == "venda":
            if "price" not in ad_data or not ad_data["price"]:
                return {"success": False, "message": "Preço é obrigatório para vendas"}
            ad["price_per_hour"] = float(ad_data["price"])

        elif ad_data["ad_type"] == "troca":
            if "desired_games" in ad_data:
                ad["desired_games"] = ad_data["desired_games"]

        # Adicionar imagem se fornecida
        if "image_url" in ad_data:
            ad["image_url"] = ad_data["image_url"]

        # Inserir no banco
        result = db.ads.insert_one(ad)
        ad["_id"] = str(result.inserted_id)
        ad["user_id"] = str(ad["user_id"])
        ad["game_id"] = str(ad["game_id"])

        return {
            "success": True,
            "message": "Anúncio criado com sucesso",
            "ad": ad
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao criar anúncio: {str(e)}"}


def get_user_ads(user_id, limit=20, skip=0):
    """Busca anúncios do usuário."""
    try:
        # Buscar anúncios do usuário
        ads_cursor = db.ads.find(
            {"user_id": ObjectId(user_id)}
        ).sort("created_at", -1).skip(skip).limit(limit)

        ads = []
        for ad in ads_cursor:
            # Buscar dados do jogo
            game = db.games.find_one({"_id": ad["game_id"]})

            ad_data = {
                "_id": str(ad["_id"]),
                "user_id": str(ad["user_id"]),
                "game_id": str(ad["game_id"]),
                "title": ad["title"],
                "description": ad["description"],
                "ad_type": ad["ad_type"],
                "platform": ad["platform"],
                "condition": ad["condition"],
                "status": ad["status"],
                "is_boosted": ad.get("is_boosted", False),
                "view_count": ad.get("view_count", 0),
                "total_likes": len(ad.get("likes", [])),
                "created_at": ad["created_at"].isoformat(),
                "updated_at": ad["updated_at"].isoformat(),
                "game": {
                    "_id": str(game["_id"]),
                    "name": game["name"],
                    "image_url": game.get("image_url", "")
                } if game else None
            }

            # Adicionar preço se for venda
            if ad.get("price_per_hour"):
                ad_data["price"] = ad["price_per_hour"]

            # Adicionar imagem se existir
            if ad.get("image_url"):
                ad_data["image_url"] = ad["image_url"]

            ads.append(ad_data)

        return {
            "success": True,
            "ads": ads,
            "total": len(ads)
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao buscar anúncios: {str(e)}"}


def get_ad_by_id(ad_id, increment_view=True, user_id=None):
    """Busca um anúncio específico com dados completos."""
    try:
        ad = db.ads.find_one({"_id": ObjectId(ad_id)})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado"}

        # Buscar dados do usuário
        user = get_user_by_id(str(ad["user_id"]))

        # Buscar dados do jogo
        game = db.games.find_one({"_id": ad["game_id"]})

        # CORREÇÃO: Incrementar contador de visualizações com proteção contra duplicação
        current_view_count = ad.get("view_count", 0)

        # Apenas incrementar se:
        # 1. increment_view for True
        # 2. O usuário visualizando não for o dono do anúncio
        # 3. Usar findOneAndUpdate para operação atômica (evita condições de corrida)
        if increment_view and (not user_id or str(ad["user_id"]) != str(user_id)):
            updated_ad = db.ads.find_one_and_update(
                {"_id": ObjectId(ad_id)},
                {"$inc": {"view_count": 1}},
                return_document=True  # Retorna o documento atualizado
            )
            current_view_count = updated_ad.get("view_count", current_view_count + 1)

        ad_data = {
            "_id": str(ad["_id"]),
            "user_id": str(ad["user_id"]),
            "game_id": str(ad["game_id"]),
            "title": ad["title"],
            "description": ad["description"],
            "ad_type": ad["ad_type"],
            "platform": ad["platform"],
            "condition": ad["condition"],
            "status": ad["status"],
            "is_boosted": ad.get("is_boosted", False),
            "view_count": current_view_count,
            "total_likes": len(ad.get("likes", [])),
            "created_at": ad["created_at"].isoformat(),
            "updated_at": ad["updated_at"].isoformat(),
            "user": {
                "_id": user["_id"],
                "username": user["username"],
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", ""),
                "seller_rating": user.get("seller_rating", 0),
                "seller_ratings_count": user.get("seller_ratings_count", 0),
                "profile_pic": user.get("profile_pic", ""),
                "location": user.get("location", "")
            } if user else None,
            "game": {
                "_id": str(game["_id"]),
                "name": game["name"],
                "image_url": game.get("image_url", "")
            } if game else None
        }

        # Adicionar preço se for venda
        if ad.get("price_per_hour"):
            ad_data["price"] = ad["price_per_hour"]

        # Adicionar jogos desejados se for troca
        if ad.get("desired_games"):
            ad_data["desired_games"] = ad["desired_games"]

        # Adicionar imagem se existir
        if ad.get("image_url"):
            ad_data["image_url"] = ad["image_url"]

        return {
            "success": True,
            "ad": ad_data
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao buscar anúncio: {str(e)}"}


def update_ad(ad_id, user_id, update_data):
    """Atualiza um anúncio (apenas o dono pode atualizar)."""
    try:
        # Verificar se o anúncio existe e pertence ao usuário
        ad = db.ads.find_one({"_id": ObjectId(ad_id), "user_id": ObjectId(user_id)})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado ou acesso negado"}

        # Preparar dados para atualização
        allowed_fields = ["title", "description", "platform", "condition", "price", "desired_games", "image_url"]
        update_fields = {k: v for k, v in update_data.items() if k in allowed_fields}
        update_fields["updated_at"] = datetime.utcnow()

        # Renomear price para price_per_hour se for venda
        if "price" in update_fields and ad["ad_type"] == "venda":
            update_fields["price_per_hour"] = float(update_fields["price"])
            del update_fields["price"]

        # Atualizar no banco
        db.ads.update_one(
            {"_id": ObjectId(ad_id)},
            {"$set": update_fields}
        )

        return {"success": True, "message": "Anúncio atualizado com sucesso"}

    except Exception as e:
        return {"success": False, "message": f"Erro ao atualizar anúncio: {str(e)}"}


def delete_ad(ad_id, user_id):
    """Remove um anúncio (apenas o dono pode remover)."""
    try:
        # Verificar se o anúncio existe e pertence ao usuário
        ad = db.ads.find_one({"_id": ObjectId(ad_id), "user_id": ObjectId(user_id)})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado ou acesso negado"}

        # Remover do banco
        db.ads.delete_one({"_id": ObjectId(ad_id)})

        return {"success": True, "message": "Anúncio removido com sucesso"}

    except Exception as e:
        return {"success": False, "message": f"Erro ao remover anúncio: {str(e)}"}


def like_ad(ad_id, user_id):
    """Adiciona/remove curtida do anúncio."""
    try:
        # Verificar se o anúncio existe
        ad = db.ads.find_one({"_id": ObjectId(ad_id)})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado"}

        # Verificar se usuário já curtiu usando operação atômica
        user_object_id = ObjectId(user_id)

        # Tentar remover a curtida primeiro
        remove_result = db.ads.update_one(
            {"_id": ObjectId(ad_id), "likes": user_object_id},
            {"$pull": {"likes": user_object_id}}
        )

        if remove_result.modified_count > 0:
            # Usuario descurtiu
            liked = False
            message = "Curtida removida"
        else:
            # Usuario ainda não curtiu, então adicionar
            db.ads.update_one(
                {"_id": ObjectId(ad_id)},
                {"$addToSet": {"likes": user_object_id}}
            )
            liked = True
            message = "Anúncio curtido"

        # Contar total de curtidas
        updated_ad = db.ads.find_one({"_id": ObjectId(ad_id)})
        total_likes = len(updated_ad.get("likes", []))

        return {
            "success": True,
            "message": message,
            "liked": liked,
            "total_likes": total_likes
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao curtir anúncio: {str(e)}"}


def get_ad_likes(ad_id, user_id=None):
    """Busca informações de curtidas do anúncio."""
    try:
        ad = db.ads.find_one({"_id": ObjectId(ad_id)})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado"}

        likes = ad.get("likes", [])
        total_likes = len(likes)
        user_liked = ObjectId(user_id) in likes if user_id else False

        return {
            "success": True,
            "total_likes": total_likes,
            "user_liked": user_liked
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao buscar curtidas: {str(e)}"}