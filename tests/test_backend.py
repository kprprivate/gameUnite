import requests
import pymongo
import certifi
import json
import random
import string
from datetime import datetime
from bson import ObjectId
from colorama import init, Fore, Back, Style

# Initialize colorama for cross-platform color support
init()

# Configuration
BASE_URL = "http://127.0.0.1:5000"
MONGODB_URI = "mongodb+srv://gameunite:qObf8Mz2ToZQSAKV@gameunite.yy6zqks.mongodb.net/?retryWrites=true&w=majority&appName=gameUnite"
DB_NAME = "gameunite"


# Test Functions
def print_header(message):
    print(f"\n{Fore.CYAN}{Style.BRIGHT}{'=' * 50}")
    print(f"{message}")
    print(f"{'=' * 50}{Style.RESET_ALL}")


def print_success(message):
    print(f"{Fore.GREEN}✓ {message}{Style.RESET_ALL}")


def print_warning(message):
    print(f"{Fore.YELLOW}⚠ {message}{Style.RESET_ALL}")


def print_error(message):
    print(f"{Fore.RED}✗ {message}{Style.RESET_ALL}")


def print_info(message):
    print(f"{Fore.BLUE}ℹ {message}{Style.RESET_ALL}")


def generate_random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


def test_health_endpoint():
    print_header("Testing Health Endpoint")

    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)

        if response.status_code == 200:
            health_data = response.json()
            print_success(f"Health endpoint responded with status code: {response.status_code}")
            print_info(f"API Status: {health_data.get('status')}")
            print_info(f"Environment: {health_data.get('environment')}")
            print_info(f"Uptime: {health_data.get('uptime')}")

            # Check MongoDB status
            mongo_status = health_data.get('dependencies', {}).get('mongodb', {})
            if mongo_status.get('ok'):
                print_success(f"MongoDB connection: {mongo_status.get('message')}")
            else:
                print_error(f"MongoDB connection issue: {mongo_status.get('message')}")

            # Show system info
            system_info = health_data.get('system_info', {})
            print_info(f"System: {system_info.get('os')} - Python {system_info.get('python_version')}")

            return True
        else:
            print_error(f"Health endpoint returned unexpected status code: {response.status_code}")
            print_info(f"Response: {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Failed to connect to the server. Is Flask running?")
        return False
    except Exception as e:
        print_error(f"Error testing health endpoint: {str(e)}")
        return False


def test_mongodb_connection():
    print_header("Testing Direct MongoDB Connection")

    try:
        client = pymongo.MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
        client.admin.command('ping')
        print_success("MongoDB connection successful!")

        # List databases and collections
        db_names = client.list_database_names()
        print_info(f"Available databases: {', '.join(db_names)}")

        if DB_NAME.lower() in [db.lower() for db in db_names]:
            print_success(f"Database '{DB_NAME}' found")

            db = client[DB_NAME.lower()]
            collections = db.list_collection_names()
            print_info(f"Collections: {', '.join(collections)}")

            # Check for expected collections
            expected_collections = ["users", "games", "ads", "orders", "chat_rooms"]
            missing_collections = [c for c in expected_collections if c not in collections]

            if missing_collections:
                print_warning(f"Missing expected collections: {', '.join(missing_collections)}")
            else:
                print_success("All expected collections are present")

            # Show document counts
            for collection in collections:
                count = db[collection].count_documents({})
                print_info(f"  {collection}: {count} documents")

                # Show sample document (except passwords)
                if count > 0 and collection in ["users", "games", "ads"]:
                    sample = db[collection].find_one({})
                    if collection == "users" and "password" in sample:
                        sample.pop("password")  # Don't show password hashes

                    # Convert ObjectId to string for display
                    sample_display = {}
                    for key, value in sample.items():
                        if isinstance(value, ObjectId):
                            sample_display[key] = str(value)
                        else:
                            sample_display[key] = value

                    # Show truncated sample
                    sample_json = json.dumps(sample_display, default=str, indent=2)
                    if len(sample_json) > 300:
                        sample_json = sample_json[:300] + "..."
                    print_info(f"  Sample {collection} document: {sample_json}")

            return True
        else:
            print_error(f"Database '{DB_NAME}' not found!")
            return False

    except Exception as e:
        print_error(f"MongoDB connection error: {str(e)}")
        return False


def test_mongodb_crud():
    print_header("Testing MongoDB CRUD Operations")

    try:
        client = pymongo.MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
        db = client[DB_NAME.lower()]

        # Test collection for CRUD operations
        test_collection = db.test_crud

        # 1. CREATE
        test_doc = {
            "name": "Test Document",
            "email": f"test_{generate_random_string()}@example.com",
            "created_at": datetime.utcnow(),
            "is_test": True
        }

        result = test_collection.insert_one(test_doc)
        test_id = result.inserted_id
        print_success(f"CREATE: Document created with ID: {test_id}")

        # 2. READ
        found_doc = test_collection.find_one({"_id": test_id})
        if found_doc:
            print_success(f"READ: Document retrieved: {found_doc['name']}")
        else:
            print_error("READ: Document not found")

        # 3. UPDATE
        update_result = test_collection.update_one(
            {"_id": test_id},
            {"$set": {"updated": True, "updated_at": datetime.utcnow()}}
        )

        if update_result.modified_count == 1:
            print_success("UPDATE: Document updated successfully")

            # Verify update
            updated_doc = test_collection.find_one({"_id": test_id})
            if updated_doc and updated_doc.get("updated"):
                print_success(f"UPDATE verified: {updated_doc['updated']}")
        else:
            print_error("UPDATE: Failed to update document")

        # 4. DELETE
        delete_result = test_collection.delete_one({"_id": test_id})
        if delete_result.deleted_count == 1:
            print_success("DELETE: Document deleted successfully")

            # Verify deletion
            if not test_collection.find_one({"_id": test_id}):
                print_success("DELETE verified: Document no longer exists")
        else:
            print_error("DELETE: Failed to delete document")

        # Clean up any remaining test documents
        test_collection.delete_many({"is_test": True})
        return True

    except Exception as e:
        print_error(f"CRUD test error: {str(e)}")
        return False


def test_api_endpoints():
    print_header("Testing API Endpoints")

    # Test 1: Health endpoint (again as part of API tests)
    try:
        print_info("Testing health endpoint...")
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print_success("Health endpoint working!")
        else:
            print_error(f"Health endpoint returned status: {response.status_code}")
    except Exception as e:
        print_error(f"Health endpoint test failed: {str(e)}")

    # Test 2: Games endpoint
    try:
        print_info("Testing games endpoint...")
        response = requests.get(f"{BASE_URL}/api/games", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Games endpoint working! Response: {json.dumps(data, indent=2)[:100]}...")
        else:
            print_warning(f"Games endpoint returned status: {response.status_code}")
            print_info(f"Response: {response.text[:100]}...")
    except Exception as e:
        print_warning(f"Games endpoint test failed: {str(e)}")

    # Test 3: User registration
    test_user = {
        "username": f"testuser_{generate_random_string()}",
        "email": f"test_{generate_random_string()}@example.com",
        "password": "TestPassword123!",
        "first_name": "Test",
        "last_name": "User"
    }

    try:
        print_info(f"Testing user registration with {test_user['username']}...")
        response = requests.post(f"{BASE_URL}/api/auth/register", json=test_user, timeout=5)

        if response.status_code in [200, 201]:
            print_success("Registration endpoint working!")
            reg_data = response.json()
            print_info(f"Registration response: {json.dumps(reg_data, indent=2)[:100]}...")

            # Test login with registered user
            login_data = {
                "email": test_user["email"],
                "password": test_user["password"]
            }

            try:
                print_info("Testing login with new user...")
                login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data, timeout=5)

                if login_response.status_code == 200:
                    login_data = login_response.json()
                    print_success("Login successful!")
                    print_info(f"Login response: {json.dumps(login_data, indent=2)[:100]}...")

                    # Get access token
                    if 'data' in login_data and 'access_token' in login_data['data']:
                        token = login_data['data']['access_token']

                        # Test authenticated endpoint
                        print_info("Testing authenticated endpoint...")
                        auth_headers = {"Authorization": f"Bearer {token}"}
                        profile_response = requests.get(f"{BASE_URL}/api/users/profile", headers=auth_headers,
                                                        timeout=5)

                        if profile_response.status_code == 200:
                            print_success("Authenticated endpoint working!")
                            print_info(f"Profile response: {json.dumps(profile_response.json(), indent=2)[:100]}...")
                        else:
                            print_warning(f"Authenticated endpoint returned status: {profile_response.status_code}")
                            print_info(f"Response: {profile_response.text[:100]}...")
                else:
                    print_warning(f"Login failed with status: {login_response.status_code}")
                    print_info(f"Response: {login_response.text[:100]}...")
            except Exception as e:
                print_warning(f"Login test failed: {str(e)}")
        else:
            print_warning(f"Registration returned status: {response.status_code}")
            print_info(f"Response: {response.text[:100]}...")
    except Exception as e:
        print_warning(f"Registration test failed: {str(e)}")


def run_tests():
    print_header(f"GAMEUNITE BACKEND TEST SUITE - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # First test the health endpoint
    health_result = test_health_endpoint()

    # Then test MongoDB connection directly
    mongo_result = test_mongodb_connection()

    if mongo_result:
        # Test basic CRUD operations on MongoDB
        crud_result = test_mongodb_crud()
    else:
        print_warning("Skipping CRUD tests due to MongoDB connection failure")
        crud_result = False

    # Test API endpoints
    print_header("TESTING API ENDPOINTS")
    print_info("Note: This requires the Flask server to be running!")
    test_api_endpoints()

    # Print summary
    print_header("TEST SUMMARY")
    print(f"Health Endpoint: {'✓ PASS' if health_result else '✗ FAIL'}")
    print(f"MongoDB Connection: {'✓ PASS' if mongo_result else '✗ FAIL'}")
    print(f"MongoDB CRUD Operations: {'✓ PASS' if crud_result else '✗ FAIL'}")
    print_info("API Endpoint tests: See individual results above")

    print("\nTest completed at:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))


if __name__ == "__main__":
    run_tests()
