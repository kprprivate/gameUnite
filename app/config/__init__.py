from app.config.development import DevelopmentConfig 
from app.config.production import ProductionConfig 
from app.config.testing import TestingConfig 
 
def get_config(config_name): 
    configs = { 
        "development": DevelopmentConfig, 
        "production": ProductionConfig, 
        "testing": TestingConfig 
    } 
    return configs.get(config_name, DevelopmentConfig) 
