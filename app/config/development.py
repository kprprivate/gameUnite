import os 
from datetime import timedelta 
 
class DevelopmentConfig: 
    DEBUG = True 
    SECRET_KEY = "development-secret-key" 
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/gamingservice_dev") 
    JWT_SECRET_KEY = "jwt-dev-secret" 
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1) 
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30) 
