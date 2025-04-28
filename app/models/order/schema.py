# Define os índices para a coleção de pedidos
order_indexes = [
    {"key": "buyer_id", "unique": False},
    {"key": "seller_id", "unique": False},
    {"key": "ad_id", "unique": False},
    {"key": "status", "unique": False}
]

# Exemplo de documento de pedido
order_schema_example = {
    "buyer_id": "60d5ec9af682fbd12a0b9999",  # ID do comprador
    "seller_id": "60d5ec9af682fbd12a0b8888", # ID do vendedor
    "ad_id": "60d5ec9af682fbd12a0b7777",     # ID do anúncio
    "game_id": "60d5ec9af682fbd12a0b1111",   # ID do jogo
    "hours": 2,                              # Quantidade de horas
    "price_per_hour": 50.00,                 # Preço por hora
    "total_price": 100.00,                   # Preço total
    "status": "pending",    # "pending", "paid", "in_progress", "completed", "cancelled", "refunded"
    "buyer_confirmed": False,                # Comprador confirmou entrega
    "seller_confirmed": False,               # Vendedor confirmou entrega
    "buyer_rating": None,                    # Avaliação do comprador (0-5)
    "seller_rating": None,                   # Avaliação do vendedor (0-5)
    "payment_id": "payment123",              # ID do pagamento (gateway)
    "chat_room_id": "60d5ec9af682fbd12a0b6666", # ID da sala de chat
    "created_at": "2023-05-01T12:00:00Z",
    "updated_at": "2023-05-01T12:00:00Z",
    "completed_at": None
}
