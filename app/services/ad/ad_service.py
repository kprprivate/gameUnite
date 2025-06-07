from datetime import datetime
from bson import ObjectId
from app.db.mongo_client import db
from app.models.user.crud import get_user_by_id
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


def check_ad_ownership(ad_id, user_id):
    """Verifica se o usuário é dono do anúncio."""
    try:
        if not validate_object_id(ad_id) or not validate_object_id(user_id):
            return False

        ad = db.ads.find_one({
            "_id": ObjectId(ad_id),
            "user_id": ObjectId(user_id)
        })

        return ad is not None
    except Exception as e:
        logger.error(f"Erro ao verificar propriedade do anúncio: {e}")
        return False


def get_user_stats(user_id):
    """Busca estatísticas do usuário (vendas, avaliações, etc)."""
    try:
        if not validate_object_id(user_id):
            return {}

        # Buscar estatísticas de vendas
        sales_count = db.orders.count_documents({
            "seller_id": ObjectId(user_id),
            "status": "delivered"
        })

        # Buscar dados reais do usuário
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {}

        # Data de criação do usuário
        member_since = user.get("created_at", datetime.utcnow()).year

        # Por enquanto, usar valores baseados em vendas (depois implementar sistema de avaliações)
        avg_rating = min(5.0, 3.5 + (sales_count * 0.1))  # Rating baseado em vendas
        rating_count = sales_count

        return {
            "sales_count": sales_count,
            "avg_rating": round(avg_rating, 1),
            "rating_count": rating_count,
            "member_since": member_since
        }

    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas do usuário: {e}")
        return {
            "sales_count": 0,
            "avg_rating": 0,
            "rating_count": 0,
            "member_since": datetime.utcnow().year
        }


def get_favorites_info(ad_id, user_id=None):
    """Busca informações de favoritos do anúncio."""
    try:
        if not validate_object_id(ad_id):
            return {"total": 0, "user_favorited": False}

        # Contar total de favoritos
        total_favorites = db.favorites.count_documents({"ad_id": ObjectId(ad_id)})

        # Verificar se o usuário atual favoritou
        user_favorited = False
        if user_id and validate_object_id(user_id):
            user_favorite = db.favorites.find_one({
                "user_id": ObjectId(user_id),
                "ad_id": ObjectId(ad_id)
            })
            user_favorited = user_favorite is not None

        return {
            "total": total_favorites,
            "user_favorited": user_favorited
        }

    except Exception as e:
        logger.error(f"Erro ao buscar favoritos: {e}")
        return {"total": 0, "user_favorited": False}


def is_ad_in_user_cart(ad_id, user_id):
    """Verifica se o anúncio está no carrinho do usuário."""
    try:
        if not validate_object_id(ad_id) or not validate_object_id(user_id):
            return False

        cart_item = db.cart.find_one({
            "user_id": ObjectId(user_id),
            "ad_id": ObjectId(ad_id)
        })

        return cart_item is not None

    except Exception as e:
        logger.error(f"Erro ao verificar carrinho: {e}")
        return False


def format_ad_response(ad, game=None, user=None, current_user_id=None):
    """Formata resposta do anúncio com todas as informações necessárias."""
    try:
        if not ad or not ad.get("_id"):
            raise ValueError("Anúncio inválido ou sem ID")

        # Converter IDs para string para comparação segura
        ad_user_id = str(ad["user_id"]) if ad.get("user_id") else None
        current_user_str = str(current_user_id) if current_user_id else None
        ad_id_str = str(ad["_id"])

        # Dados básicos do anúncio
        ad_data = {
            "_id": ad_id_str,
            "user_id": ad_user_id,
            "game_id": str(ad["game_id"]) if ad.get("game_id") else None,
            "title": ad.get("title", ""),
            "description": ad.get("description", ""),
            "ad_type": ad.get("ad_type", "venda"),
            "platform": ad.get("platform", "PC"),
            "condition": ad.get("condition", "usado"),
            "status": ad.get("status", "active"),
            "is_boosted": ad.get("is_boosted", False),
            "view_count": ad.get("view_count", 0),
            "created_at": ad["created_at"].isoformat() if ad.get("created_at") else datetime.utcnow().isoformat(),
            "updated_at": ad["updated_at"].isoformat() if ad.get("updated_at") else datetime.utcnow().isoformat(),

            # Flag de propriedade
            "is_owner": ad_user_id == current_user_str if current_user_str else False,
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

        # Buscar informações de favoritos
        favorites_info = get_favorites_info(ad_id_str, current_user_id)
        ad_data["favorites_count"] = favorites_info["total"]
        ad_data["is_favorited"] = favorites_info["user_favorited"]
        ad_data["user_favorited"] = favorites_info["user_favorited"]  # Alias para compatibilidade

        # Verificar se está no carrinho
        if current_user_id:
            ad_data["is_in_cart"] = is_ad_in_user_cart(ad_id_str, current_user_id)
        else:
            ad_data["is_in_cart"] = False

        # Adicionar dados do jogo
        if game:
            ad_data["game"] = {
                "_id": str(game["_id"]) if game.get("_id") else None,
                "name": game.get("name", ""),
                "image_url": game.get("image_url", "")
            }

        # Adicionar dados do usuário com estatísticas dinâmicas
        if user:
            user_stats = get_user_stats(ad_user_id) if ad_user_id else {}

            ad_data["user"] = {
                "_id": str(user["_id"]) if user.get("_id") else None,
                "username": user.get("username", ""),
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", ""),
                "profile_pic": user.get("profile_pic", ""),
                "location": user.get("location", ""),

                # Estatísticas dinâmicas
                "seller_rating": user_stats.get("avg_rating", 0),
                "seller_ratings_count": user_stats.get("rating_count", 0),
                "sales_count": user_stats.get("sales_count", 0),
                "member_since": user_stats.get("member_since", datetime.utcnow().year),

                # Informações de localização
                "city": user.get("city", ""),
                "state": user.get("state", ""),
                "country": user.get("country", "Brasil")
            }

        return ad_data

    except Exception as e:
        logger.error(f"Erro ao formatar resposta do anúncio: {e}")
        return {
            "_id": str(ad.get("_id", ObjectId())),
            "title": ad.get("title", "Anúncio inválido"),
            "description": "Erro ao carregar dados do anúncio",
            "ad_type": "venda",
            "price": 0,
            "status": "inactive",
            "created_at": datetime.utcnow().isoformat(),
            "is_owner": False,
            "favorites_count": 0,
            "is_favorited": False,
            "is_in_cart": False
        }


def get_ad_by_id(ad_id, increment_view=True, user_id=None):
    """Busca um anúncio específico com todas as informações."""
    try:
        if not validate_object_id(ad_id):
            return {"success": False, "message": "ID de anúncio inválido"}

        logger.info(f"Buscando anúncio {ad_id} para usuário {user_id}")

        ad = db.ads.find_one({"_id": ObjectId(ad_id)})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado"}

        # Buscar dados do usuário/vendedor
        user = None
        if ad.get("user_id"):
            user = get_user_by_id(str(ad["user_id"]))

        # Buscar dados do jogo
        game = None
        if ad.get("game_id"):
            game = db.games.find_one({"_id": ad["game_id"]})

        # Verificar se é o próprio usuário antes de incrementar view
        ad_owner_id = str(ad["user_id"]) if ad.get("user_id") else None
        current_user_str = str(user_id) if user_id else None
        is_owner = ad_owner_id == current_user_str

        # Incrementar contador de visualizações apenas se não for o próprio dono
        current_view_count = ad.get("view_count", 0)
        if increment_view and not is_owner:
            try:
                updated_ad = db.ads.find_one_and_update(
                    {"_id": ObjectId(ad_id)},
                    {"$inc": {"view_count": 1}},
                    return_document=True
                )
                current_view_count = updated_ad.get("view_count", current_view_count + 1)
                logger.info(f"View count incrementado para {current_view_count}")
            except Exception as e:
                logger.error(f"Erro ao incrementar view count: {e}")

        # Formatar resposta com todas as informações
        ad_data = format_ad_response(ad, game, user, user_id)
        ad_data["view_count"] = current_view_count

        logger.info(
            f"Anúncio formatado com sucesso: favoritos={ad_data.get('favorites_count')}, no_carrinho={ad_data.get('is_in_cart')}")

        return {
            "success": True,
            "ad": ad_data
        }

    except Exception as e:
        logger.error(f"Erro ao buscar anúncio {ad_id}: {e}")
        return {"success": False, "message": f"Erro ao buscar anúncio: {str(e)}"}


def like_ad(ad_id, user_id):
    """Adiciona/remove curtida do anúncio com verificação anti-self-like."""
    try:
        if not validate_object_id(ad_id):
            return {"success": False, "message": "ID de anúncio inválido"}

        if not validate_object_id(user_id):
            return {"success": False, "message": "ID de usuário inválido"}

        # Verificar se o anúncio existe
        ad = db.ads.find_one({"_id": ObjectId(ad_id)})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado"}

        # Verificar se não é o próprio anúncio
        ad_owner_id = str(ad["user_id"]) if ad.get("user_id") else None
        current_user_str = str(user_id)

        if ad_owner_id == current_user_str:
            return {"success": False, "message": "Você não pode curtir seu próprio anúncio"}

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
        logger.error(f"Erro ao curtir anúncio: {e}")
        return {"success": False, "message": f"Erro ao curtir anúncio: {str(e)}"}


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
        ad_response = format_ad_response(ad, game, user, user_id)
        ad_response["_id"] = str(result.inserted_id)

        return {
            "success": True,
            "message": "Anúncio criado com sucesso",
            "ad": ad_response
        }

    except Exception as e:
        logger.error(f"Erro ao criar anúncio: {e}")
        return {"success": False, "message": f"Erro interno ao criar anúncio: {str(e)}"}


def update_ad(ad_id, user_id, update_data):
    """Atualiza um anúncio com verificação de propriedade."""
    try:
        # Validar IDs
        if not validate_object_id(ad_id):
            return {"success": False, "message": "ID de anúncio inválido"}

        if not validate_object_id(user_id):
            return {"success": False, "message": "ID de usuário inválido"}

        # Verificação de propriedade
        if not check_ad_ownership(ad_id, user_id):
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
        logger.error(f"Erro ao atualizar anúncio: {e}")
        return {"success": False, "message": f"Erro ao atualizar anúncio: {str(e)}"}


def delete_ad(ad_id, user_id):
    """Remove um anúncio com verificação de propriedade."""
    try:
        # Validar IDs
        if not validate_object_id(ad_id):
            return {"success": False, "message": "ID de anúncio inválido"}

        if not validate_object_id(user_id):
            return {"success": False, "message": "ID de usuário inválido"}

        # Verificação de propriedade
        if not check_ad_ownership(ad_id, user_id):
            return {"success": False, "message": "Anúncio não encontrado ou acesso negado"}

        # Remover do banco
        result = db.ads.delete_one({"_id": ObjectId(ad_id)})

        if result.deleted_count > 0:
            return {"success": True, "message": "Anúncio removido com sucesso"}
        else:
            return {"success": False, "message": "Erro ao remover anúncio"}

    except Exception as e:
        logger.error(f"Erro ao remover anúncio: {e}")
        return {"success": False, "message": f"Erro ao remover anúncio: {str(e)}"}


def get_ad_likes(ad_id, user_id=None):
    """Busca informações de curtidas do anúncio."""
    try:
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
        logger.error(f"Erro ao buscar curtidas: {e}")
        return {"success": False, "message": f"Erro ao buscar curtidas: {str(e)}"}


def get_user_ads(user_id, limit=20, skip=0):
    """Busca anúncios do usuário com validação rigorosa."""
    try:
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
                ad_data = format_ad_response(ad, game, None, user_id)
                ads.append(ad_data)

            except Exception as e:
                logger.error(f"Erro ao processar anúncio {ad.get('_id')}: {e}")
                continue

        return {
            "success": True,
            "ads": ads,
            "total": len(ads)
        }

    except Exception as e:
        logger.error(f"Erro ao buscar anúncios do usuário: {e}")
        return {"success": False, "message": f"Erro ao buscar anúncios: {str(e)}"}


def get_favorites_info(ad_id, user_id=None):
    """Busca informações de favoritos do anúncio - CORRIGIDO."""
    try:
        if not validate_object_id(ad_id):
            return {"total": 0, "user_favorited": False}

        # Contar total de favoritos
        total_favorites = db.favorites.count_documents({"ad_id": ObjectId(ad_id)})

        # Verificar se o usuário atual favoritou
        user_favorited = False
        if user_id and validate_object_id(user_id):
            user_favorite = db.favorites.find_one({
                "user_id": ObjectId(user_id),
                "ad_id": ObjectId(ad_id)
            })
            user_favorited = user_favorite is not None

        print(f"📊 Favoritos - Total: {total_favorites}, Usuário favoritou: {user_favorited}")

        return {
            "total": total_favorites,
            "user_favorited": user_favorited
        }

    except Exception as e:
        logger.error(f"Erro ao buscar favoritos: {e}")
        return {"total": 0, "user_favorited": False}


def get_user_stats(user_id):
    """Busca estatísticas do usuário - MELHORADO."""
    try:
        if not validate_object_id(user_id):
            return {}

        # Buscar estatísticas de vendas
        sales_count = db.orders.count_documents({
            "seller_id": ObjectId(user_id),
            "status": "delivered"
        })

        # CORREÇÃO: Buscar dados reais do usuário
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {}

        # Data de criação do usuário
        member_since = user.get("created_at", datetime.utcnow()).year

        # Por enquanto, usar valores baseados em vendas (depois implementar sistema de avaliações)
        avg_rating = min(5.0, 3.5 + (sales_count * 0.1))  # Rating baseado em vendas
        rating_count = sales_count

        return {
            "sales_count": sales_count,
            "avg_rating": round(avg_rating, 1),
            "rating_count": rating_count,
            "member_since": member_since
        }

    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas do usuário: {e}")
        return {
            "sales_count": 0,
            "avg_rating": 0,
            "rating_count": 0,
            "member_since": datetime.utcnow().year
        }