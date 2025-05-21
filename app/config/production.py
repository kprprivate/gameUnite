import os 
from datetime import timedelta 
 
class ProductionConfig: 
    DEBUG = False 
    SECRET_KEY = os.getenv("SECRET_KEY") 
    MONGODB_URI = os.getenv("MONGODB_URI") 
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") 
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1) 
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30) 
