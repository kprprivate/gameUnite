#!/usr/bin/env python3
"""
Script para popular o banco de dados com dados iniciais de teste
Execute: python populate_db.py
"""

import os
import sys
from datetime import datetime, timedelta
from bson import ObjectId

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.db.mongo_client import db
from app.utils.helpers.password_helpers import hash_password


def populate_games():
    """Popula jogos iniciais."""
    print("Populando jogos...")

    games = [
        {
            "name": "FIFA 24",
            "slug": "fifa-24",
            "description": "O mais recente jogo de futebol da EA Sports com gráficos realistas e jogabilidade aprimorada.",
            "image_url": "https://via.placeholder.com/400x600/3B82F6/FFFFFF?text=FIFA+24",
            "cover_url": "https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=FIFA+24+Cover",
            "is_featured": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "God of War Ragnarök",
            "slug": "god-of-war-ragnarok",
            "description": "Continue a jornada épica de Kratos e Atreus nos nove reinos da mitologia nórdica.",
            "image_url": "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=God+of+War",
            "cover_url": "https://via.placeholder.com/800x400/DC2626/FFFFFF?text=GoW+Cover",
            "is_featured": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "The Last of Us Part II",
            "slug": "the-last-of-us-part-2",
            "description": "Sequência aclamada do jogo pós-apocalíptico com Ellie como protagonista.",
            "image_url": "https://via.placeholder.com/400x600/059669/FFFFFF?text=TLOU+2",
            "cover_url": "https://via.placeholder.com/800x400/059669/FFFFFF?text=TLOU+2+Cover",
            "is_featured": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Cyberpunk 2077",
            "slug": "cyberpunk-2077",
            "description": "RPG futurista em mundo aberto ambientado em Night City.",
            "image_url": "https://via.placeholder.com/400x600/FBBF24/000000?text=Cyberpunk",
            "cover_url": "https://via.placeholder.com/800x400/FBBF24/000000?text=Cyberpunk+Cover",
            "is_featured": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Spider-Man: Miles Morales",
            "slug": "spider-man-miles-morales",
            "description": "Aventura do jovem Miles Morales como o novo Homem-Aranha.",
            "image_url": "https://via.placeholder.com/400x600/EF4444/FFFFFF?text=Spider-Man",
            "cover_url": "https://via.placeholder.com/800x400/EF4444/FFFFFF?text=Spider-Man+Cover",
            "is_featured": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]

    # Limpar jogos existentes
    db.games.delete_many({})

    # Inserir novos jogos
    result = db.games.insert_many(games)
    print(f"✅ {len(result.inserted_ids)} jogos inseridos!")

    return list(result.inserted_ids)


def populate_users():
    """Popula usuários iniciais."""
    print("Populando usuários...")

    users = [
        {
            "username": "gamer123",
            "email": "gamer123@email.com",
            "password": hash_password("123456"),
            "first_name": "João",
            "last_name": "Silva",
            "profile_pic": "",
            "bio": "Gamer apaixonado por RPGs e jogos de esporte. Vendo alguns jogos da minha coleção.",
            "role": "user",
            "seller_rating": 4.8,
            "buyer_rating": 4.9,
            "seller_ratings_count": 25,
            "buyer_ratings_count": 18,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None,
            "is_active": True,
            "is_verified": True,
            "verification_token": None,
            "reset_password_token": None,
            "reset_password_expires": None
        },
        {
            "username": "playergirl",
            "email": "maria@email.com",
            "password": hash_password("123456"),
            "first_name": "Maria",
            "last_name": "Santos",
            "profile_pic": "",
            "bio": "Jogadora casual, procurando jogos novos para experimentar!",
            "role": "user",
            "seller_rating": 4.5,
            "buyer_rating": 5.0,
            "seller_ratings_count": 12,
            "buyer_ratings_count": 30,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None,
            "is_active": True,
            "is_verified": True,
            "verification_token": None,
            "reset_password_token": None,
            "reset_password_expires": None
        },
        {
            "username": "admin",
            "email": "admin@gameunite.com",
            "password": hash_password("admin123"),
            "first_name": "Admin",
            "last_name": "GameUnite",
            "profile_pic": "",
            "bio": "Administrador da plataforma GameUnite",
            "role": "admin",
            "seller_rating": 0,
            "buyer_rating": 0,
            "seller_ratings_count": 0,
            "buyer_ratings_count": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None,
            "is_active": True,
            "is_verified": True,
            "verification_token": None,
            "reset_password_token": None,
            "reset_password_expires": None
        }
    ]

    # Limpar usuários existentes (exceto admin se já existir)
    db.users.delete_many({"role": {"$ne": "admin"}})

    # Verificar se admin já existe
    existing_admin = db.users.find_one({"email": "admin@gameunite.com"})
    if existing_admin:
        users = [u for u in users if u["email"] != "admin@gameunite.com"]

    if users:
        result = db.users.insert_many(users)
        print(f"✅ {len(result.inserted_ids)} usuários inseridos!")
        return list(result.inserted_ids)
    else:
        print("✅ Usuários já existem!")
        return []


def populate_ads(game_ids, user_ids):
    """Popula anúncios iniciais."""
    print("Populando anúncios...")

    if not game_ids or not user_ids:
        print("❌ Erro: Jogos ou usuários não encontrados!")
        return

    ads = [
        {
            "user_id": user_ids[0],
            "game_id": game_ids[0],  # FIFA 24
            "title": "FIFA 24 - PlayStation 5 em perfeito estado",
            "description": "Jogo em excelente condição, pouco usado. Comprei no lançamento mas acabei não jogando muito. Inclui todos os updates e DLCs. Sem riscos no disco, funciona perfeitamente.",
            "ad_type": "venda",
            "price": 200.00,
            "platform": "PlayStation 5",
            "condition": "seminovo",
            "images": [
                "https://via.placeholder.com/600x400/3B82F6/FFFFFF?text=FIFA+24+PS5",
                "https://via.placeholder.com/600x400/1D4ED8/FFFFFF?text=Game+Box"
            ],
            "desired_games": "",
            "is_boosted": True,
            "boost_expires_at": datetime.utcnow() + timedelta(days=7),
            "status": "active",
            "views": 47,
            "likes": 12,
            "created_at": datetime.utcnow() - timedelta(days=3),
            "updated_at": datetime.utcnow() - timedelta(days=3)
        },
        {
            "user_id": user_ids[1],
            "game_id": game_ids[1],  # God of War
            "title": "God of War Ragnarök - Troca por RPG",
            "description": "Jogo zerado, todos os troféus desbloqueados. Procurando trocar por algum RPG interessante, preferencialmente Final Fantasy ou Persona.",
            "ad_type": "troca",
            "price": 0,
            "platform": "PlayStation 5",
            "condition": "usado",
            "images": [
                "https://via.placeholder.com/600x400/DC2626/FFFFFF?text=God+of+War"
            ],
            "desired_games": "Final Fantasy XVI, Persona 5 Royal, Elden Ring",
            "is_boosted": False,
            "boost_expires_at": None,
            "status": "active",
            "views": 32,
            "likes": 8,
            "created_at": datetime.utcnow() - timedelta(days=5),
            "updated_at": datetime.utcnow() - timedelta(days=5)
        },
        {
            "user_id": user_ids[0],
            "game_id": game_ids[2],  # The Last of Us Part II
            "title": "The Last of Us Part II - Edição Especial",
            "description": "Edição especial lacrada, nunca aberta. Contém steelbook, artbook e outros itens colecionáveis. Ideal para colecionadores!",
            "ad_type": "venda",
            "price": 350.00,
            "platform": "PlayStation 4",
            "condition": "novo",
            "images": [
                "https://via.placeholder.com/600x400/059669/FFFFFF?text=TLOU+2+Special"
            ],
            "desired_games": "",
            "is_boosted": True,
            "boost_expires_at": datetime.utcnow() + timedelta(days=10),
            "status": "active",
            "views": 89,
            "likes": 23,
            "created_at": datetime.utcnow() - timedelta(days=1),
            "updated_at": datetime.utcnow() - timedelta(days=1)
        },
        {
            "user_id": user_ids[1],
            "game_id": game_ids[3],  # Cyberpunk 2077
            "title": "Procuro Cyberpunk 2077 para PC",
            "description": "Estou procurando Cyberpunk 2077 para PC, preferencialmente a versão da GOG (sem DRM). Pago até R$ 80 dependendo do estado.",
            "ad_type": "procura",
            "price": 80.00,
            "platform": "PC",
            "condition": "usado",
            "images": [],
            "desired_games": "",
            "is_boosted": False,
            "boost_expires_at": None,
            "status": "active",
            "views": 15,
            "likes": 3,
            "created_at": datetime.utcnow() - timedelta(hours=12),
            "updated_at": datetime.utcnow() - timedelta(hours=12)
        }
    ]

    # Limpar anúncios existentes
    db.ads.delete_many({})

    # Inserir novos anúncios
    result = db.ads.insert_many(ads)
    print(f"✅ {len(result.inserted_ids)} anúncios inseridos!")


def main():
    """Função principal para popular o banco."""
    print("🚀 Iniciando população do banco de dados...")

    # Criar aplicação Flask para ter contexto
    app = create_app('testing')

    with app.app_context():
        try:
            # Popular dados
            game_ids = populate_games()
            user_ids = populate_users()

            # Buscar IDs se não foram retornados (usuários já existiam)
            if not user_ids:
                users = list(db.users.find({"role": "user"}, {"_id": 1}))
                user_ids = [user["_id"] for user in users]

            populate_ads(game_ids, user_ids)

            print("\n✅ População do banco concluída com sucesso!")
            print("\n📋 Dados criados:")
            print("   • Usuários de teste:")
            print("     - gamer123@email.com (senha: 123456)")
            print("     - maria@email.com (senha: 123456)")
            print("     - admin@gameunite.com (senha: admin123)")
            print("   • 5 jogos em destaque")
            print("   • 4 anúncios de exemplo")

        except Exception as e:
            print(f"❌ Erro ao popular banco: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()