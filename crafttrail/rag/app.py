"""
app.py — CraftTrail RAG Flask Server
=====================================
Start:  python app.py
Port:   5050 (configurable via .env)

Endpoints:
  POST /api/rag/chat     { question, context?, history? }  -> { answer, retrieved }
  POST /api/rag/ingest   {}                                 -> trigger re-ingestion
  GET  /api/rag/status   {}                                 -> { indexed, ready, ... }
"""

import sys, io, os, threading
# Fix Windows terminal encoding so emojis don't crash
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

import retriever

app  = Flask(__name__)
PORT = int(os.getenv("FLASK_PORT", 5050))

CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.route("/api/rag/chat", methods=["POST"])
def chat():
    body     = request.get_json(silent=True) or {}
    question = (body.get("question") or "").strip()
    context  = (body.get("context")  or "").strip()
    history  = body.get("history",   [])

    if not question:
        return jsonify({"error": "question is required"}), 400

    result = retriever.answer(question=question, context=context, chat_history=history)
    return jsonify(result)


@app.route("/api/rag/ingest", methods=["POST"])
def ingest():
    def run_ingest():
        import ingest as ing
        ing.ingest_state_knowledge()
        ing.ingest_mongodb()
        ing.ingest_files()
        ing.ingest_json_export()

    threading.Thread(target=run_ingest, daemon=True).start()
    return jsonify({"message": "Ingestion started. Check /api/rag/status in ~30s."})


@app.route("/api/rag/status", methods=["GET"])
def status():
    return jsonify(retriever.status())


@app.route("/api/rag/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "CraftTrail RAG"})


if __name__ == "__main__":
    st = retriever.status()
    print("\n" + "=" * 55)
    print("  CraftTrail RAG Server")
    print("=" * 55)
    print(f"  Port        : {PORT}")
    print(f"  Groq key    : {'OK - configured' if st['groq_configured'] else 'MISSING - add gsk_ key to .env'}")
    print(f"  Knowledge   : {st['indexed']} chunks indexed")
    if st["indexed"] == 0:
        print("  WARNING: Run  python ingest.py  first!")
    print("=" * 55 + "\n")
    app.run(host="0.0.0.0", port=PORT, debug=False)
