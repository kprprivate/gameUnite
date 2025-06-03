from pymongo import MongoClient
import certifi
from datetime import datetime

MONGO_URI = "mongodb+srv://gameunite:qObf8Mz2ToZQSAKV@gameunite.yy6zqks.mongodb.net/?retryWrites=true&w=majority&appName=gameUnite"
DB_NAME = "gameunite"
BASE_URL = "http://127.0.0.1:5000/api/upload"


def update_all_images():
    """Atualiza todas as imagens no banco para usar o sistema de upload."""
    client = MongoClient(
        MONGO_URI,
        ssl=True,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000
    )

    db = client[DB_NAME]

    print("🔄 Atualizando imagens dos jogos...")

    # Mapeamento de jogos para imagens
    game_images = {
        "valorant": f"{BASE_URL}/games/medium/valorant.jpg",
        "counter-strike-2": f"{BASE_URL}/games/medium/cs2.jpg",
        "league-of-legends": f"{BASE_URL}/games/medium/lol.jpg",
        "cod-warzone": f"{BASE_URL}/games/medium/warzone.jpg",
        "minecraft": f"{BASE_URL}/games/medium/minecraft.jpg"
    }

    # Atualizar cada jogo
    for slug, image_url in game_images.items():
        result = db.games.update_one(
            {"slug": slug},
            {
                "$set": {
                    "image_url": image_url,
                    "cover_url": image_url.replace("/medium/", "/large/"),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        print(f"  Jogo {slug}: {'✅ Atualizado' if result.modified_count > 0 else '❌ Não encontrado'}")

    print("\n🔄 Configurando imagens padrão...")

    # Definir imagens padrão
    default_user_image = f"{BASE_URL}/profiles/medium/no-user-image.jpg"
    default_ad_image = f"{BASE_URL}/ads/medium/no-ads-image.jpg"

    # Atualizar usuários sem profile_pic ou com URLs antigas
    user_result = db.users.update_many(
        {
            "$or": [
                {"profile_pic": ""},
                {"profile_pic": {"$exists": False}},
                {"profile_pic": {"$regex": "^https://example.com"}}
            ]
        },
        {"$set": {"profile_pic": default_user_image, "updated_at": datetime.utcnow()}}
    )
    print(f"  Usuários atualizados: {user_result.modified_count}")

    # Atualizar anúncios sem imagem ou com URLs antigas
    ad_result = db.ads.update_many(
        {
            "$or": [
                {"image_url": {"$exists": False}},
                {"image_url": ""},
                {"image_url": {"$regex": "^https://example.com"}}
            ]
        },
        {"$set": {"image_url": default_ad_image, "updated_at": datetime.utcnow()}}
    )
    print(f"  Anúncios atualizados: {ad_result.modified_count}")

    print("\n🔄 Corrigindo URLs existentes...")

    # Corrigir URLs que apontam para /api/uploads para /api/upload

    # Jogos
    games_fixed = db.games.update_many(
        {"image_url": {"$regex": "/api/uploads/"}},
        [{"$set": {"image_url": {
            "$replaceOne": {"input": "$image_url", "find": "/api/uploads/", "replacement": "/api/upload/"}}}}]
    )

    db.games.update_many(
        {"cover_url": {"$regex": "/api/uploads/"}},
        [{"$set": {"cover_url": {
            "$replaceOne": {"input": "$cover_url", "find": "/api/uploads/", "replacement": "/api/upload/"}}}}]
    )

    # Usuários
    users_fixed = db.users.update_many(
        {"profile_pic": {"$regex": "/api/uploads/"}},
        [{"$set": {"profile_pic": {
            "$replaceOne": {"input": "$profile_pic", "find": "/api/uploads/", "replacement": "/api/upload/"}}}}]
    )

    # Anúncios
    ads_fixed = db.ads.update_many(
        {"image_url": {"$regex": "/api/uploads/"}},
        [{"$set": {"image_url": {
            "$replaceOne": {"input": "$image_url", "find": "/api/uploads/", "replacement": "/api/upload/"}}}}]
    )

    print(
        f"  URLs corrigidas - Jogos: {games_fixed.modified_count}, Usuários: {users_fixed.modified_count}, Anúncios: {ads_fixed.modified_count}")

    client.close()
    print("\n✅ Todas as imagens foram atualizadas com sucesso!")
    print(f"🌐 Base URL: {BASE_URL}")
    print("\n📋 URLs de exemplo:")
    print(f"  - Jogos: {BASE_URL}/games/medium/valorant.jpg")
    print(f"  - Usuários: {BASE_URL}/profiles/medium/no-user-image.jpg")
    print(f"  - Anúncios: {BASE_URL}/ads/medium/no-ads-image.jpg")


if __name__ == "__main__":
    update_all_images()