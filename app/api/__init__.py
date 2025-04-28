def register_blueprints(app):
    # Health check blueprint
    from app.api.health import health_bp
    app.register_blueprint(health_bp, url_prefix='/api/health')

    # Auth routes 
    from app.api.auth.routes import auth_bp 
    app.register_blueprint(auth_bp, url_prefix='/api/auth') 
 
    # Game routes 
    from app.api.games.routes import games_bp 
    app.register_blueprint(games_bp, url_prefix='/api/games') 
 
    # Ad routes 
    from app.api.ads.routes import ads_bp 
    app.register_blueprint(ads_bp, url_prefix='/api/ads') 
 
    # Order routes 
    from app.api.orders.routes import orders_bp 
    app.register_blueprint(orders_bp, url_prefix='/api/orders') 
 
    # Chat routes 
    from app.api.chat.routes import chat_bp 
    app.register_blueprint(chat_bp, url_prefix='/api/chat') 
 
    # User routes 
    from app.api.users.routes import users_bp 
    app.register_blueprint(users_bp, url_prefix='/api/users') 
 
    # Admin routes 
    from app.api.admin.routes import admin_bp 
    app.register_blueprint(admin_bp, url_prefix='/api/admin') 
 
    # Search routes 
    from app.api.search.routes import search_bp 
    app.register_blueprint(search_bp, url_prefix='/api/search') 
