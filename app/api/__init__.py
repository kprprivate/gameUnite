def register_blueprints(app):
    from app.api.cors.options_handler import options_bp
    app.register_blueprint(options_bp)

    # Health check blueprint
    from app.api.health import health_bp
    app.register_blueprint(health_bp, url_prefix='/api/health')

    # Auth routes
    from app.api.auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    # Upload routes
    from app.api.upload.routes import upload_bp
    app.register_blueprint(upload_bp, url_prefix='/api/upload')

    # Game routes
    from app.api.games.routes import games_bp
    app.register_blueprint(games_bp, url_prefix='/api/games')

    # Ad routes
    from app.api.ads.routes import ads_bp
    app.register_blueprint(ads_bp, url_prefix='/api/ads')

    # Order routes
    from app.api.orders.routes import orders_bp
    app.register_blueprint(orders_bp, url_prefix='/api/orders')

    # Cart routes
    from app.api.cart.routes import cart_bp
    app.register_blueprint(cart_bp, url_prefix='/api/cart')

    # Chat routes
    from app.api.chat.routes import chat_bp
    app.register_blueprint(chat_bp, url_prefix='/api/chat')

    # Ad Questions routes
    from app.api.ad_questions.routes import ad_questions_bp
    app.register_blueprint(ad_questions_bp, url_prefix='/api/ad-questions')

    # User routes
    from app.api.users.routes import users_bp
    app.register_blueprint(users_bp, url_prefix='/api/users')

    # Admin routes
    from app.api.admin.routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Search routes
    from app.api.search.routes import search_bp
    app.register_blueprint(search_bp, url_prefix='/api/search')

    # Favorites routes
    from app.api.favorites.routes import favorites_bp
    app.register_blueprint(favorites_bp, url_prefix='/api/favorites')