from datetime import datetime, timedelta

# Índices para a coleção de carrinho
cart_indexes = [
    {"key": "user_id", "unique": False},
    {"key": "created_at", "unique": False},
    {"key": [("user_id", 1), ("ad_id", 1)], "unique": True}  # Previne duplicatas
]

# Exemplo de documento de carrinho
cart_schema_example = {
    "user_id": "60d5ec9af682fbd12a0b9999",
    "ad_id": "60d5ec9af682fbd12a0b7777",
    "quantity": 1,
    "price_snapshot": 50.00,  # Preço no momento que foi adicionado
    "ad_snapshot": {
        "title": "FIFA 24 - PlayStation 5",
        "game_name": "FIFA 24",
        "platform": "PlayStation 5",
        "condition": "novo",
        "image_url": "...",
        "seller_username": "seller123"
    },
    "created_at": "2025-05-01T12:00:00Z",
    "updated_at": "2025-05-01T12:00:00Z",
    "expires_at": "2025-05-08T12:00:00Z"  # Expira em 7 dias
}