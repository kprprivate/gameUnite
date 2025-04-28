# Define os índices para a coleção de usuários
user_indexes = [
    {"key": "email", "unique": True},
    {"key": "username", "unique": True}
]

# Exemplo de documento de usuário
user_schema_example = {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "hashed_password_here",  # sempre hash, nunca texto plano
    "first_name": "John",
    "last_name": "Doe",
    "profile_pic": "https://example.com/profile.jpg",
    "bio": "Jogador profissional de Valorant",
    "role": "user",  # 'user', 'admin', 'support'
    "seller_rating": 4.5,  # 0-5 stars
    "buyer_rating": 5.0,   # 0-5 stars
    "seller_ratings_count": 10,
    "buyer_ratings_count": 5,
    "created_at": "2023-05-01T12:00:00Z",
    "updated_at": "2023-05-01T12:00:00Z",
    "last_login": "2023-05-01T12:00:00Z",
    "is_active": True,
    "is_verified": True,
    "verification_token": None,
    "reset_password_token": None,
    "reset_password_expires": None
}
