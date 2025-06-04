# app/services/ad/ad_service.py - VERSÃO CORRIGIDA
from datetime import datetime
from bson import ObjectId
from app.db.mongo_client import db
from app.models.user.crud import get_user_by_id


def validate_object_id(obj_id):
    """Valida se um ID é um ObjectId válido."""
    if not obj_id:
        return False
    try:
        ObjectId(obj_id)
        return True
    except:
        return False


def format_ad_response(ad, game=None, user=None):
    """Formata resposta do anúncio garantindo que todos os IDs sejam strings válidas."""
    try:
        # Verificar se o anúncio tem dados válidos
        if not ad or not ad.get("_id"):
            raise ValueError("Anúncio inválido ou sem ID")

        ad_data = {
            "_id": str(ad["_id"]),
            "user_id": str(ad["user_id"]) if ad.get("user_id") else None,
            "game_id": str(ad["game_id"]) if ad.get("game_id") else None,
            "title": ad.get("title", ""),
            "description": ad.get("description", ""),
            "ad_type": ad.get("ad_type", "venda"),
            "platform": ad.get("platform", "PC"),
            "condition": ad.get("condition", "usado"),
            "status": ad.get("status", "active"),
            "is_boosted": ad.get("is_boosted", False),
            "view_count": ad.get("view_count", 0),
            "total_likes": len(ad.get("likes", [])),
            "created_at": ad["created_at"].isoformat() if ad.get("created_at") else datetime.utcnow().isoformat(),
            "updated_at": ad["updated_at"].isoformat() if ad.get("updated_at") else datetime.utcnow().isoformat(),
        }

        # Adicionar preço se for venda
        if ad.get("price_per_hour") is not None:
            ad_data["price"] = float(ad["price_per_hour"])

        # Adicionar jogos desejados se for troca
        if ad.get("desired_games"):
            ad_data["desired_games"] = ad["desired_games"]

        # Adicionar imagem se existir
        if ad.get("image_url"):
            ad_data["image_url"] = ad["image_url"]

        # Adicionar dados do jogo
        if game:
            ad_data["game"] = {
                "_id": str(game["_id"]) if game.get("_id") else None,
                "name": game.get("name", ""),
                "image_url": game.get("image_url", "")
            }

        # Adicionar dados do usuário (se fornecido)
        if user:
            ad_data["user"] = {
                "_id": str(user["_id"]) if user.get("_id") else None,
                "username": user.get("username", ""),
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", ""),
                "seller_rating": user.get("seller_rating", 0),
                "seller_ratings_count": user.get("seller_ratings_count", 0),
                "profile_pic": user.get("profile_pic", ""),
                "location": user.get("location", "")
            }

        return ad_data

    except Exception as e:
        print(f"Erro ao formatar resposta do anúncio: {e}")
        # Retornar estrutura mínima válida em caso de erro
        return {
            "_id": str(ad.get("_id", ObjectId())),
            "title": ad.get("title", "Anúncio inválido"),
            "description": "Erro ao carregar dados do anúncio",
            "ad_type": "venda",
            "price": 0,
            "status": "inactive",
            "created_at": datetime.utcnow().isoformat()
        }


def create_ad(user_id, ad_data):
    """Cria um novo anúncio com validação rigorosa."""
    try:
        # Verificar se o usuário existe
        if not validate_object_id(user_id):
            return {"success": False, "message": "ID de usuário inválido"}

        user = get_user_by_id(user_id)
        if not user:
            return {"success": False, "message": "Usuário não encontrado"}

        # Verificar se o jogo existe
        game_id = ad_data.get("game_id")
        if not validate_object_id(game_id):
            return {"success": False, "message": "ID de jogo inválido"}

        game = db.games.find_one({"_id": ObjectId(game_id)})
        if not game:
            return {"success": False, "message": "Jogo não encontrado"}

        # Validar dados obrigatórios
        required_fields = ["title", "description", "ad_type", "platform", "condition"]
        for field in required_fields:
            if not ad_data.get(field):
                return {"success": False, "message": f"Campo '{field}' é obrigatório"}

        # Preparar dados do anúncio
        now = datetime.utcnow()

        ad = {
            "user_id": ObjectId(user_id),
            "game_id": ObjectId(game_id),
            "title": str(ad_data["title"]).strip(),
            "description": str(ad_data["description"]).strip(),
            "ad_type": ad_data["ad_type"],
            "platform": ad_data["platform"],
            "condition": ad_data["condition"],
            "status": "active",
            "is_boosted": False,
            "boost_expires_at": None,
            "view_count": 0,
            "likes": [],
            "created_at": now,
            "updated_at": now
        }

        # Campos específicos por tipo de anúncio
        if ad_data["ad_type"] == "venda":
            price = ad_data.get("price")
            if not price or float(price) <= 0:
                return {"success": False, "message": "Preço é obrigatório e deve ser maior que zero para vendas"}
            ad["price_per_hour"] = float(price)

        elif ad_data["ad_type"] == "troca":
            if "desired_games" in ad_data and ad_data["desired_games"]:
                ad["desired_games"] = str(ad_data["desired_games"]).strip()

        # Adicionar imagem se fornecida
        if ad_data.get("image_url"):
            ad["image_url"] = str(ad_data["image_url"]).strip()

        # Inserir no banco
        result = db.ads.insert_one(ad)
        if not result.inserted_id:
            return {"success": False, "message": "Erro ao salvar anúncio no banco de dados"}

        # Formatar resposta
        ad_response = format_ad_response(ad, game, user)
        ad_response["_id"] = str(result.inserted_id)

        return {
            "success": True,
            "message": "Anúncio criado com sucesso",
            "ad": ad_response
        }

    except Exception as e:
        print(f"Erro ao criar anúncio: {e}")
        return {"success": False, "message": f"Erro interno ao criar anúncio: {str(e)}"}


def get_user_ads(user_id, limit=20, skip=0):
    """Busca anúncios do usuário com validação rigorosa."""
    try:
        # Validar user_id
        if not validate_object_id(user_id):
            return {"success": False, "message": "ID de usuário inválido"}

        # Buscar anúncios do usuário
        ads_cursor = db.ads.find(
            {"user_id": ObjectId(user_id)}
        ).sort("created_at", -1).skip(skip).limit(limit)

        ads = []
        for ad in ads_cursor:
            try:
                # Buscar dados do jogo
                game = None
                if ad.get("game_id"):
                    game = db.games.find_one({"_id": ad["game_id"]})

                # Formatar anúncio
                ad_data = format_ad_response(ad, game)
                ads.append(ad_data)

            except Exception as e:
                print(f"Erro ao processar anúncio {ad.get('_id')}: {e}")
                continue

        return {
            "success": True,
            "ads": ads,
            "total": len(ads)
        }

    except Exception as e:
        print(f"Erro ao buscar anúncios do usuário: {e}")
        return {"success": False, "message": f"Erro ao buscar anúncios: {str(e)}"}


def get_ad_by_id(ad_id, increment_view=True, user_id=None):
    """Busca um anúncio específico com dados completos e validação."""
    try:
        # Validar ad_id
        if not validate_object_id(ad_id):
            return {"success": False, "message": "ID de anúncio inválido"}

        ad = db.ads.find_one({"_id": ObjectId(ad_id)})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado"}

        # Buscar dados do usuário
        user = None
        if ad.get("user_id"):
            user = get_user_by_id(str(ad["user_id"]))

        # Buscar dados do jogo
        game = None
        if ad.get("game_id"):
            game = db.games.find_one({"_id": ad["game_id"]})

        # Incrementar contador de visualizações
        current_view_count = ad.get("view_count", 0)
        if increment_view and (not user_id or str(ad["user_id"]) != str(user_id)):
            try:
                updated_ad = db.ads.find_one_and_update(
                    {"_id": ObjectId(ad_id)},
                    {"$inc": {"view_count": 1}},
                    return_document=True
                )
                current_view_count = updated_ad.get("view_count", current_view_count + 1)
            except Exception as e:
                print(f"Erro ao incrementar view count: {e}")

        # Contar favoritos
        favorites_count = 0
        user_favorited = False
        try:
            favorites_count = db.favorites.count_documents({"ad_id": ObjectId(ad_id)})

            if user_id and validate_object_id(user_id):
                user_favorite = db.favorites.find_one({
                    "user_id": ObjectId(user_id),
                    "ad_id": ObjectId(ad_id)
                })
                user_favorited = user_favorite is not None
        except Exception as e:
            print(f"Erro ao contar favoritos: {e}")

        # Formatar resposta
        ad_data = format_ad_response(ad, game, user)
        ad_data["view_count"] = current_view_count
        ad_data["favorites_count"] = favorites_count
        ad_data["user_favorited"] = user_favorited

        return {
            "success": True,
            "ad": ad_data
        }

    except Exception as e:
        print(f"Erro ao buscar anúncio {ad_id}: {e}")
        return {"success": False, "message": f"Erro ao buscar anúncio: {str(e)}"}


def update_ad(ad_id, user_id, update_data):
    """Atualiza um anúncio com validação."""
    try:
        # Validar IDs
        if not validate_object_id(ad_id):
            return {"success": False, "message": "ID de anúncio inválido"}

        if not validate_object_id(user_id):
            return {"success": False, "message": "ID de usuário inválido"}

        # Verificar se o anúncio existe e pertence ao usuário
        ad = db.ads.find_one({"_id": ObjectId(ad_id), "user_id": ObjectId(user_id)})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado ou acesso negado"}

        # Preparar dados para atualização
        allowed_fields = ["title", "description", "platform", "condition", "price", "desired_games", "image_url"]
        update_fields = {}

        for field in allowed_fields:
            if field in update_data:
                value = update_data[field]
                if value is not None:
                    if field in ["title", "description", "platform", "condition", "desired_games", "image_url"]:
                        update_fields[field] = str(value).strip()
                    elif field == "price":
                        try:
                            price = float(value)
                            if price > 0:
                                update_fields["price_per_hour"] = price
                        except ValueError:
                            return {"success": False, "message": "Preço deve ser um número válido"}

        update_fields["updated_at"] = datetime.utcnow()

        # Atualizar no banco
        result = db.ads.update_one(
            {"_id": ObjectId(ad_id)},
            {"$set": update_fields}
        )

        if result.modified_count > 0:
            return {"success": True, "message": "Anúncio atualizado com sucesso"}
        else:
            return {"success": True, "message": "Nenhuma alteração foi feita"}

    except Exception as e:
        print(f"Erro ao atualizar anúncio: {e}")
        return {"success": False, "message": f"Erro ao atualizar anúncio: {str(e)}"}


def delete_ad(ad_id, user_id):
    """Remove um anúncio com validação."""
    try:
        # Validar IDs
        if not validate_object_id(ad_id):
            return {"success": False, "message": "ID de anúncio inválido"}

        if not validate_object_id(user_id):
            return {"success": False, "message": "ID de usuário inválido"}

        # Verificar se o anúncio existe e pertence ao usuário
        ad = db.ads.find_one({"_id": ObjectId(ad_id), "user_id": ObjectId(user_id)})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado ou acesso negado"}

        # Remover do banco
        result = db.ads.delete_one({"_id": ObjectId(ad_id)})

        if result.deleted_count > 0:
            return {"success": True, "message": "Anúncio removido com sucesso"}
        else:
            return {"success": False, "message": "Erro ao remover anúncio"}

    except Exception as e:
        print(f"Erro ao remover anúncio: {e}")
        return {"success": False, "message": f"Erro ao remover anúncio: {str(e)}"}


def like_ad(ad_id, user_id):
    """Adiciona/remove curtida do anúncio com validação."""
    try:
        # Validar IDs
        if not validate_object_id(ad_id):
            return {"success": False, "message": "ID de anúncio inválido"}

        if not validate_object_id(user_id):
            return {"success": False, "message": "ID de usuário inválido"}

        # Verificar se o anúncio existe
        ad = db.ads.find_one({"_id": ObjectId(ad_id)})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado"}

        user_object_id = ObjectId(user_id)

        # Tentar remover a curtida primeiro
        remove_result = db.ads.update_one(
            {"_id": ObjectId(ad_id), "likes": user_object_id},
            {"$pull": {"likes": user_object_id}}
        )

        if remove_result.modified_count > 0:
            liked = False
            message = "Curtida removida"
        else:
            # Adicionar curtida
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
        print(f"Erro ao curtir anúncio: {e}")
        return {"success": False, "message": f"Erro ao curtir anúncio: {str(e)}"}


def get_ad_likes(ad_id, user_id=None):
    """Busca informações de curtidas do anúncio."""
    try:
        # Validar ad_id
        if not validate_object_id(ad_id):
            return {"success": False, "message": "ID de anúncio inválido"}

        ad = db.ads.find_one({"_id": ObjectId(ad_id)})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado"}

        likes = ad.get("likes", [])
        total_likes = len(likes)

        user_liked = False
        if user_id and validate_object_id(user_id):
            user_liked = ObjectId(user_id) in likes

        return {
            "success": True,
            "total_likes": total_likes,
            "user_liked": user_liked
        }

    except Exception as e:
        print(f"Erro ao buscar curtidas: {e}")
        return {"success": False, "message": f"Erro ao buscar curtidas: {str(e)}"}