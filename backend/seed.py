import asyncio, os
from pathlib import Path
from datetime import datetime, timezone, timedelta
import uuid
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

IMG = {
    "home": "https://images.unsplash.com/photo-1723110994499-df46435aa4b3?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85",
    "home2": "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
    "plot": "https://images.pexels.com/photos/11201060/pexels-photo-11201060.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "land": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    "shop": "https://images.pexels.com/photos/32367382/pexels-photo-32367382.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
}

def media(*urls):
    return [{"path": u, "type": "image", "url": u} for u in urls]

PROPS = [
    {"title": "200 Sq Yd Residential Plot", "property_type": "plot", "location": "Khair", "price": "18 Lakh", "area": "200 sq yd", "description": "Prime residential plot in a fast-developing sector of Khair with clear title and road access. Ideal for building your dream home.", "amenities": ["Corner plot", "Road facing", "Clear title", "Boundary wall"], "status": "available", "featured": True, "media": media(IMG["plot"])},
    {"title": "3 BHK Independent House", "property_type": "home", "location": "Aligarh", "price": "62 Lakh", "area": "1450 sq ft", "description": "Beautiful 3 BHK independent house in a peaceful colony with modern fittings, car parking and 24x7 water supply.", "amenities": ["3 Bedrooms", "Car parking", "Modular kitchen", "Water supply"], "status": "available", "featured": True, "media": media(IMG["home"], IMG["home2"])},
    {"title": "Commercial Shop on Main Road", "property_type": "shop", "location": "Agra Road", "price": "35 Lakh", "area": "350 sq ft", "description": "High-footfall commercial shop on Agra Road, perfect for retail business. Excellent visibility and frontage.", "amenities": ["Main road", "High footfall", "Shutter front", "Power backup"], "status": "available", "featured": False, "media": media(IMG["shop"])},
    {"title": "Agricultural Land 2 Bigha", "property_type": "land", "location": "Tapal", "price": "22 Lakh", "area": "2 Bigha", "description": "Fertile agricultural land near Tapal with irrigation facility and approach road. Great investment opportunity.", "amenities": ["Irrigation", "Approach road", "Fertile soil"], "status": "available", "featured": False, "media": media(IMG["land"])},
    {"title": "Investment Plot New Yamuna Expressway", "property_type": "plot", "location": "New Yamuna Expressway", "price": "45 Lakh", "area": "300 sq yd", "description": "Premium investment plot along the New Yamuna Expressway near the upcoming Jewar Airport corridor. High appreciation potential.", "amenities": ["Near Jewar Airport", "Expressway facing", "Gated township"], "status": "available", "featured": True, "media": media(IMG["plot"])},
    {"title": "2 BHK House near Jewar", "property_type": "home", "location": "Jewar", "price": "40 Lakh", "area": "1000 sq ft", "description": "Compact and well-built 2 BHK house close to Jewar, minutes from the airport project. Sold recently.", "amenities": ["2 Bedrooms", "Terrace", "Parking"], "status": "sold", "featured": False, "media": media(IMG["home2"])},
    {"title": "Corner Plot in Jatari", "property_type": "plot", "location": "Jatari", "price": "12 Lakh", "area": "150 sq yd", "description": "Affordable corner plot in Jatari residential area, ready for construction with all approvals in place.", "amenities": ["Corner plot", "Ready to build", "Approved layout"], "status": "available", "featured": False, "media": media(IMG["plot"])},
    {"title": "Showroom Space Mathura Road", "property_type": "shop", "location": "Mathura Road", "price": "70 Lakh", "area": "800 sq ft", "description": "Spacious showroom space on Mathura Road with large glass frontage, ideal for brand outlets and showrooms.", "amenities": ["Glass frontage", "Ground floor", "Ample parking", "Power backup"], "status": "available", "featured": True, "media": media(IMG["shop"])},
]

async def main():
    existing = await db.properties.count_documents({})
    if existing > 0:
        print(f"Skipping seed, {existing} properties already exist.")
        return
    base = datetime.now(timezone.utc)
    docs = []
    for i, p in enumerate(PROPS):
        docs.append({
            **p,
            "id": str(uuid.uuid4()),
            "created_at": (base - timedelta(hours=i)).isoformat(),
        })
    await db.properties.insert_many(docs)
    # contact settings
    await db.settings.update_one({"key": "contact"}, {"$set": {
        "key": "contact",
        "whatsapp": "+919876543210",
        "telegram": "muneshproperties",
        "phone": "+919876543210",
        "email": "info@muneshproperties.com",
        "address": "Main Market, Khair, Aligarh, Uttar Pradesh 202138",
        "about": "Munesh Properties is your trusted real estate partner in Uttar Pradesh, dealing in plots, homes, land and commercial shops across Khair, Aligarh, Jewar, Tapal and the New Yamuna Expressway corridor.",
    }}, upsert=True)
    print(f"Seeded {len(docs)} properties and contact settings.")

asyncio.run(main())
