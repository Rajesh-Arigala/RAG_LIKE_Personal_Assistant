"""Flask frontend for Raj Intelligence Desk."""

from __future__ import annotations

import json
import os
from pathlib import Path
from urllib import error, request as urllib_request

from flask import Flask, jsonify, render_template, request

try:
    from dotenv import load_dotenv
except ImportError:  # Render can use real environment variables without python-dotenv.
    load_dotenv = None


BASE_DIR = Path(__file__).resolve().parent
if load_dotenv:
    load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)


@app.get("/")
def index():
    return render_template(
        "index.html",
        product_name="Raj Intelligence Desk",
        assistant_name="Raj AI Concierge",
        profile_name="Rajesh Arigala",
    )


@app.post("/api/chat")
def chat():
    api_url = os.environ.get("RID_API_URL", "").strip()
    if not api_url:
        return jsonify({
            "status": "error",
            "error": {"message": "RID_API_URL is not configured for the Flask app."},
        }), 500

    payload = request.get_json(silent=True) or {}
    question = str(payload.get("question") or "").strip()
    session_id = str(payload.get("session_id") or "").strip()
    conversation_context = payload.get("conversation_context")
    if not isinstance(conversation_context, list):
        conversation_context = []
    if not question:
        return jsonify({
            "status": "validation_error",
            "error": {"message": "Question is required."},
        }), 400

    outbound = json.dumps({
        "question": question,
        "session_id": session_id,
        "conversation_context": conversation_context,
    }).encode("utf-8")
    api_request = urllib_request.Request(
        api_url,
        data=outbound,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib_request.urlopen(api_request, timeout=45) as response:
            raw = response.read().decode("utf-8")
            status_code = response.getcode()
    except error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        status_code = exc.code
    except Exception as exc:
        return jsonify({
            "status": "error",
            "error": {"message": f"Could not reach Raj Intelligence Desk API: {exc}"},
        }), 502

    try:
        data = json.loads(raw or "{}")
    except json.JSONDecodeError:
        return jsonify({
            "status": "error",
            "error": {"message": "API returned a non-JSON response."},
            "raw": raw[:500],
        }), 502

    return jsonify(data), status_code


@app.get("/health")
def health():
    return {"status": "healthy", "service": "raj-intelligence-desk-flaskapp"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
