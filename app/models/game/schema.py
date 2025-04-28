# Define os índices para a coleção de jogos
game_indexes = [
    {"key": "name", "unique": True},
    {"key": "slug", "unique": True}
]

# Exemplo de documento de jogo
game_schema_example = {
    "name": "Valorant",
    "slug": "valorant",
    "description": "Um FPS tático 5v5 baseado em personagens",
    "image_url": "https://example.com/valorant.jpg",
    "cover_url": "https://example.com/valorant-cover.jpg",
    "is_featured": True,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
}
