from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import logging
import certifi

logger = logging.getLogger(__name__)

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
# If it's an Atlas URI, we might need to handle SSL issues
client_options = {
    "serverSelectionTimeoutMS": 5000,
    "connectTimeoutMS": 5000
}
if "mongodb+srv" in MONGO_URI:
    client_options["tlsAllowInvalidCertificates"] = False # Reverting to secure but with certifi
    client_options["tlsCAFile"] = certifi.where()

client = AsyncIOMotorClient(MONGO_URI, **client_options)
database = client.global_wealth_optimizer

async def check_db_connection():
    try:
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        return False
