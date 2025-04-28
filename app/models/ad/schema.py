# Define os índices para a coleção de anúncios
ad_indexes = [
    {"key": "game_id", "unique": False},
    {"key": "user_id", "unique": False},
    {"key": "ad_type", "unique": False},
    {"key": "is_boosted", "unique": False},
    {"key": "status", "unique": False}
]

# Exemplo de documento de anúncio
ad_schema_example = {
    "user_id": "60d5ec9af682fbd12a0b9999",  # ID do usuário criador
    "game_id": "60d5ec9af682fbd12a0b1111",  # ID do jogo relacionado
    "title": "Coach profissional de Valorant",
    "description": "Sou jogador Radiante e posso te ajudar a melhorar",
    "ad_type": "paid",  # "free", "paid", "boosted"
    "price_per_hour": 50.00,  # Preço por hora (anúncios pagos)
    "image_url": "https://example.com/ad-image.jpg",
    "is_boosted": True,  # Se tem destaque
    "boost_expires_at": "2023-06-01T12:00:00Z", # Expiração do boost
    "status": "active",  # "active", "paused", "deleted"
    "view_count": 150,  # Contador de visualizações
    "created_at": "2023-05-01T12:00:00Z",
    "updated_at": "2023-05-01T12:00:00Z"
}
