import asyncio
import os
import sys
from dotenv import load_dotenv
import motor.motor_asyncio
import json
from bson import json_util

sys.path.append(os.getcwd())
load_dotenv()

async def run():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv('MONGO_URI'))
    db = client.global_wealth_optimizer
    user = await db.users.find_one({"email": "demo.user@gmail.com"})
    print(json.loads(json_util.dumps(user)))

if __name__ == "__main__":
    asyncio.run(run())
