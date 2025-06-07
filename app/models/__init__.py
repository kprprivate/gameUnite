def setup_indexes():
    """Configura índices para todas as coleções do MongoDB."""
    from app.db.mongo_client import db

    # Usuários
    from app.models.user.schema import user_indexes
    for index_config in user_indexes:
        db.users.create_index(
            index_config["key"],
            unique=index_config.get("unique", False),
            background=True
        )

    # Jogos
    from app.models.game.schema import game_indexes
    for index_config in game_indexes:
        db.games.create_index(
            index_config["key"],
            unique=index_config.get("unique", False),
            background=True
        )

    # Anúncios
    from app.models.ad.schema import ad_indexes
    for index_config in ad_indexes:
        db.ads.create_index(
            index_config["key"],
            unique=index_config.get("unique", False),
            background=True
        )

    # Pedidos
    from app.models.order.schema import order_indexes
    for index_config in order_indexes:
        db.orders.create_index(
            index_config["key"],
            unique=index_config.get("unique", False),
            background=True
        )

    # Chat
    from app.models.chat.schema import chat_room_indexes, chat_message_indexes
    for index_config in chat_room_indexes:
        db.chat_rooms.create_index(
            index_config["key"],
            unique=index_config.get("unique", False),
            background=True
        )
    for index_config in chat_message_indexes:
        db.chat_messages.create_index(
            index_config["key"],
            unique=index_config.get("unique", False),
            background=True
        )

    # Favoritos
    from app.models.favorites.schema import favorites_indexes
    for index_config in favorites_indexes:
        db.favorites.create_index(
            index_config["key"],
            unique=index_config.get("unique", False),
            background=True
        )

    # Carrinho
    from app.models.cart.schema import cart_indexes
    for index_config in cart_indexes:
        db.cart.create_index(
            index_config["key"],
            unique=index_config.get("unique", False),
            background=True
        )

    # Perguntas dos Anúncios
    from app.models.ad_questions.schema import ad_questions_indexes
    for index_config in ad_questions_indexes:
        db.ad_questions.create_index(
            index_config["key"],
            unique=index_config.get("unique", False),
            background=True
        )