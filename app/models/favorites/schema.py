favorites_indexes = [
    {"key": "user_id", "unique": False},
    {"key": "ad_id", "unique": False},
    {"key": [("user_id", 1), ("ad_id", 1)], "unique": True}  # Índice composto único
]

# Exemplo de documento de favorito
favorites_schema_example = {
    "user_id": "60d5ec9af682fbd12a0b9999",  # ID do usuário
    "ad_id": "60d5ec9af682fbd12a0b7777",    # ID do anúncio
    "created_at": "2023-05-01T12:00:00Z"    # Data que foi favoritado
}