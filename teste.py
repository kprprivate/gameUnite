#!/usr/bin/env python3
"""
🧪 Script para Testar Problemas do Admin
Execute: python teste.py
"""

import json
import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
import certifi

# Configuração (mesma do backup_db.py)
MONGO_URI = "mongodb+srv://gameunite:qObf8Mz2ToZQSAKV@gameunite.yy6zqks.mongodb.net/?retryWrites=true&w=majority&appName=gameUnite"
PROD_DB = "gameunite"

def test_connection():
    """Testa conexão com MongoDB."""
    print("🔌 Testando conexão com MongoDB...")

    try:
        client = MongoClient(
            MONGO_URI,
            ssl=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000
        )

        # Testar ping
        client.admin.command('ping')
        print("✅ Conexão com MongoDB OK!")

        return client
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return None

def main():
    """Função principal para testar problemas do admin."""
    print("=" * 50)
    print("🔧 Teste de Problemas do Admin")
    print("=" * 50)

    # Testar conexão
    client = test_connection()
    if client is None:
        print("🛑 Não foi possível conectar ao MongoDB!")
        return

    try:
        # Conectar ao banco
        db = client[PROD_DB]
        
        print("\n=== TESTE 1: TICKETS NO BANCO ===")
        try:
            tickets = list(db.support_tickets.find().limit(5))
            print(f"Total de tickets encontrados: {len(tickets)}")
            
            for i, ticket in enumerate(tickets, 1):
                print(f"  Ticket {i}:")
                print(f"    _id: {ticket['_id']}")
                print(f"    user_id: {ticket['user_id']} (tipo: {type(ticket['user_id'])})")
                print(f"    subject: {ticket.get('subject', 'SEM SUBJECT')}")
                print(f"    status: {ticket.get('status', 'SEM STATUS')}")
                print(f"    protocol: {ticket.get('protocol_number', 'SEM PROTOCOL')}")
                print()
        except Exception as e:
            print(f"❌ Erro ao buscar tickets: {e}")

        print("\n=== TESTE 2: USUÁRIOS COM IMAGENS ===")
        try:
            users = list(db.users.find({"profile_pic": {"$exists": True, "$ne": ""}}).limit(5))
            print(f"Usuários com profile_pic: {len(users)}")
            
            for i, user in enumerate(users, 1):
                print(f"  Usuário {i}:")
                print(f"    _id: {user['_id']}")
                print(f"    username: {user.get('username', 'SEM USERNAME')}")
                print(f"    profile_pic: {user.get('profile_pic', 'SEM FOTO')}")
                print(f"    role: {user.get('role', 'SEM ROLE')}")
                print()
        except Exception as e:
            print(f"❌ Erro ao buscar usuários: {e}")

        print("\n=== TESTE 3: PEDIDOS COM PREÇOS ===")
        try:
            orders = list(db.orders.find().limit(5))
            print(f"Pedidos encontrados: {len(orders)}")
            
            for i, order in enumerate(orders, 1):
                print(f"  Pedido {i}:")
                print(f"    _id: {order['_id']}")
                print(f"    total_price: {order.get('total_price', 'SEM PREÇO')} (tipo: {type(order.get('total_price'))})")
                print(f"    status: {order.get('status', 'SEM STATUS')}")
                print(f"    buyer_id: {order.get('buyer_id', 'SEM BUYER')}")
                print(f"    seller_id: {order.get('seller_id', 'SEM SELLER')}")
                print()
        except Exception as e:
            print(f"❌ Erro ao buscar pedidos: {e}")

        print("\n=== TESTE 4: ADS PARA DELETAR ===")
        try:
            ads = list(db.ads.find().limit(3))
            print(f"Anúncios encontrados: {len(ads)}")
            
            for i, ad in enumerate(ads, 1):
                print(f"  Anúncio {i}:")
                print(f"    _id: {ad['_id']}")
                print(f"    title: {ad.get('title', 'SEM TÍTULO')}")
                print(f"    seller_id: {ad.get('seller_id', 'SEM SELLER')}")
                print(f"    status: {ad.get('status', 'SEM STATUS')}")
                print(f"    is_active: {ad.get('is_active', 'SEM is_active')}")
                print()
        except Exception as e:
            print(f"❌ Erro ao buscar anúncios: {e}")

        print("\n=== TESTE 5: SIMULAÇÃO QUERY ADMIN TICKETS ===")
        try:
            # Simular a query que o admin faz
            pipeline = [
                {"$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "user"
                }},
                {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
                {"$sort": {"created_at": -1}},
                {"$limit": 5}
            ]
            
            admin_tickets = list(db.support_tickets.aggregate(pipeline))
            print(f"Tickets com lookup de usuário: {len(admin_tickets)}")
            
            for i, ticket in enumerate(admin_tickets, 1):
                print(f"  Ticket Admin {i}:")
                print(f"    _id: {ticket['_id']}")
                print(f"    subject: {ticket.get('subject', 'SEM SUBJECT')}")
                print(f"    user: {ticket.get('user', {}).get('username', 'SEM USER')}")
                print(f"    user_id_original: {ticket.get('user_id', 'SEM USER_ID')}")
                print()
        except Exception as e:
            print(f"❌ Erro na query admin tickets: {e}")

    except Exception as e:
        print(f"❌ Erro geral: {e}")

    finally:
        client.close()
        print("\n👋 Conexão fechada!")

if __name__ == "__main__":
    main()