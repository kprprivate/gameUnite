import os 
from datetime import timedelta 
 
class TestingConfig: 
    DEBUG = False
    TESTING = True 
    SECRET_KEY = "test-secret-key" 
    MONGODB_URI = "mongodb+srv://gameunite:qObf8Mz2ToZQSAKV@gameunite.yy6zqks.mongodb.net/?retryWrites=true&w=majority&appName=gameUnite"
    MONGODB_DB_NAME = "gameunite_test"
    JWT_SECRET_KEY = "jwt-test-secret"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1) 
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30) 
