# init_complete_db.py
from pymongo import MongoClient, ASCENDING, DESCENDING
import certifi
from datetime import datetime, timedelta
from bson import ObjectId
import bcrypt
import random

# MongoDB Atlas connection
uri = "mongodb+srv://gameunite:qObf8Mz2ToZQSAKV@gameunite.yy6zqks.mongodb.net/?retryWrites=true&w=majority&appName=gameUnite"
client = MongoClient(uri, tlsCAFile=certifi.where())

# Select database
db = "gameunite_test"

# Helper function to hash passwords
def hash_password(password):
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

print("Starting database initialization...")

# ---- 1. GAMES COLLECTION ----
print("Setting up games collection...")

# Clear existing data if needed
db.games.delete_many({})

# Sample games data
games_data = [
    {
        "name": "Valorant",
        "slug": "valorant",
        "description": "Um FPS tático 5v5 baseado em personagens com habilidades únicas.",
        "image_url": "https://example.com/images/valorant.jpg",
        "cover_url": "https://example.com/covers/valorant-cover.jpg",
        "is_featured": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "name": "Counter-Strike 2",
        "slug": "counter-strike-2",
        "description": "O clássico FPS tático agora com gráficos renovados e jogabilidade aprimorada.",
        "image_url": "https://example.com/images/cs2.jpg",
        "cover_url": "https://example.com/covers/cs2-cover.jpg",
        "is_featured": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "name": "League of Legends",
        "slug": "league-of-legends",
        "description": "MOBA 5v5 com mais de 150 campeões e estratégia em equipe.",
        "image_url": "https://example.com/images/lol.jpg",
        "cover_url": "https://example.com/covers/lol-cover.jpg",
        "is_featured": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "name": "Call of Duty: Warzone",
        "slug": "cod-warzone",
        "description": "Battle royale com até 150 jogadores em mapas variados.",
        "image_url": "https://example.com/images/warzone.jpg",
        "cover_url": "https://example.com/covers/warzone-cover.jpg",
        "is_featured": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "name": "Minecraft",
        "slug": "minecraft",
        "description": "Jogo sandbox de construção e exploração em mundo aberto.",
        "image_url": "https://example.com/images/minecraft.jpg",
        "cover_url": "https://example.com/covers/minecraft-cover.jpg",
        "is_featured": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
]

# Insert games
game_ids = []
for game in games_data:
    result = db.games.insert_one(game)
    game_ids.append(result.inserted_id)
    print(f"Created game: {game['name']} with ID: {result.inserted_id}")

# Create indexes for games collection
db.games.create_index("name", unique=True)
db.games.create_index("slug", unique=True)
db.games.create_index("is_featured")

# ---- 2. USERS COLLECTION ----
print("Setting up users collection...")

# Clear existing users
db.users.delete_many({})

# Sample users data
users_data = [
    {
        "username": "admin",
        "email": "admin@gameunite.com",
        "password": hash_password("Admin@123"),
        "first_name": "Admin",
        "last_name": "User",
        "profile_pic": "https://example.com/profiles/admin.jpg",
        "bio": "Administrador da plataforma GameUnite.",
        "role": "admin",
        "seller_rating": 0,
        "buyer_rating": 0,
        "seller_ratings_count": 0,
        "buyer_ratings_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": datetime.utcnow(),
        "is_active": True,
        "is_verified": True,
        "verification_token": None,
        "reset_password_token": None,
        "reset_password_expires": None
    },
    {
        "username": "support",
        "email": "support@gameunite.com",
        "password": hash_password("Support@123"),
        "first_name": "Support",
        "last_name": "Team",
        "profile_pic": "https://example.com/profiles/support.jpg",
        "bio": "Equipe de suporte da GameUnite.",
        "role": "support",
        "seller_rating": 0,
        "buyer_rating": 0,
        "seller_ratings_count": 0,
        "buyer_ratings_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": datetime.utcnow(),
        "is_active": True,
        "is_verified": True,
        "verification_token": None,
        "reset_password_token": None,
        "reset_password_expires": None
    },
    {
        "username": "radiante_coach",
        "email": "coach@example.com",
        "password": hash_password("Coach@123"),
        "first_name": "Pedro",
        "last_name": "Silva",
        "profile_pic": "https://example.com/profiles/pedro.jpg",
        "bio": "Coach profissional de Valorant, rank Radiante há 5 temporadas.",
        "role": "user",
        "seller_rating": 4.8,
        "buyer_rating": 5.0,
        "seller_ratings_count": 25,
        "buyer_ratings_count": 3,
        "created_at": datetime.utcnow() - timedelta(days=45),
        "updated_at": datetime.utcnow(),
        "last_login": datetime.utcnow() - timedelta(hours=5),
        "is_active": True,
        "is_verified": True,
        "verification_token": None,
        "reset_password_token": None,
        "reset_password_expires": None
    },
    {
        "username": "global_elite",
        "email": "csgopro@example.com",
        "password": hash_password("CSGOPro@123"),
        "first_name": "Carlos",
        "last_name": "Mendes",
        "profile_pic": "https://example.com/profiles/carlos.jpg",
        "bio": "Ex-profissional de CS:GO, 3000+ horas de jogo e experiência em campeonatos.",
        "role": "user",
        "seller_rating": 4.9,
        "buyer_rating": 4.7,
        "seller_ratings_count": 17,
        "buyer_ratings_count": 8,
        "created_at": datetime.utcnow() - timedelta(days=30),
        "updated_at": datetime.utcnow(),
        "last_login": datetime.utcnow() - timedelta(days=1),
        "is_active": True,
        "is_verified": True,
        "verification_token": None,
        "reset_password_token": None,
        "reset_password_expires": None
    },
    {
        "username": "lol_diamond",
        "email": "lolplayer@example.com",
        "password": hash_password("LoLGamer@123"),
        "first_name": "Ana",
        "last_name": "Santos",
        "profile_pic": "https://example.com/profiles/ana.jpg",
        "bio": "Main mid Diamond I, especialista em campeões de controle.",
        "role": "user",
        "seller_rating": 4.5,
        "buyer_rating": 5.0,
        "seller_ratings_count": 12,
        "buyer_ratings_count": 4,
        "created_at": datetime.utcnow() - timedelta(days=60),
        "updated_at": datetime.utcnow(),
        "last_login": datetime.utcnow() - timedelta(hours=12),
        "is_active": True,
        "is_verified": True,
        "verification_token": None,
        "reset_password_token": None,
        "reset_password_expires": None
    },
    {
        "username": "noob_player",
        "email": "newbie@example.com",
        "password": hash_password("Newbie@123"),
        "first_name": "João",
        "last_name": "Costa",
        "profile_pic": "https://example.com/profiles/joao.jpg",
        "bio": "Jogador casual buscando aprender mais sobre FPS táticos.",
        "role": "user",
        "seller_rating": 0,
        "buyer_rating": 4.6,
        "seller_ratings_count": 0,
        "buyer_ratings_count": 7,
        "created_at": datetime.utcnow() - timedelta(days=15),
        "updated_at": datetime.utcnow(),
        "last_login": datetime.utcnow() - timedelta(minutes=30),
        "is_active": True,
        "is_verified": True,
        "verification_token": None,
        "reset_password_token": None,
        "reset_password_expires": None
    },
    {
        "username": "minecraft_builder",
        "email": "builder@example.com",
        "password": hash_password("Builder@123"),
        "first_name": "Lucas",
        "last_name": "Oliveira",
        "profile_pic": "https://example.com/profiles/lucas.jpg",
        "bio": "Construtor profissional de Minecraft, especialista em redstone.",
        "role": "user",
        "seller_rating": 4.3,
        "buyer_rating": 4.5,
        "seller_ratings_count": 9,
        "buyer_ratings_count": 2,
        "created_at": datetime.utcnow() - timedelta(days=90),
        "updated_at": datetime.utcnow(),
        "last_login": datetime.utcnow() - timedelta(days=3),
        "is_active": True,
        "is_verified": True,
        "verification_token": None,
        "reset_password_token": None,
        "reset_password_expires": None
    }
]

# Insert users
user_ids = {}
for user in users_data:
    result = db.users.insert_one(user)
    user_ids[user['username']] = result.inserted_id
    print(f"Created user: {user['username']} with ID: {result.inserted_id}")

# Create indexes for users collection
db.users.create_index("email", unique=True)
db.users.create_index("username", unique=True)
db.users.create_index("role")

# ---- 3. ADS COLLECTION ----
print("Setting up ads collection...")

# Clear existing ads
db.ads.delete_many({})

# Sample ads data
ads_data = [
    {
        "user_id": user_ids["radiante_coach"],
        "game_id": game_ids[0],  # Valorant
        "title": "Coach profissional de Valorant",
        "description": "Sou jogador Radiante e posso te ajudar a melhorar suas habilidades no Valorant. Foco em posicionamento, aim e uso de habilidades. Treinamento personalizado conforme suas necessidades.",
        "ad_type": "paid",
        "price_per_hour": 50.00,
        "image_url": "https://example.com/ads/valorant-coach.jpg",
        "is_boosted": True,
        "boost_expires_at": datetime.utcnow() + timedelta(days=7),
        "status": "active",
        "view_count": 150,
        "created_at": datetime.utcnow() - timedelta(days=5),
        "updated_at": datetime.utcnow()
    },
    {
        "user_id": user_ids["global_elite"],
        "game_id": game_ids[1],  # Counter-Strike 2
        "title": "Coach de CS2 - Ex-profissional",
        "description": "Aprenda com um ex-jogador profissional. Foco em estratégia de equipe, posicionamento, economia e treino de mira. Sessões gravadas para revisão posterior.",
        "ad_type": "paid",
        "price_per_hour": 65.00,
        "image_url": "https://example.com/ads/cs2-coach.jpg",
        "is_boosted": True,
        "boost_expires_at": datetime.utcnow() + timedelta(days=10),
        "status": "active",
        "view_count": 120,
        "created_at": datetime.utcnow() - timedelta(days=7),
        "updated_at": datetime.utcnow()
    },
    {
        "user_id": user_ids["lol_diamond"],
        "game_id": game_ids[2],  # League of Legends
        "title": "Coach de mid lane - Diamante I",
        "description": "Aulas de LoL focadas em mid lane. Aprenda a dominar campeões de controle, melhorar farm e roaming. Análise de replays incluída.",
        "ad_type": "paid",
        "price_per_hour": 40.00,
        "image_url": "https://example.com/ads/lol-coach.jpg",
        "is_boosted": False,
        "boost_expires_at": None,
        "status": "active",
        "view_count": 87,
        "created_at": datetime.utcnow() - timedelta(days=10),
        "updated_at": datetime.utcnow()
    },
    {
        "user_id": user_ids["global_elite"],
        "game_id": game_ids[1],  # Counter-Strike 2
        "title": "Procuro time para jogar CS2",
        "description": "Sou Global Elite procurando time para jogar CS2 casualmente nos finais de semana. Prefiro jogadores com bom humor e que não tiltem facilmente.",
        "ad_type": "free",
        "price_per_hour": None,
        "image_url": "https://example.com/ads/cs2-team.jpg",
        "is_boosted": False,
        "boost_expires_at": None,
        "status": "active",
        "view_count": 34,
        "created_at": datetime.utcnow() - timedelta(days=2),
        "updated_at": datetime.utcnow()
    },
    {
        "user_id": user_ids["minecraft_builder"],
        "game_id": game_ids[4],  # Minecraft
        "title": "Construções personalizadas em Minecraft",
        "description": "Faço construções personalizadas em Minecraft, desde casas pequenas até cidades inteiras. Especialista em redstone e automação.",
        "ad_type": "paid",
        "price_per_hour": 25.00,
        "image_url": "https://example.com/ads/minecraft-builder.jpg",
        "is_boosted": False,
        "boost_expires_at": None,
        "status": "active",
        "view_count": 56,
        "created_at": datetime.utcnow() - timedelta(days=15),
        "updated_at": datetime.utcnow()
    },
    {
        "user_id": user_ids["radiante_coach"],
        "game_id": game_ids[3],  # COD Warzone
        "title": "Duo para Warzone - Jogador experiente",
        "description": "Procuro parceiro para jogar Warzone. Tenho mais de 100 vitórias e K/D de 2.3.",
        "ad_type": "free",
        "price_per_hour": None,
        "image_url": "https://example.com/ads/warzone-duo.jpg",
        "is_boosted": False,
        "boost_expires_at": None,
        "status": "active",
        "view_count": 22,
        "created_at": datetime.utcnow() - timedelta(days=1),
        "updated_at": datetime.utcnow()
    }
]

# Insert ads
ad_ids = []
for ad in ads_data:
    result = db.ads.insert_one(ad)
    ad_ids.append(result.inserted_id)
    print(f"Created ad: {ad['title']} with ID: {result.inserted_id}")

# Create indexes for ads collection
db.ads.create_index("game_id")
db.ads.create_index("user_id")
db.ads.create_index("ad_type")
db.ads.create_index("is_boosted")
db.ads.create_index("status")
db.ads.create_index([("created_at", DESCENDING)])

# ---- 4. ORDERS COLLECTION ----
print("Setting up orders collection...")

# Clear existing orders
db.orders.delete_many({})

# Create a few completed and active orders
orders_data = [
    {
        "buyer_id": user_ids["noob_player"],
        "seller_id": user_ids["radiante_coach"],
        "ad_id": ad_ids[0],
        "game_id": game_ids[0],  # Valorant
        "hours": 2,
        "price_per_hour": 50.00,
        "total_price": 100.00,
        "status": "completed",
        "buyer_confirmed": True,
        "seller_confirmed": True,
        "buyer_rating": 5.0,
        "seller_rating": 4.9,
        "payment_id": "payment_" + str(ObjectId()),
        "chat_room_id": None,  # Will be filled later
        "created_at": datetime.utcnow() - timedelta(days=3),
        "updated_at": datetime.utcnow() - timedelta(days=2),
        "completed_at": datetime.utcnow() - timedelta(days=2)
    },
    {
        "buyer_id": user_ids["noob_player"],
        "seller_id": user_ids["global_elite"],
        "ad_id": ad_ids[1],
        "game_id": game_ids[1],  # CS2
        "hours": 1,
        "price_per_hour": 65.00,
        "total_price": 65.00,
        "status": "in_progress",
        "buyer_confirmed": False,
        "seller_confirmed": False,
        "buyer_rating": None,
        "seller_rating": None,
        "payment_id": "payment_" + str(ObjectId()),
        "chat_room_id": None,  # Will be filled later
        "created_at": datetime.utcnow() - timedelta(hours=5),
        "updated_at": datetime.utcnow() - timedelta(hours=4),
        "completed_at": None
    },
    {
        "buyer_id": user_ids["minecraft_builder"],
        "seller_id": user_ids["lol_diamond"],
        "ad_id": ad_ids[2],
        "game_id": game_ids[2],  # LoL
        "hours": 3,
        "price_per_hour": 40.00,
        "total_price": 120.00,
        "status": "completed",
        "buyer_confirmed": True,
        "seller_confirmed": True,
        "buyer_rating": 4.8,
        "seller_rating": 4.7,
        "payment_id": "payment_" + str(ObjectId()),
        "chat_room_id": None,  # Will be filled later
        "created_at": datetime.utcnow() - timedelta(days=7),
        "updated_at": datetime.utcnow() - timedelta(days=6),
        "completed_at": datetime.utcnow() - timedelta(days=6)
    }
]

# Insert orders
order_ids = []
for order in orders_data:
    result = db.orders.insert_one(order)
    order_ids.append(result.inserted_id)
    print(f"Created order between {order['buyer_id']} and {order['seller_id']} with ID: {result.inserted_id}")

# Create indexes for orders collection
db.orders.create_index("buyer_id")
db.orders.create_index("seller_id")
db.orders.create_index("ad_id")
db.orders.create_index("status")
db.orders.create_index([("created_at", DESCENDING)])

# ---- 5. CHAT ROOMS COLLECTION ----
print("Setting up chat rooms collection...")

# Clear existing chat rooms
db.chat_rooms.delete_many({})

# Create chat rooms for orders
chat_rooms_data = []
for i, order_id in enumerate(order_ids):
    order = orders_data[i]
    chat_rooms_data.append({
        "order_id": order_id,
        "buyer_id": order["buyer_id"],
        "seller_id": order["seller_id"],
        "admin_id": None,
        "has_support_request": False,
        "status": "active" if order["status"] == "in_progress" else "closed",
        "created_at": order["created_at"],
        "updated_at": order["updated_at"]
    })

# Insert chat rooms
chat_room_ids = []
for chat_room in chat_rooms_data:
    result = db.chat_rooms.insert_one(chat_room)
    chat_room_ids.append(result.inserted_id)
    print(f"Created chat room for order {chat_room['order_id']} with ID: {result.inserted_id}")

# Update orders with chat room IDs
for i, order_id in enumerate(order_ids):
    db.orders.update_one(
        {"_id": order_id},
        {"$set": {"chat_room_id": chat_room_ids[i]}}
    )

# Create indexes for chat rooms collection
db.chat_rooms.create_index("order_id", unique=True)
db.chat_rooms.create_index("buyer_id")
db.chat_rooms.create_index("seller_id")
db.chat_rooms.create_index("status")

# ---- 6. CHAT MESSAGES COLLECTION ----
print("Setting up chat messages collection...")

# Clear existing chat messages
db.chat_messages.delete_many({})

# Create some sample chat messages
messages_data = []

# For first chat (completed)
first_chat_messages = [
    {
        "room_id": chat_room_ids[0],
        "user_id": orders_data[0]["buyer_id"],
        "user_role": "buyer",
        "content": "Olá! Estou interessado em melhorar minhas habilidades no Valorant. Podemos começar hoje?",
        "is_system": False,
        "created_at": orders_data[0]["created_at"] + timedelta(minutes=10),
        "read_by": [orders_data[0]["buyer_id"], orders_data[0]["seller_id"]]
    },
    {
        "room_id": chat_room_ids[0],
        "user_id": orders_data[0]["seller_id"],
        "user_role": "seller",
        "content": "Oi! Claro, podemos começar hoje. Qual seu rank atual e quais agentes você costuma jogar?",
        "is_system": False,
        "created_at": orders_data[0]["created_at"] + timedelta(minutes=15),
        "read_by": [orders_data[0]["buyer_id"], orders_data[0]["seller_id"]]
    },
    {
        "room_id": chat_room_ids[0],
        "user_id": orders_data[0]["buyer_id"],
        "user_role": "buyer",
        "content": "Sou Bronze 3 e geralmente jogo com Reyna e Phoenix, mas quero aprender Jett.",
        "is_system": False,
        "created_at": orders_data[0]["created_at"] + timedelta(minutes=17),
        "read_by": [orders_data[0]["buyer_id"], orders_data[0]["seller_id"]]
    },
    {
        "room_id": chat_room_ids[0],
        "user_id": orders_data[0]["seller_id"],
        "user_role": "seller",
        "content": "Ótimo! Vamos focar em posicionamento e mecânica básica primeiro. Me adicione no jogo: RadiantCoach#1234",
        "is_system": False,
        "created_at": orders_data[0]["created_at"] + timedelta(minutes=20),
        "read_by": [orders_data[0]["buyer_id"], orders_data[0]["seller_id"]]
    },
    {
        "room_id": chat_room_ids[0],
        "user_id": None,
        "user_role": None,
        "content": "O serviço foi marcado como concluído pelo vendedor.",
        "is_system": True,
        "created_at": orders_data[0]["completed_at"] - timedelta(minutes=10),
        "read_by": [orders_data[0]["buyer_id"], orders_data[0]["seller_id"]]
    },
    {
        "room_id": chat_room_ids[0],
        "user_id": None,
        "user_role": None,
        "content": "O serviço foi marcado como concluído pelo comprador.",
        "is_system": True,
        "created_at": orders_data[0]["completed_at"],
        "read_by": [orders_data[0]["buyer_id"], orders_data[0]["seller_id"]]
    },
    {
        "room_id": chat_room_ids[0],
        "user_id": orders_data[0]["buyer_id"],
        "user_role": "buyer",
        "content": "Muito obrigado pela aula! Aprendi bastante e já estou aplicando o que você me ensinou.",
        "is_system": False,
        "created_at": orders_data[0]["completed_at"] + timedelta(minutes=5),
        "read_by": [orders_data[0]["buyer_id"], orders_data[0]["seller_id"]]
    }
]
messages_data.extend(first_chat_messages)

# For second chat (in progress)
second_chat_messages = [
    {
        "room_id": chat_room_ids[1],
        "user_id": orders_data[1]["buyer_id"],
        "user_role": "buyer",
        "content": "Oi! Comprei sua aula de CS2. Quando podemos começar?",
        "is_system": False,
        "created_at": orders_data[1]["created_at"] + timedelta(minutes=5),
        "read_by": [orders_data[1]["buyer_id"], orders_data[1]["seller_id"]]
    },
    {
        "room_id": chat_room_ids[1],
        "user_id": orders_data[1]["seller_id"],
        "user_role": "seller",
        "content": "Olá! Podemos começar hoje às 20h. Você tem Discord?",
        "is_system": False,
        "created_at": orders_data[1]["created_at"] + timedelta(minutes=30),
        "read_by": [orders_data[1]["buyer_id"], orders_data[1]["seller_id"]]
    },
    {
        "room_id": chat_room_ids[1],
        "user_id": orders_data[1]["buyer_id"],
        "user_role": "buyer",
        "content": "Sim, meu Discord é NoobPlayer#5678.",
        "is_system": False,
        "created_at": orders_data[1]["created_at"] + timedelta(minutes=35),
        "read_by": [orders_data[1]["buyer_id"], orders_data[1]["seller_id"]]
    },
    {
        "room_id": chat_room_ids[1],
        "user_id": orders_data[1]["buyer_id"],
        "user_role": "buyer",
        "content": "Aliás, já posso te adiantar que tenho dificuldade principalmente com spray control.",
        "is_system": False,
        "created_at": datetime.utcnow() - timedelta(minutes=45),
        "read_by": [orders_data[1]["buyer_id"]]
    }
]
messages_data.extend(second_chat_messages)

# For third chat (completed)
third_chat_messages = [
    {
        "room_id": chat_room_ids[2],
        "user_id": orders_data[2]["buyer_id"],
        "user_role": "buyer",
        "content": "Oi! Comprei suas aulas de LoL. Podemos combinar os horários?",
        "is_system": False,
        "created_at": orders_data[2]["created_at"] + timedelta(minutes=10),
        "read_by": [orders_data[2]["buyer_id"], orders_data[2]["seller_id"]]
    },
    {
        "room_id": chat_room_ids[2],
        "user_id": orders_data[2]["seller_id"],
        "user_role": "seller",
        "content": "Claro! Tenho disponibilidade nas terças e quintas, das 19h às 22h.",
        "is_system": False,
        "created_at": orders_data[2]["created_at"] + timedelta(minutes=20),
        "read_by": [orders_data[2]["buyer_id"], orders_data[2]["seller_id"]]
    },
    {
        "room_id": chat_room_ids[2],
        "user_id": None,
        "user_role": None,
        "content": "O serviço foi marcado como concluído pelo vendedor e pelo comprador.",
        "is_system": True,
        "created_at": orders_data[2]["completed_at"],
        "read_by": [orders_data[2]["buyer_id"], orders_data[2]["seller_id"]]
    }
]
messages_data.extend(third_chat_messages)

# Insert chat messages
for message in messages_data:
    result = db.chat_messages.insert_one(message)
    print(f"Created chat message in room {message['room_id']} with ID: {result.inserted_id}")

# Create indexes for chat messages collection
db.chat_messages.create_index("room_id")
db.chat_messages.create_index([("created_at", ASCENDING)])
db.chat_messages.create_index("user_id")

# ---- 7. SUPPORT TICKETS COLLECTION ----
print("Setting up support tickets collection...")

# Clear existing tickets
db.support_tickets.delete_many({})

# Create a support ticket
ticket_data = {
    "order_id": order_ids[1],
    "chat_room_id": chat_room_ids[1],
    "user_id": orders_data[1]["buyer_id"],  # Reported by buyer
    "subject": "Vendedor não respondeu",
    "description": "O vendedor não respondeu às minhas últimas mensagens.",
    "status": "open",  # open, in_progress, resolved, closed
    "assigned_admin_id": user_ids["support"],
    "created_at": datetime.utcnow() - timedelta(minutes=30),
    "updated_at": datetime.utcnow() - timedelta(minutes=30),
    "resolved_at": None
}

result = db.support_tickets.insert_one(ticket_data)
print(f"Created support ticket with ID: {result.inserted_id}")

# Create indexes for support tickets collection
db.support_tickets.create_index("order_id")
db.support_tickets.create_index("chat_room_id")
db.support_tickets.create_index("user_id")
db.support_tickets.create_index("assigned_admin_id")
db.support_tickets.create_index("status")
db.support_tickets.create_index([("created_at", DESCENDING)])

print("\nDatabase initialization completed successfully!")
print("\nSummary of created data:")
print(f"- {len(games_data)} games")
print(f"- {len(users_data)} users (including admin and support)")
print(f"- {len(ads_data)} ads ({len([ad for ad in ads_data if ad['ad_type'] == 'free'])} free, {len([ad for ad in ads_data if ad['is_boosted']])} boosted)")
print(f"- {len(orders_data)} orders")
print(f"- {len(chat_rooms_data)} chat rooms")
print(f"- {len(messages_data)} chat messages")
print(f"- 1 support ticket")

# Print some sample data for testing
print("\nSample login credentials:")
print("Admin: admin@gameunite.com / Admin@123")
print("Support: support@gameunite.com / Support@123")
print("User (Seller): coach@example.com / Coach@123")
print("User (Buyer): newbie@example.com / Newbie@123")
