"""
ingest.py — CraftTrail RAG Knowledge Ingestion
================================================
Loads ALL data sources into ChromaDB vector store:
  1. Built-in state/craft knowledge (states.json)
  2. Artisan profiles from MongoDB
  3. Any PDF / CSV / TXT files dropped into ./data/
  4. Government cluster data

Run:  python ingest.py
Re-run any time you add new files to ./data/
"""

import os, json, glob, sys, csv, io
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from langchain_text_splitters import RecursiveCharacterTextSplitter

# ── Config ────────────────────────────────────────────────────────────
CHROMA_PATH   = os.getenv("CHROMA_DB_PATH", "./chroma_db")
MONGO_URI     = os.getenv("MONGO_URI", "mongodb://localhost:27017/crafttrail")
DATA_DIR      = Path(__file__).parent / "data"
COLLECTION    = "crafttrail_knowledge"

embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"   # ~90 MB, downloads once, runs locally
)

client     = chromadb.PersistentClient(path=CHROMA_PATH)
collection = client.get_or_create_collection(
    name=COLLECTION,
    embedding_function=embedding_fn,
    metadata={"hnsw:space": "cosine"},
)

splitter = RecursiveCharacterTextSplitter(
    chunk_size=600,
    chunk_overlap=80,
    separators=["\n\n", "\n", ".", "!", "?", " "],
)


def add_chunks(texts: list[str], ids_prefix: str, meta: dict = {}):
    """Embed and insert a list of text chunks into ChromaDB."""
    if not texts:
        return 0
    ids   = [f"{ids_prefix}_{i}" for i in range(len(texts))]
    metas = [meta] * len(texts)
    # Upsert so re-running doesn't duplicate
    collection.upsert(documents=texts, ids=ids, metadatas=metas)
    return len(texts)


# ── 1. Built-in state knowledge ───────────────────────────────────────
STATE_KNOWLEDGE = {
    "Telangana": {
        "crafts": ["Pochampally Ikat", "Gadwal Sarees", "Nirmal Paintings", "Bidri Work", "Pembarthi Metal Craft"],
        "culture": "Rich Deccan heritage blending Telugu and Urdu traditions. Famous for Kuchipudi dance, Perini Shivatandavam, and Bonalu festivals.",
        "products": ["Pochampally Ikat sarees & dress materials", "Gadwal silk-cotton sarees", "Nirmal lacquered furniture & toys", "Bidriware vases, boxes & jewellery"],
        "gi": ["Pochampally Ikat", "Gadwal Sarees", "Nirmal Toys", "Bidriware"],
        "clusters": ["Pochampally — 50km from Hyderabad", "Gadwal — 180km from Hyderabad", "Nirmal — 300km north", "Karimnagar for silver filigree"],
        "history": "Pochampally weavers have practiced Ikat for over 500 years. Each thread is resist-dyed before weaving. A single Pochampally Ikat saree has over 5000 individual thread-tie-and-dye operations.",
        "visit": "Best visited October–March. Pochampally village has a Handloom Park where you can watch Ikat weaving live.",
    },
    "Andhra Pradesh": {
        "crafts": ["Kalamkari", "Kondapalli Toys", "Etikoppaka Lacware", "Dharmavaram Silk", "Uppada Jamdani"],
        "culture": "Ancient Satavahana and Vijayanagara heritage. Home of Kuchipudi dance, Harikatha storytelling, and Tirupati temple.",
        "products": ["Kalamkari cotton & silk fabrics", "Kondapalli painted wooden toys", "Dharmavaram silk pattu sarees"],
        "gi": ["Kalamkari", "Kondapalli Toys", "Etikoppaka Toys", "Dharmavaram Silk", "Uppada Jamdani"],
        "clusters": ["Sri Kalahasti — hand-painted Kalamkari", "Machilipatnam — block-printed Kalamkari", "Kondapalli near Vijayawada", "Etikoppaka near Rajahmundry"],
        "history": "Kalamkari (kalam=pen, kari=work) is a 3000-year-old art. Sri Kalahasti style uses hand painting, Machilipatnam uses block printing. Only natural dyes from plants and minerals.",
        "visit": "Sri Kalahasti, near Tirupati. Kondapalli fort village welcomes visitors.",
    },
    "Rajasthan": {
        "crafts": ["Bagru Block Printing", "Sanganeri Printing", "Blue Pottery", "Bandhani", "Miniature Painting", "Thewa Jewellery"],
        "culture": "Royal Rajput heritage. Famous for Ghoomar dance, Kalbeliya dance, Pushkar fair, and colourful festivals. Painted havelis and desert forts.",
        "products": ["Bagru hand-block printed fabrics", "Jaipur Blue Pottery", "Bandhani tie-dye textiles", "Jaipur gemstone jewellery"],
        "gi": ["Jaipur Blue Pottery", "Kota Doria", "Bagru Hand Block Print", "Thewa Art"],
        "clusters": ["Bagru — 30km from Jaipur", "Sanganer — 16km from Jaipur", "Nathdwara for Pichwai paintings"],
        "history": "Bagru has been printing cloth using natural indigo and alizarin for 300+ years. Jaipur Blue Pottery is unique — made from quartz powder not clay.",
        "visit": "Bagru village year-round. Sanganer on Saraswati river banks. Best: October–February.",
    },
    "Gujarat": {
        "crafts": ["Patan Patola", "Bandhani", "Kutch Embroidery", "Rogan Art", "Ajrakh Block Printing"],
        "culture": "Garba and Dandiya Raas dances. Navratri world's largest dance festival. Rann Utsav. Kite festival.",
        "products": ["Patan Patola double-Ikat silk sarees", "Kutch mirror-work embroidery", "Bandhani tie-dye fabrics", "Ajrakh block-printed cloth"],
        "gi": ["Patan Patola", "Kutch Embroidery", "Surat Zari"],
        "clusters": ["Patan — 130km from Ahmedabad", "Bhuj — centre of Kutch crafts", "Jamnagar for Bandhani", "Ajrakhpur near Bhuj"],
        "history": "Only 3 families in the world know the Patan Patola double Ikat technique. A single saree takes 6-12 months and costs Rs 1-5 lakhs. Kutch embroidery has over 16 distinct regional styles.",
        "visit": "Bhuj for Kutch villages. Nirona for Rogan art. Best: October–February.",
    },
    "Karnataka": {
        "crafts": ["Mysore Silk", "Channapatna Toys", "Bidriware", "Ilkal Sarees", "Rosewood Inlay"],
        "culture": "Carnatic music, Yakshagana theatre, Dasara festival in Mysuru. UNESCO-listed Hampi ruins.",
        "products": ["Mysore pure silk sarees with gold zari", "Channapatna lacquered wooden toys", "Bidriware boxes & vases"],
        "gi": ["Mysore Silk", "Channapatna Toys", "Bidriware", "Ilkal Sarees"],
        "clusters": ["Channapatna — 60km south of Bengaluru", "Mysuru for silk weaving (KSIC factory)", "Bidar for Bidriware"],
        "history": "Channapatna toys were popularised by Hyder Ali who invited Persian craftsmen. Today 5000+ artisans work in this one town. Mysore silk was patronised by Hyder Ali and Tipu Sultan.",
        "visit": "Channapatna workshops welcome visitors. KSIC Silk Factory in Mysuru gives guided tours.",
    },
    "Tamil Nadu": {
        "crafts": ["Kanchipuram Silk", "Swamimalai Bronze", "Thanjavur Paintings", "Chettinad Pottery", "Palmyra Crafts"],
        "culture": "Bharatanatyam dance, Carnatic music, Dravidian temple architecture 2000+ years old. Grand temples at Madurai, Thanjavur, Chidambaram.",
        "products": ["Kanchipuram pure mulberry silk sarees", "Panchaloha bronze Nataraja statues", "Thanjavur gold-leaf paintings"],
        "gi": ["Kanchipuram Silk", "Thanjavur Paintings", "Swamimalai Bronze"],
        "clusters": ["Kanchipuram — 70km from Chennai", "Swamimalai near Kumbakonam", "Thanjavur city for paintings"],
        "history": "Kanchipuram silk has over 1200 threads per inch. Swamimalai lost-wax casting follows 1000-year-old Chola techniques. 65+ generations of artisans — the knowledge transmitted orally.",
        "visit": "Kanchipuram Weavers Colony open to visitors. Swamimalai bronze workshops on the main road.",
    },
    "West Bengal": {
        "crafts": ["Kantha Embroidery", "Bishnupur Terracotta", "Baluchari Silk", "Dhokra Metal", "Shola Work"],
        "culture": "Rabindranath Tagore, Bengal Renaissance, Durga Puja (UNESCO Intangible Heritage). Baul music, Kathakali.",
        "products": ["Kantha quilts & embroidered sarees", "Bishnupur terracotta jewellery", "Baluchari silk sarees with woven stories"],
        "gi": ["Darjeeling Tea", "Baluchari Saree", "Dhaniakhali Saree"],
        "clusters": ["Murshidabad for silk & Kantha", "Bishnupur — 200km from Kolkata", "Shantiniketan for Kantha & Batik"],
        "history": "Kantha literally means rags. It began as recycling old sarees into quilts for babies. Bishnupur was the seat of Malla kings famous for terracotta temples.",
        "visit": "Shantiniketan has vibrant craft market. Best: October–February.",
    },
    "Odisha": {
        "crafts": ["Pattachitra", "Sambalpuri Ikat", "Dhokra", "Pipli Appliqué", "Stone Carving"],
        "culture": "Odissi classical dance, Rath Yatra festival, Konark Sun Temple. 62 tribal communities each with distinct craft traditions.",
        "products": ["Pattachitra paintings on cloth & palm leaf", "Sambalpuri silk Ikat sarees", "Dhokra metal figurines", "Pipli umbrellas & bags"],
        "gi": ["Pattachitra", "Sambalpuri Saree", "Pipli Appliqué"],
        "clusters": ["Raghurajpur Heritage Village near Puri", "Sambalpur for Ikat", "Pipli — 35km from Bhubaneswar"],
        "history": "Raghurajpur is India's only Heritage Craft Village — every family is an artist. Children learn Pattachitra before they learn to write. 500-year tradition. Natural pigments from plants, minerals and soot.",
        "visit": "Raghurajpur open daily, 14km from Puri. India's most accessible craft village.",
    },
    "Uttar Pradesh": {
        "crafts": ["Banarasi Silk", "Chikankari", "Zardozi", "Brassware", "Carpet Weaving"],
        "culture": "Varanasi ghats, Mughal grandeur, Lucknow Nawabi tehzeeb (refined courtesy). Kathak dance, Banarasi music.",
        "products": ["Banarasi silk brocade sarees with gold zari", "Lucknow Chikankari kurtas & sarees", "Agra marble inlay", "Varanasi brass diyas"],
        "gi": ["Banarasi Brocades", "Lucknow Chikankari", "Bhadohi Carpet"],
        "clusters": ["Varanasi — Madanpura area for silk", "Lucknow — Hazratganj for Chikankari", "Bhadohi — Carpet City 65km from Varanasi"],
        "history": "Banarasi silk weaving dates to the Mughal era. Finest Kadwa brocade takes 6 months for one saree. Chikankari 32 stitches were taught by Mughal Empress Noor Jahan.",
        "visit": "Varanasi silk weavers in narrow lanes near Madanpura mosque. Best: October–March.",
    },
    "Madhya Pradesh": {
        "crafts": ["Chanderi Silk", "Maheshwari Sarees", "Gond Art", "Bagh Block Printing", "Dhokra"],
        "culture": "Khajuraho temples, Sanchi Stupa, Gond tribal culture. Sacred Narmada river. Malwa and Bundeli heritage.",
        "products": ["Chanderi silk-cotton lightweight sarees called woven air", "Maheshwari silk-cotton sarees", "Gond dot-work paintings"],
        "gi": ["Chanderi Saree", "Maheshwari Saree", "Bagh Print"],
        "clusters": ["Chanderi — 220km from Bhopal", "Maheshwar on Narmada river", "Bagh village near Dhar"],
        "history": "Chanderi fabric is so fine it is called woven air — a saree can pass through a finger ring. Maheshwari weaving was revived by Queen Ahilyabai Holkar in the 18th century.",
        "visit": "Maheshwar is a stunning heritage town on Narmada. Weavers work in riverside workshops.",
    },
    "Bihar": {
        "crafts": ["Madhubani Painting", "Sikki Grass Craft", "Sujni Embroidery", "Manjusha Art", "Tikuli Art"],
        "culture": "Birthplace of Buddhism (Bodh Gaya) and Jainism (Vaishali). Nalanda world's first university. Chhath Puja sun worship. Maithili culture.",
        "products": ["Madhubani paintings on paper & silk", "Sikki golden grass dolls & baskets", "Sujni embroidered quilts"],
        "gi": ["Madhubani Painting", "Sujni Embroidery"],
        "clusters": ["Jitwarpur village — 25km from Madhubani town", "Ranti village for Madhubani painting", "Bhagalpur for Manjusha art"],
        "history": "Madhubani painting was discovered by William Archer after the 1934 earthquake. Traditionally painted on freshly plastered mud walls by women. Natural dyes from plants, minerals and soot.",
        "visit": "Jitwarpur and Ranti villages — every home is a studio. Madhubani Railway Station walls are entirely painted.",
    },
    "Assam": {
        "crafts": ["Muga Silk", "Mekhela Chador", "Bamboo Crafts", "Bell Metal Craft", "Cane Work"],
        "culture": "Bihu festival three times a year. Sattriya classical dance. Brahmaputra river. One-horned rhinos. Tea culture.",
        "products": ["Muga silk sarees with natural golden sheen", "Mekhela chador two-piece silk ensemble", "Bamboo and cane furniture"],
        "gi": ["Muga Silk", "Assam Tea"],
        "clusters": ["Sualkuchi — Manchester of Assam, 35km from Guwahati", "Sarthebari for bell metal", "Majuli island for bamboo & mask crafts"],
        "history": "Muga silk is the only naturally golden silk in the world. Produced exclusively in Assam from Antheraea assamensis silkworm. Gets more lustrous with age — can last 100+ years.",
        "visit": "Sualkuchi is one long weaving street — every house has a loom. Majuli is the world's largest river island.",
    },
    "Kerala": {
        "crafts": ["Coir Weaving", "Aranmula Metal Mirror", "Kasavu Weaving", "Kathakali Costume Craft", "Wood Carving"],
        "culture": "Onam festival, Kathakali and Mohiniyattam dance, Kalaripayattu martial art. Backwaters and spice trade heritage. God's Own Country.",
        "products": ["Coir door mats & floor rugs", "Aranmula Kannadi metal mirrors", "Kasavu off-white sarees with gold border"],
        "gi": ["Aranmula Kannadi", "Coir Products", "Kasaragod Saree"],
        "clusters": ["Aranmula near Pathanamthitta for metal mirror", "Chendamangalam for kasavu weaving", "Alleppey for coir"],
        "history": "Aranmula Kannadi made from a secret alloy known only to a few families. Unlike glass mirrors it reflects without distortion and never tarnishes.",
        "visit": "Aranmula 20km from Changanacherry. Chendamangalam Weaving Cooperative near Kochi. Best: September–February.",
    },
    "Jammu & Kashmir": {
        "crafts": ["Pashmina Shawl", "Papier-Mâché", "Kashmiri Carpet", "Sozni Embroidery", "Walnut Wood Carving"],
        "culture": "Himalayan and Central Asian confluence. Sufi music, Rouf dance, Shikara culture on Dal Lake. Mughal gardens.",
        "products": ["Hand-spun Pashmina from Changra goat wool", "Papier-mâché lacquered decorative boxes", "Hand-knotted Kashmiri silk and wool carpets"],
        "gi": ["Kashmir Pashmina", "Kashmir Sozni", "Kashmir Walnut Wood Carving"],
        "clusters": ["Srinagar — Dal Lake area for most crafts", "Kanihama for Kani shawls", "Leh for Pashmina sourcing"],
        "history": "Pashmina comes from the Changra goat of Ladakh at 4000m altitude. The goat sheds its coat naturally in spring — it is combed not sheared. A single shawl takes 180 hours.",
        "visit": "Srinagar old city workshops open to walk in. Craft Development Institute for carpet weaving. Best: May–September.",
    },
    "Punjab": {
        "crafts": ["Phulkari Embroidery", "Punjabi Jutti", "Durrie Weaving", "Shawl Weaving", "Pottery"],
        "culture": "Bhangra and Giddha folk dances. Golden Temple in Amritsar world's most visited site. Lohri, Baisakhi festivals. Sufi music tradition.",
        "products": ["Phulkari floral embroidery on hand-spun cotton", "Handcrafted Punjabi leather juttis with thread work", "Patiala salwar"],
        "gi": ["Phulkari", "Punjab Basmati"],
        "clusters": ["Patiala for Phulkari & Jutti", "Amritsar city for shawls and handicrafts"],
        "history": "Phulkari (flower work) was made by Punjabi women for trousseau. Bagh style covers the fabric completely. A Bagh trousseau could take 3 years to complete.",
        "visit": "Patiala old city bazaars. Amritsar Hall Bazaar near Golden Temple.",
    },
    "Himachal Pradesh": {
        "crafts": ["Kullu Shawls", "Chamba Rumal", "Kangra Miniature Painting", "Thangka Painting", "Wood Carving"],
        "culture": "Snow-capped Himalayan peaks, apple orchards, deodar forests. Hindu and Buddhist traditions. Kullu Dussehra brings 200+ local deities. Himachali Nati dance.",
        "products": ["Kullu shawls with geometric patterns in pure wool", "Chamba Rumal double-sided embroidery", "Kangra miniature paintings with natural pigments"],
        "gi": ["Kullu Shawl", "Chamba Rumal", "Kangra Tea"],
        "clusters": ["Kullu Valley for shawl weaving", "Chamba town for Rumal", "Kangra for miniature painting", "Dharamsala (McLeod Ganj) for Thangka"],
        "history": "Chamba Rumal double-sided embroidery has no wrong side — both faces look identical. Takes decades to master. Kullu shawls woven from Angora rabbit and local sheep wool on pit looms.",
        "visit": "Kullu town has government craft emporium and arranges weaver visits. Chamba 120km from Pathankot.",
    },
}

CRAFTTRAIL_GENERAL = """
CraftTrail is India's craft discovery platform.
It maps 744+ Government of India recognised handicraft clusters and connects travellers with verified artisans.
India has 3000+ distinct craft forms, 64.66 lakh (6.5 million) artisans — 64% of them women.
There are 500+ GI (Geographical Indication) tagged products protecting traditional regional crafts.

CraftTrail's 3-tier trust system:
- Tier 1: OCR reads the Pehchan/GI card and verifies the craft against the GI registry — score up to 40
- Tier 2: An SHG/cooperative vouches in person — score up to 60  
- Tier 3: Verified by real visitor reviews — up to 100
A score of 60+ means the artisan has been physically verified.

Workshop booking process:
- Create a free account on CraftTrail
- Find an artisan on the Discover map
- Click Request a visit
- The artisan confirms via WhatsApp — the channel artisans already use
- 95% of every booking amount goes directly to the artisan
- 5% sustains the SHG that vouched for them
- Artisans never need to install any app

After completing a workshop visit, CraftTrail issues a digital certificate with a unique QR code.
It is a permanent proof that you visited a verified artisan — shareable as a link forever.

Pehchan card: Government of India identity card issued to verified artisans.
GI (Geographical Indication) tag: Legal protection for traditional products from a specific region. Only artisans from the registered regions can sell under these names.
"""


def ingest_state_knowledge():
    print("\n[1/4] Ingesting built-in state knowledge...")
    count = 0
    # General CraftTrail info
    chunks = splitter.split_text(CRAFTTRAIL_GENERAL)
    count += add_chunks(chunks, "crafttrail_general", {"source": "built_in", "type": "general"})

    for state, info in STATE_KNOWLEDGE.items():
        text = f"""
State: {state}
Crafts: {', '.join(info['crafts'])}
Culture: {info['culture']}
Products: {', '.join(info['products'])}
GI Tagged crafts: {', '.join(info['gi'])}
Craft Clusters: {', '.join(info['clusters'])}
History: {info['history']}
Visit Information: {info['visit']}
""".strip()
        chunks = splitter.split_text(text)
        slug = state.lower().replace(" ", "_").replace("&", "and")
        count += add_chunks(chunks, f"state_{slug}", {"source": "built_in", "type": "state", "state": state})

    print(f"   ✅ {count} chunks from state knowledge")
    return count


def ingest_mongodb():
    """Pull artisan profiles from MongoDB and embed them."""
    print("\n[2/4] Ingesting MongoDB artisan profiles...")
    try:
        from pymongo import MongoClient
        mongo = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        mongo.server_info()   # will throw if not reachable
        db = mongo["crafttrail"]

        artisans = list(db.artisans.find({}, {
            "name": 1, "craft": 1, "state": 1, "district": 1,
            "bio": 1, "trustScore": 1, "availability": 1, "languages": 1,
            "workshop": 1, "cluster": 1, "_id": 0
        }))
        clusters = list(db.clusters.find({}, {
            "name": 1, "craft": 1, "state": 1, "district": 1,
            "heritageNote": 1, "_id": 0
        }))

        count = 0
        for i, a in enumerate(artisans):
            text = f"""
Artisan Name: {a.get('name', 'Unknown')}
Craft: {a.get('craft', '')}
State: {a.get('state', '')}
District: {a.get('district', '')}
Bio: {a.get('bio', '')}
Trust Score: {a.get('trustScore', 0)}/100
Availability: {a.get('availability', {}).get('state', 'unknown') if isinstance(a.get('availability'), dict) else ''}
Languages: {', '.join(a.get('languages', []))}
Workshop: {a.get('workshop', {}).get('title', '') if isinstance(a.get('workshop'), dict) else ''}
Workshop Duration: {a.get('workshop', {}).get('durationMins', '') if isinstance(a.get('workshop'), dict) else ''} minutes
Workshop Price: Rs {a.get('workshop', {}).get('priceInr', '') if isinstance(a.get('workshop'), dict) else ''} per person
""".strip()
            chunks = splitter.split_text(text)
            count += add_chunks(chunks, f"artisan_{i}", {"source": "mongodb", "type": "artisan", "state": a.get("state", "")})

        for i, c in enumerate(clusters):
            text = f"""
Cluster Name: {c.get('name', '')}
Craft: {c.get('craft', '')}
State: {c.get('state', '')}
District: {c.get('district', '')}
Heritage: {c.get('heritageNote', '')}
""".strip()
            chunks = splitter.split_text(text)
            count += add_chunks(chunks, f"cluster_{i}", {"source": "mongodb", "type": "cluster"})

        print(f"   ✅ {count} chunks from MongoDB ({len(artisans)} artisans, {len(clusters)} clusters)")
        return count

    except Exception as e:
        print(f"   ⚠️  MongoDB not reachable ({e}) — skipping. Start the server to include artisan data.")
        return 0


def parse_tabular_rows(text: str) -> list[str] | None:
    """Try to parse TSV/CSV-style rows into structured text records."""
    if "\t" not in text and "," not in text:
        return None
    try:
        delimiter = "\t" if "\t" in text else ","
        reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
        if not reader.fieldnames:
            return None
        rows = []
        for row in reader:
            if not row:
                continue
            cleaned = {k: (v.strip() if isinstance(v, str) else v) for k, v in row.items() if k}
            if not any(str(v).strip() for v in cleaned.values() if v is not None):
                continue
            row_text = " | ".join([f"{k}: {v}" for k, v in cleaned.items() if v is not None and str(v).strip()])
            rows.append(row_text)
        return rows if rows else None
    except Exception:
        return None


def ingest_files():
    """Load PDF, CSV, TXT files from ./data/ directory."""
    print("\n[3/4] Ingesting files from ./data/ ...")
    DATA_DIR.mkdir(exist_ok=True)
    count = 0

    # ── PDF files ──────────────────────────────────────────────────
    pdf_files = list(DATA_DIR.glob("*.pdf"))
    if pdf_files:
        from langchain_community.document_loaders import PyPDFLoader
        for pdf in pdf_files:
            try:
                loader = PyPDFLoader(str(pdf))
                pages  = loader.load()
                for j, page in enumerate(pages):
                    chunks = splitter.split_text(page.page_content)
                    count += add_chunks(chunks, f"pdf_{pdf.stem}_p{j}", {"source": str(pdf.name), "type": "pdf"})
                print(f"   📄 {pdf.name} — {len(pages)} pages")
            except Exception as e:
                print(f"   ❌ {pdf.name} failed: {e}")

    # ── TXT / Markdown / tab-separated files ───────────────────────
    txt_files = list(DATA_DIR.glob("*.txt")) + list(DATA_DIR.glob("*.md")) + list(DATA_DIR.glob("*.tsv")) + list(DATA_DIR.glob("*.tab"))
    for txt in txt_files:
        try:
            text = txt.read_text(encoding="utf-8", errors="ignore")
            rows = parse_tabular_rows(text)
            if rows:
                for idx, row_text in enumerate(rows):
                    chunks = splitter.split_text(row_text)
                    count += add_chunks(chunks, f"txt_{txt.stem}_row{idx}", {"source": str(txt.name), "type": "text", "format": "table"})
                print(f"   📝 {txt.name} — {len(rows)} structured rows")
            else:
                chunks = splitter.split_text(text)
                count += add_chunks(chunks, f"txt_{txt.stem}", {"source": str(txt.name), "type": "text"})
                print(f"   📝 {txt.name} — {len(chunks)} chunks")
        except Exception as e:
            print(f"   ❌ {txt.name} failed: {e}")

    # ── CSV / Excel files ──────────────────────────────────────────
    csv_files = list(DATA_DIR.glob("*.csv")) + list(DATA_DIR.glob("*.xlsx"))
    if csv_files:
        import pandas as pd
        for csv in csv_files:
            try:
                df = pd.read_csv(csv) if csv.suffix == ".csv" else pd.read_excel(csv)
                # Convert each row to a readable text block
                texts = []
                for _, row in df.iterrows():
                    row_text = " | ".join([f"{col}: {val}" for col, val in row.items() if str(val) != "nan"])
                    texts.append(row_text)
                all_text = "\n".join(texts)
                chunks   = splitter.split_text(all_text)
                count   += add_chunks(chunks, f"csv_{csv.stem}", {"source": str(csv.name), "type": "csv"})
                print(f"   📊 {csv.name} — {len(df)} rows")
            except Exception as e:
                print(f"   ❌ {csv.name} failed: {e}")

    if not (pdf_files or txt_files or csv_files):
        print("   ℹ️  No files found in ./data/ — drop PDF, TXT, or CSV files there and re-run.")

    print(f"   ✅ {count} chunks from files")
    return count


def ingest_json_export():
    """Load pre-exported JSON knowledge files."""
    print("\n[4/4] Checking for JSON exports...")
    json_files = list(DATA_DIR.glob("*.json"))
    count = 0
    for jf in json_files:
        try:
            data = json.loads(jf.read_text())
            if isinstance(data, list):
                for i, item in enumerate(data):
                    text   = json.dumps(item, ensure_ascii=False)
                    chunks = splitter.split_text(text)
                    count += add_chunks(chunks, f"json_{jf.stem}_{i}", {"source": str(jf.name), "type": "json"})
            elif isinstance(data, dict):
                text   = json.dumps(data, ensure_ascii=False)
                chunks = splitter.split_text(text)
                count += add_chunks(chunks, f"json_{jf.stem}", {"source": str(jf.name), "type": "json"})
            print(f"   📦 {jf.name} — {count} chunks")
        except Exception as e:
            print(f"   ❌ {jf.name} failed: {e}")
    return count


if __name__ == "__main__":
    print("=" * 60)
    print("  CraftTrail RAG — Knowledge Ingestion")
    print("=" * 60)

    total = 0
    total += ingest_state_knowledge()
    total += ingest_mongodb()
    total += ingest_files()
    total += ingest_json_export()

    final_count = collection.count()
    print(f"\n{'=' * 60}")
    print(f"  ✅ Ingestion complete!")
    print(f"  📚 Total vectors in ChromaDB: {final_count}")
    print(f"  📁 DB saved at: {os.path.abspath(CHROMA_PATH)}")
    print(f"{'=' * 60}")
    print("\nNow start the Flask server:  python app.py")
