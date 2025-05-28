#!/usr/bin/env python3
"""
🧪 Script Simples para Testar Conexão MongoDB e Backup
Execute: python simple_backup_test.py
"""

import json
import os
from datetime import datetime
from pymongo import MongoClient
import certifi

# Configuração
MONGO_URI = "mongodb+srv://gameunite:qObf8Mz2ToZQSAKV@gameunite.yy6zqks.mongodb.net/?retryWrites=true&w=majority&appName=gameUnite"
PROD_DB = "gameunite"
TEST_DB = "gameunite_test"


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


def list_databases(client):
    """Lista bancos de dados disponíveis."""
    print("\n📊 Bancos de dados disponíveis:")

    try:
        db_list = client.list_database_names()
        for db_name in db_list:
            print(f"  🗄️  {db_name}")

        return db_list
    except Exception as e:
        print(f"❌ Erro ao listar bancos: {e}")
        return []


def show_collections(client, db_name):
    """Mostra coleções e documentos de um banco."""
    print(f"\n📋 Coleções no banco '{db_name}':")

    try:
        db = client[db_name]
        collections = db.list_collection_names()

        if not collections:
            print("  📭 Nenhuma coleção encontrada")
            return False

        total_docs = 0
        for collection_name in collections:
            collection = db[collection_name]
            count = collection.count_documents({})
            total_docs += count
            print(f"  📁 {collection_name}: {count} documentos")

        print(f"  📊 Total: {total_docs} documentos")
        return True

    except Exception as e:
        print(f"❌ Erro ao listar coleções: {e}")
        return False


def simple_backup(client, source_db_name, target_db_name):
    """Faz backup simples copiando dados entre bancos."""
    print(f"\n🔄 Fazendo backup: {source_db_name} → {target_db_name}")

    try:
        source_db = client[source_db_name]
        target_db = client[target_db_name]

        # Obter coleções do banco de origem
        collections = source_db.list_collection_names()

        if not collections:
            print("❌ Nenhuma coleção encontrada no banco de origem!")
            return False

        print(f"📦 Encontradas {len(collections)} coleções para backup...")

        total_copied = 0
        for collection_name in collections:
            print(f"  🔄 Copiando {collection_name}...")

            source_collection = source_db[collection_name]
            target_collection = target_db[collection_name]

            # Pegar todos os documentos da coleção
            documents = list(source_collection.find())

            if documents:
                # Limpar coleção de destino
                target_collection.delete_many({})

                # Inserir documentos
                target_collection.insert_many(documents)

                copied_count = len(documents)
                total_copied += copied_count
                print(f"    ✅ {copied_count} documentos copiados")
            else:
                print(f"    📭 Coleção vazia")

        print(f"\n✅ Backup concluído! {total_copied} documentos copiados")
        return True

    except Exception as e:
        print(f"❌ Erro no backup: {e}")
        return False


def export_to_json(client, db_name, output_dir="./backup_json"):
    """Exporta banco para arquivos JSON."""
    print(f"\n💾 Exportando {db_name} para JSON...")

    try:
        # Criar diretório
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = os.path.join(output_dir, f"backup_{db_name}_{timestamp}")
        os.makedirs(backup_dir, exist_ok=True)

        db = client[db_name]
        collections = db.list_collection_names()

        if not collections:
            print("❌ Nenhuma coleção para exportar!")
            return False

        total_exported = 0
        for collection_name in collections:
            print(f"  💾 Exportando {collection_name}...")

            collection = db[collection_name]
            documents = list(collection.find())

            if documents:
                # Converter para JSON serializável
                json_docs = []
                for doc in documents:
                    # Converter ObjectId para string
                    if '_id' in doc:
                        doc['_id'] = str(doc['_id'])

                    # Converter outros ObjectIds
                    for key, value in doc.items():
                        if hasattr(value, '__class__') and 'ObjectId' in str(value.__class__):
                            doc[key] = str(value)

                    json_docs.append(doc)

                # Salvar arquivo JSON
                output_file = os.path.join(backup_dir, f"{collection_name}.json")
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(json_docs, f, ensure_ascii=False, indent=2, default=str)

                total_exported += len(documents)
                print(f"    ✅ {len(documents)} documentos exportados")

        print(f"\n✅ Exportação concluída!")
        print(f"📁 Localização: {backup_dir}")
        print(f"📊 Total: {total_exported} documentos")

        return backup_dir

    except Exception as e:
        print(f"❌ Erro na exportação: {e}")
        return False


def main():
    """Função principal."""
    print("=" * 50)
    print("🧪 Teste Simples de Backup MongoDB")
    print("=" * 50)

    # Testar conexão
    client = test_connection()
    if client is None:
        print("🛑 Não foi possível conectar ao MongoDB!")
        return

    try:
        # Listar bancos
        db_list = list_databases(client)

        # Verificar se bancos existem
        has_prod = PROD_DB in db_list
        has_test = TEST_DB in db_list

        print(f"\n🎯 Status dos bancos:")
        print(f"  📊 {PROD_DB}: {'✅ Existe' if has_prod else '❌ Não existe'}")
        print(f"  🧪 {TEST_DB}: {'✅ Existe' if has_test else '❌ Não existe'}")

        # Mostrar coleções do banco de produção
        if has_prod:
            has_data = show_collections(client, PROD_DB)

            if has_data:
                print("\n🤔 O que você quer fazer?")
                print("1. 🔄 Copiar dados para banco de teste")
                print("2. 💾 Exportar para JSON")
                print("3. 📊 Apenas mostrar estatísticas")
                print("4. 🚪 Sair")

                choice = input("\nDigite sua escolha (1-4): ").strip()

                if choice == "1":
                    print(f"\n⚠️  Isso irá sobrescrever dados em '{TEST_DB}'!")
                    confirm = input("Continuar? (s/N): ").strip().lower()

                    if confirm in ['s', 'sim', 'y', 'yes']:
                        simple_backup(client, PROD_DB, TEST_DB)
                        print("\n📊 Verificando banco de teste após backup:")
                        show_collections(client, TEST_DB)
                    else:
                        print("❌ Operação cancelada")

                elif choice == "2":
                    backup_dir = export_to_json(client, PROD_DB)
                    if backup_dir:
                        print(f"\n💡 Para restaurar depois, use os arquivos JSON em: {backup_dir}")

                elif choice == "3":
                    print("📊 Estatísticas mostradas acima!")

                elif choice == "4":
                    print("👋 Saindo...")

                else:
                    print("❌ Opção inválida!")
            else:
                print(f"\n⚠️  Banco '{PROD_DB}' existe mas não tem dados!")
        else:
            print(f"\n❌ Banco '{PROD_DB}' não encontrado!")
            print("💡 Certifique-se de que:")
            print("   • O nome do banco está correto")
            print("   • Você tem dados no banco")
            print("   • As credenciais estão corretas")

    except Exception as e:
        print(f"❌ Erro geral: {e}")

    finally:
        client.close()
        print("\n👋 Conexão fechada!")


if __name__ == "__main__":
    main()