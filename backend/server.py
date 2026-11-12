from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


# ---------- Product models ----------

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")

    slug: str
    name: str
    subname: str
    category: str
    tagline: str
    description: str
    image: str
    ingredients: List[str] = []
    prep: str = ""
    notes: List[str] = []
    nutrition: List[str] = []
    benefits: List[str] = []
    packSize: Optional[str] = None
    price: Optional[str] = None
    provenance: Optional[str] = None
    lifestyle: List[str] = []


SEED_PRODUCTS = [
    {"slug":"root-and-leaf","name":"Root & Leaf","subname":"Moringa · Tulsi · Lemongrass · Ginger","category":"botanical","tagline":"A botanical wellness beverage, green and gently warming.","description":"A green botanical beverage built on moringa and tulsi, lifted by lemongrass and warmed with ginger. Moringa brings gentle, everyday nourishment; tulsi and ginger make it a pleasure to drink.","image":"/images/products/root-and-leaf.jpg","ingredients":["Moringa","Tulsi (holy basil)","Lemongrass","Ginger"],"prep":"Stir one teaspoon into a glass of cold water, or steep in hot water for three minutes. Best in the morning.","notes":["Fresh greens","Lemongrass","Warm spice"],"nutrition":["Source of natural plant nutrients","No added sugar","Caffeine-free"],"benefits":["Everyday nourishment from moringa and tulsi","Fits easily into regular routines"],"packSize":None,"price":"₹ 350","provenance":None,"lifestyle":["nourish-flourish"]},
    {"slug":"coco-matcha","name":"Coco Matcha","subname":"Matcha · Coconut · Vanilla","category":"matcha","tagline":"Creamy matcha latte — whisk, pour, begin.","description":"Ceremonial-grade matcha whisked into creamy coconut milk. A calm, sustained start to the day — the theanine–caffeine pairing of matcha without the jolt of coffee.","image":"/images/products/coco-matcha.jpg","ingredients":["Ceremonial-grade matcha","Coconut milk powder","Vanilla","A pinch of sea salt"],"prep":"Whisk two teaspoons with a splash of hot water, then top with warm or iced milk of your choice.","notes":["Sweet grass","Coconut cream","Vanilla"],"nutrition":["No preservatives","Contains naturally occurring caffeine"],"benefits":["Calm, sustained energy from matcha","Morning momentum without the jitters"],"packSize":None,"price":"₹ 550","provenance":None,"lifestyle":["launchpad"]},
    {"slug":"woodland-brew","name":"Woodland Brew","subname":"Coffee · Lion's Mane · Chaga","category":"coffee","tagline":"Functional mushroom coffee for steady attention.","description":"Rich arabica coffee blended with wood-grown functional mushrooms — lion's mane and chaga — for a cup that supports focus without the crash.","image":"/images/products/woodland-brew.jpg","ingredients":["Arabica coffee","Lion's mane extract","Chaga extract","A hint of cacao"],"prep":"Brew like instant: one teaspoon into hot water or milk, stirred until smooth.","notes":["Roast coffee","Forest woods","Cacao"],"nutrition":["Lower caffeine than a standard cup of coffee","No added sugar"],"benefits":["Sustained attention and clarity","A gentle lift, not a spike"],"packSize":None,"price":"₹ 480","provenance":None,"lifestyle":["steady-focus"]},
    {"slug":"teesi","name":"Teesi","subname":"Traditional Roasted Flaxseed","category":"traditional","tagline":"Traditional roasted flaxseed, the old way.","description":"Flaxseed slow-roasted in the traditional manner until nutty and warm, then milled fine. A spoonful brings everyday nourishment to anything it meets.","image":"/images/products/teesi.jpg","ingredients":["Roasted flaxseed"],"prep":"Sprinkle over rice, curd, oats or eggs — one to two teaspoons a day.","notes":["Toasted nuts","Warm earth","Umami"],"nutrition":["Naturally rich in omega-3 (ALA)","High in dietary fibre","Plant-based protein"],"benefits":["Meaningful everyday nourishment","Traditional preparation, modern standards"],"packSize":None,"price":"₹ 320","provenance":None,"lifestyle":["nourish-flourish"]},
    {"slug":"crimson-berry","name":"Crimson Berry","subname":"Hibiscus & Cranberry","category":"teas","tagline":"A deep ruby infusion — tart, vivid, cooling.","description":"Hibiscus steeped deep ruby with cranberry and a lift of rosehip. Tart and vivid, equally at home hot or poured over ice.","image":"/images/products/crimson-berry.jpg","ingredients":["Hibiscus petals","Cranberry pieces","Rosehip"],"prep":"One heaped teaspoon per cup. Steep five minutes in just-boiled water. Lovely iced.","notes":["Tart hibiscus","Berry","Rosehip"],"nutrition":["Naturally caffeine-free","No added sugar"],"benefits":["Cooling and refreshing","A colourful ritual, morning or evening"],"packSize":"50 g individual pack","price":"₹ 450","provenance":None,"lifestyle":["nourish-flourish"]},
    {"slug":"blue-spice","name":"Blue Spice","subname":"Blueberry & Warm Spices","category":"teas","tagline":"Blueberries and warm spice — deep, fruity, gently spiced.","description":"Blueberries steeped with cinnamon and whole cloves — a deep, berry-toned infusion carried on warm spice. Comforting hot, striking over ice.","image":"/images/products/blue-spice.jpg","ingredients":["Blueberries","Cinnamon","Cloves"],"prep":"One teaspoon per cup. Steep four minutes in just-boiled water. Lovely iced.","notes":["Blueberry","Warm cinnamon","Clove"],"nutrition":["Naturally caffeine-free","No added sugar"],"benefits":["A warming fruit-and-spice ritual","Comforting in the quiet hours"],"packSize":"50 g individual pack","price":"₹ 480","provenance":None,"lifestyle":["find-your-calm","ceremonial-indulgence"]},
    {"slug":"golden-glow","name":"Golden Glow","subname":"Green Tea & Turmeric","category":"teas","tagline":"Green tea brightened with turmeric — a golden steadiness.","description":"Green tea lifted by golden turmeric, a whisper of ginger and a pinch of black pepper for warmth. A quiet, steady cup for the middle of the day.","image":"/images/products/golden-glow.jpg","ingredients":["Green tea","Turmeric (Lakadong)","Black pepper","Ginger"],"prep":"One teaspoon per cup. Water at 80°C. Steep three minutes.","notes":["Fresh greens","Warm turmeric","Gentle pepper"],"nutrition":["Contains naturally occurring caffeine (green tea)","No added sugar"],"benefits":["Steady focus without the spike","The golden warmth of turmeric"],"packSize":"50 g individual pack","price":"₹ 460","provenance":None,"lifestyle":["steady-focus","nourish-flourish"]},
    {"slug":"lopchu","name":"Lopchu","subname":"Darjeeling Black Tea","category":"teas","tagline":"High-elevation Darjeeling — muscatel, bright, precise.","description":"Whole-leaf black tea from the Lopchu estate in Darjeeling — an orange pekoe that brews a bright, orange-hued cup. Muscatel brightness, precise and aromatic. A proper morning cup.","image":"/images/products/lopchu.jpg","ingredients":["Darjeeling whole-leaf black tea (Lopchu estate)"],"prep":"One teaspoon per cup. Water just off the boil. Steep three minutes.","notes":["Muscatel","Bright citrus","Honey"],"nutrition":["Contains naturally occurring caffeine","Whole leaf only"],"benefits":["Clean, focused energy","A proper start to the day"],"packSize":"50 g individual pack","price":"₹ 520","provenance":None,"lifestyle":["launchpad","ceremonial-indulgence"]},
    {"slug":"dream-weaver","name":"Dream Weaver","subname":"Chamomile & Lavender","category":"teas","tagline":"Chamomile and lavender, woven for the end of the day.","description":"Whole chamomile flowers and lavender, balanced with lemon balm. Soft, honeyed and made for the hour when the day should start slowing down.","image":"/images/products/dream-weaver.jpg","ingredients":["Chamomile flowers","Lavender","Lemon balm"],"prep":"One heaped teaspoon per cup. Steep five minutes, covered. An hour before bed.","notes":["Apple-sweet chamomile","Lavender","Honey"],"nutrition":["Naturally caffeine-free","No added sugar"],"benefits":["A wind-down ritual","Comfort before rest"],"packSize":"50 g individual pack","price":"₹ 470","provenance":None,"lifestyle":["find-your-calm","sundowners-sleep"]},
    {"slug":"minty-lemon","name":"Minty Lemon","subname":"Mint & Lemongrass","category":"teas","tagline":"Cool mint and bright lemongrass — clean air in a cup.","description":"Peppermint and lemongrass with a lift of lemon verbena. Clean, cooling and refreshing — as good iced on a warm afternoon as it is hot in the morning.","image":"/images/products/minty-lemon.jpg","ingredients":["Peppermint","Lemongrass","Lemon verbena"],"prep":"One teaspoon per cup. Steep four minutes. Equally good iced.","notes":["Cool mint","Citrus","Fresh herbs"],"nutrition":["Naturally caffeine-free","No added sugar"],"benefits":["Clear and refreshing, any time of day","Cools and settles"],"packSize":"50 g individual pack","price":"₹ 440","provenance":None,"lifestyle":["find-your-calm","nourish-flourish"]},
    {"slug":"blue-magic","name":"Blue Magic","subname":"Blue Pea Blossom & Florals","category":"teas","tagline":"A vivid, colour-changing cup of pure blue.","description":"Pure blue pea blossom with gentle florals — a cup that steeps a deep, unearthly blue and shifts with a squeeze of citrus. The centrepiece of a slow ceremony.","image":"/images/products/blue-magic.jpg","ingredients":["Blue pea (butterfly pea) flowers","Rose petals","A touch of lemongrass"],"prep":"One teaspoon per cup. Steep four minutes and watch the colour develop. Citrus turns it violet.","notes":["Sweet florals","Fresh green","Soft earth"],"nutrition":["Naturally caffeine-free","No added sugar"],"benefits":["The colour-changing centrepiece of the ritual","Best taken slowly"],"packSize":"50 g individual pack","price":"₹ 490","provenance":None,"lifestyle":["ceremonial-indulgence"]},
    {"slug":"floral-blends","name":"Floral Blends","subname":"Rose · Chamomile · Blue Florals","category":"teas","tagline":"A perfumed medley of flowers, soft and unhurried.","description":"Rose, chamomile and blue florals blended soft and perfumed. A gentle, aromatic cup that asks you to take your time with it.","image":"/images/products/floral-blends.jpg","ingredients":["Rose petals","Chamomile","Blue pea flowers","Lavender"],"prep":"One heaped teaspoon per cup. Steep four minutes in just-boiled water.","notes":["Rose","Honey","Soft florals"],"nutrition":["Naturally caffeine-free","No added sugar"],"benefits":["Slow, perfumed, unhurried","A quiet moment in the middle of the day"],"packSize":"50 g individual pack","price":"₹ 460","provenance":None,"lifestyle":["find-your-calm","ceremonial-indulgence"]},
    {"slug":"dhaba-delight","name":"Dhaba Delight","subname":"Masala Chai","category":"teas","tagline":"A roadside-inspired masala chai — bold, spiced, made for milk.","description":"Strong black tea simmered with cardamom, cinnamon, ginger, clove and black pepper. Bold and warming, the way chai tastes at a highway dhaba at dawn — made with better ingredients.","image":"/images/products/dhaba-delight.jpg","ingredients":["Strong black tea","Cardamom","Cinnamon","Ginger","Clove","Black pepper"],"prep":"Simmer one teaspoon in milk and water, sweeten to taste. The dhaba way.","notes":["Warm spice","Malt","Cardamom"],"nutrition":["Contains naturally occurring caffeine"],"benefits":["Warming and grounding","The most flavoursome way to slow down"],"packSize":"50 g individual pack","price":"₹ 420","provenance":None,"lifestyle":["launchpad","ceremonial-indulgence"]},
]


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# ---------- Product CRUD routes ----------

@api_router.get("/products", response_model=List[Product])
async def list_products():
    items = await db.products.find({}, {"_id": 0}).to_list(1000)
    return items


@api_router.post("/products/seed")
async def seed_products():
    count = await db.products.count_documents({})
    if count > 0:
        return {"message": f"Collection already has {count} products — skipped. DELETE all first to re-seed."}
    await db.products.insert_many([{**p} for p in SEED_PRODUCTS])
    return {"message": f"Seeded {len(SEED_PRODUCTS)} products."}


@api_router.get("/products/{slug}", response_model=Product)
async def get_product(slug: str):
    item = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    return item


@api_router.post("/products", response_model=Product, status_code=201)
async def create_product(product: Product):
    existing = await db.products.find_one({"slug": product.slug})
    if existing:
        raise HTTPException(status_code=409, detail="A product with this slug already exists")
    await db.products.insert_one(product.model_dump())
    return product


@api_router.put("/products/{slug}", response_model=Product)
async def update_product(slug: str, product: Product):
    result = await db.products.replace_one({"slug": slug}, product.model_dump())
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@api_router.delete("/products/{slug}")
async def delete_product(slug: str):
    result = await db.products.delete_one({"slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": f"Product '{slug}' deleted."}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()