import asyncio
import base64
import os
import sys
from io import BytesIO

from dotenv import load_dotenv
from PIL import Image
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

load_dotenv("/app/backend/.env")

SRC = "/app/frontend/public/images/products"
RAW = "/tmp/gen_raw"
FINAL = "/tmp/gen_final"
os.makedirs(RAW, exist_ok=True)
os.makedirs(FINAL, exist_ok=True)

MODEL = "gemini-3.1-flash-image-preview"

SHARED = """Professional premium editorial food photography for the brand "The Harvest Theory".
Recreate the product package from the reference image EXACTLY as it appears: same pouch or jar shape, same label design, same brand name "The Harvest Theory" and product name text, same colours and materials, crisp readable front label, undistorted proportions, positioned as the hero anchor of the frame standing upright and slightly angled.
Around it build one cohesive studio scene: the prepared drink beside it, a small natural mound of the loose product in front of the pack, and only the one or two restrained ingredient props described. The pack, the drink and the loose product dominate; props stay minimal.
Setting: warm cream textured-plaster or warm stone surface with a subtle sage-green or dark stone accent in the background; muted earthy palette (warm cream, botanical green, sage, natural brown, muted terracotta, charcoal stone). Warm natural daylight from one side with soft gentle shadows, shallow depth of field, generous negative space, calm premium magazine food-campaign feel. Slightly elevated three-quarter camera angle, similar framing to a tasting still life. No clutter, no rustic farmhouse styling, no synthetic colours, no white ecommerce background, no hands.
Composition: 4:3 landscape, package and cup safely inside central framing."""

PRODUCTS = {
    "root-and-leaf": "Loose product: a fine green botanical powder blend (it is sold as a powder), shown as a soft mound in a small matte stoneware dish. Prepared drink: a warm amber-green herbal infusion in a clear ceramic or matte stoneware cup. Props: two of — moringa leaves, tulsi leaves, a lemongrass stalk, a thin slice of ginger. Mood: nourishing, grounding, restorative, earthy.",
    "coco-matcha": "Loose product: smooth pale-green matcha powder, sifted into a low mound in a small dish. Prepared drink: a creamy matcha latte in pale jade green with a smooth surface or soft microfoam in a matte ceramic cup. Props: one small coconut piece or coconut chip detail, optionally a bamboo whisk lying subtly in the background. Mood: fresh, modern, premium, morning ritual, gentle energy.",
    "woodland-brew": "Loose product: dark roasted coffee powder with a pinch of pale mushroom powder beside it in a small dish. Prepared drink: a rich dark coffee, black or with a soft crema, in a matte stoneware cup. Props: a scatter of coffee beans and one subtle elegant culinary mushroom (such as a slice of lion's mane). Mood: focus, depth, warmth, intelligent functionality.",
    "teesi": "Loose product: glossy roasted golden-brown flaxseeds (accurately flaxseed — small oval seeds), in a small ceramic bowl and a spoonful. Serving context: a small serving bowl showing the roasted flaxseed preparation eaten as a spoonful, with a very subtle plain rice or roti hint in the soft background only if understated. Props: a few whole flaxseeds scattered, a light pinch of salt texture. No drink. Mood: traditional, nourishing, familiar, elevated.",
    "crimson-berry": "Loose product: dried deep-red hibiscus petals with a few dried cranberry pieces in a small dish. Prepared drink: a deep ruby-crimson infusion in a clear glass cup, glowing. Props: two hibiscus petals and one small cranberry detail. Mood: vibrant but premium, tart, refreshing.",
    "blue-spice": "Loose product: vivid blue butterfly-pea flowers with one restrained warm-spice element in a small dish. Prepared drink: a naturally blue-indigo infusion in a clear glass cup. Props: two blue pea flowers, one cinnamon stick or two cardamom pods. Mood: intriguing, calming, ceremonial, visually striking.",
    "golden-glow": "Loose product: green tea leaves with a small piece of fresh turmeric root in a small dish. Prepared drink: a warm golden-green infusion in a clear glass or pale ceramic cup. Props: a turmeric slice and a pinch of green tea leaves. Mood: bright, clean, focused, nourishing.",
    "lopchu": "Loose product: high-quality whole-leaf Darjeeling black tea, dark and wiry, in a small dish. Prepared drink: a rich amber-copper tea in a classic pale ceramic cup. Props: minimal — one elegant cluster of tea leaves only, no florals. Mood: classic, refined, premium, composed.",
    "dream-weaver": "Loose product: golden chamomile flowers with a few purple lavender buds in a small dish. Prepared drink: a pale golden infusion in a soft matte ceramic cup. Props: two chamomile flowers and one small lavender sprig. Mood: soft, calming, evening, elegant.",
    "minty-lemon": "Loose product: fresh green mint leaves with a short cut lemongrass stalk in a small dish. Prepared drink: a light green-gold infusion in a clear glass cup. Props: one fresh mint sprig and one subtle lemongrass stalk. Mood: clean, refreshing, calm, light.",
    "blue-magic": "Loose product: vivid blue butterfly-pea flowers with a minimal spice hint in a small dish. Prepared drink: a striking sapphire-blue infusion in a clear glass cup. Props: two or three blue pea flowers only, one restrained spice element. Mood: theatrical but tasteful, ceremonial, sensory, premium.",
    "floral-blends": "Loose product: an elegant restrained assortment of edible tea flowers (rose petals, chamomile, a blue pea flower) in a small dish, never looking like potpourri. Prepared drink: a light, delicately coloured floral infusion in a clear glass cup. Props: only two or three selected petals. Mood: aromatic, delicate, calming, sophisticated.",
    "dhaba-delight": "Loose product: black tea leaves mixed with a restrained few whole spices in a small dish. Prepared drink: a rich creamy masala chai with milk in a warm rustic-elegant ceramic cup. Props: two cardamom pods, one cinnamon stick, a thin slice of ginger, at most one clove. Mood: warm, familiar, indulgent, a modern interpretation of an Indian classic.",
}


def crop_43(path_in, path_out):
    im = Image.open(path_in).convert("RGB")
    w, h = im.size
    target = 4 / 3
    if w / h > target:
        nw = int(h * target)
        x = (w - nw) // 2
        im = im.crop((x, 0, x + nw, h))
    else:
        nh = int(w / target)
        y = (h - nh) // 2
        im = im.crop((0, y, w, y + nh))
    im.save(path_out, quality=90, optimize=True)


async def gen(slug, direction, attempt=1):
    ref = os.path.join(SRC, f"{slug}.jpg")
    with open(ref, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id=f"product-img-{slug}-{attempt}",
        system_message="You are a premium food and beverage photographer for The Harvest Theory.",
    ).with_model("gemini", MODEL).with_params(modalities=["image", "text"])
    msg = UserMessage(
        text=f"{SHARED}\n\nThis product: {direction}\nKeep the reference packaging unchanged and readable.",
        file_contents=[ImageContent(b64)],
    )
    text, images = await chat.send_message_multimodal_response(msg)
    if not images:
        raise RuntimeError("no image returned")
    raw_path = os.path.join(RAW, f"{slug}.png")
    with open(raw_path, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    crop_43(raw_path, os.path.join(FINAL, f"{slug}.jpg"))
    print(f"OK {slug} ({len(images)} image, note: {str(text)[:80]!r})", flush=True)


async def main():
    only = sys.argv[1:] if len(sys.argv) > 1 else list(PRODUCTS)
    failed = []
    for slug in only:
        for attempt in (1, 2):
            try:
                await gen(slug, PRODUCTS[slug], attempt)
                break
            except Exception as e:
                print(f"FAIL {slug} attempt {attempt}: {str(e)[:200]}", flush=True)
                if attempt == 2:
                    failed.append(slug)
    print(f"DONE failed={failed}", flush=True)


asyncio.run(main())
