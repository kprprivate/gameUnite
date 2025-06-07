ad_questions_indexes = [
    {"key": "ad_id", "unique": False},
    {"key": "user_id", "unique": False},
    {"key": "created_at", "unique": False},
    {"key": "status", "unique": False}
]

# Exemplo de documento de pergunta
ad_question_schema_example = {
    "ad_id": "60d5ec9af682fbd12a0b7777",
    "user_id": "60d5ec9af682fbd12a0b9999",  # Quem fez a pergunta
    "question": "O jogo vem com todos os DLCs?",
    "answer": "Sim, vem com todos os DLCs disponíveis.",  # Resposta do vendedor
    "answered_by": "60d5ec9af682fbd12a0b8888",  # ID do vendedor
    "answered_at": "2025-05-01T12:30:00Z",
    "status": "answered",  # "pending", "answered", "hidden"
    "is_public": True,  # Se a pergunta é pública ou privada
    "created_at": "2025-05-01T12:00:00Z",
    "updated_at": "2025-05-01T12:30:00Z"
}