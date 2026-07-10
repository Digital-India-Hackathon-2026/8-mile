"""
retriever.py — CraftTrail RAG Query Engine
==========================================
Handles: ChromaDB semantic search + Groq LLM generation
"""

import os
from dotenv import load_dotenv

load_dotenv()

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from groq import Groq

CHROMA_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
COLLECTION   = "crafttrail_knowledge"
MODEL        = "llama-3.3-70b-versatile"   # Active Groq model as of July 2025

# ── Clients ───────────────────────────────────────────────────────────
embedding_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
groq_client   = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """You are CraftBot, the official AI assistant for CraftTrail — India's craft discovery platform.

CraftTrail maps 744+ Government of India recognised handicraft clusters and connects travellers with verified artisans.
You help users learn about:
- Indian crafts, cultural heritage, and artisan stories
- GI (Geographical Indication) tags and verification
- Booking workshops and planning visits to craft villages
- Specific artisans and their crafts on the CraftTrail platform

RULES:
1. Answer ONLY from the provided context. If context has the answer, give it confidently and completely.
2. If the context does not contain the answer, say: "I don't have that specific information. Try asking about a specific state, craft, or artisan on CraftTrail."
3. Be warm, informative, and enthusiastic about Indian craft traditions.
4. Keep answers concise but complete — 2-4 paragraphs maximum.
5. When listing crafts or clusters, use bullet points for readability.
6. Never make up information that isn't in the context.
"""


def get_collection():
    """Return the ChromaDB collection, or None if not initialized."""
    try:
        return chroma_client.get_collection(
            name=COLLECTION,
            embedding_function=embedding_fn,
        )
    except Exception:
        return None


def retrieve(question: str, top_k: int = 6) -> list[str]:
    """Semantic search — return top_k most relevant chunks."""
    collection = get_collection()
    if not collection:
        return []

    count = collection.count()
    if count == 0:
        return []

    results = collection.query(
        query_texts=[question],
        n_results=min(top_k, count),
        include=["documents", "distances"],
    )
    docs = results.get("documents", [[]])[0]
    return [d for d in docs if d and d.strip()]


def generate(question: str, context_chunks: list[str], chat_history: list[dict] = None) -> str:
    """Call Groq with retrieved context and return the answer."""
    if not GROQ_API_KEY or GROQ_API_KEY.startswith("gsk_PASTE"):
        return (
            "⚠️ Groq API key not configured. Please add your `gsk_...` key to `rag/.env`. "
            "Get it free at https://console.groq.com"
        )

    context = "\n\n---\n\n".join(context_chunks) if context_chunks else "No relevant context found."

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Include recent chat history for follow-up questions
    if chat_history:
        for msg in chat_history[-6:]:   # last 3 turns
            messages.append(msg)

    messages.append({
        "role": "user",
        "content": f"Context from CraftTrail knowledge base:\n{context}\n\nQuestion: {question}"
    })

    try:
        response = groq_client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.3,   # low temp = more factual, less creative
            max_tokens=1024,
            stream=False,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        err = str(e)
        if "invalid_api_key" in err or "401" in err:
            return (
                "❌ Invalid Groq API key. Your key should start with `gsk_` — "
                "the `org_` ID is not an API key. Get the correct key at https://console.groq.com → API Keys."
            )
        return f"I encountered an error: {err}. Please try again."


def answer(question: str, context: str = "", chat_history: list[dict] = None) -> dict:
    """
    Main RAG pipeline:
    1. Retrieve relevant chunks from ChromaDB
    2. Optionally prepend extra context (e.g. state name, artisan name from the UI)
    3. Call Groq LLM
    4. Return answer + sources info
    """
    # Semantic retrieval
    chunks = retrieve(question, top_k=6)

    # Prepend UI context (state/artisan info passed from React) as first chunk
    if context and context.strip():
        chunks = [context.strip()] + chunks

    if not chunks:
        return {
            "answer": (
                "I don't have enough information indexed yet. "
                "Run `python ingest.py` in the rag/ folder to build the knowledge base, "
                "then ask me again!"
            ),
            "sources": [],
            "retrieved": 0,
        }

    answer_text = generate(question, chunks, chat_history)

    return {
        "answer": answer_text,
        "sources": [],
        "retrieved": len(chunks),
    }


def status() -> dict:
    """Return current knowledge base stats."""
    collection = get_collection()
    if not collection:
        return {"indexed": 0, "ready": False, "message": "Not initialized. Run python ingest.py"}
    count = collection.count()
    return {
        "indexed": count,
        "ready": count > 0,
        "message": f"{count} chunks indexed in ChromaDB" if count > 0 else "Empty. Run python ingest.py",
        "model": MODEL,
        "groq_configured": bool(GROQ_API_KEY and not GROQ_API_KEY.startswith("gsk_PASTE")),
    }
