# Define os índices para a coleção de salas de chat
chat_room_indexes = [
    {"key": "order_id", "unique": True},
    {"key": "buyer_id", "unique": False},
    {"key": "seller_id", "unique": False}
]

# Define os índices para a coleção de mensagens de chat
chat_message_indexes = [
    {"key": "room_id", "unique": False},
    {"key": "created_at", "unique": False}
]

# Exemplo de documento de sala de chat
chat_room_schema_example = {
    "order_id": "60d5ec9af682fbd12a0b5555",   # ID do pedido relacionado
    "buyer_id": "60d5ec9af682fbd12a0b9999",   # ID do comprador
    "seller_id": "60d5ec9af682fbd12a0b8888",  # ID do vendedor
    "admin_id": None,                         # ID do admin (se intervenção)
    "has_support_request": False,             # Se há pedido de suporte
    "status": "active",                       # "active", "closed"
    "created_at": "2023-05-01T12:00:00Z",
    "updated_at": "2023-05-01T12:00:00Z"
}

# Exemplo de documento de mensagem de chat
chat_message_schema_example = {
    "room_id": "60d5ec9af682fbd12a0b4444",   # ID da sala de chat
    "user_id": "60d5ec9af682fbd12a0b9999",   # ID do usuário que enviou
    "user_role": "buyer",                    # "buyer", "seller", "admin"
    "content": "Olá, quando podemos começar?", # Conteúdo da mensagem
    "is_system": False,                       # Se é mensagem do sistema
    "created_at": "2023-05-01T12:10:00Z",
    "read_by": ["60d5ec9af682fbd12a0b9999"]  # IDs dos usuários que leram
}
