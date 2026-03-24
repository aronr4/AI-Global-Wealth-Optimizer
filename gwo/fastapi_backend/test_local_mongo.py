import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_local():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017", serverSelectionTimeoutMS=2000)
    try:
        await client.admin.command('ping')
        print("Local MongoDB is UP")
    except Exception as e:
        print(f"Local MongoDB is DOWN: {e}")

if __name__ == "__main__":
    asyncio.run(test_local())
