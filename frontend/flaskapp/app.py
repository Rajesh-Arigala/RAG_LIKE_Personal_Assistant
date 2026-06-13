"""Flask frontend for Raj Intelligence Desk."""

from __future__ import annotations

import json
import os
import socket
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
    chat_history = payload.get("chat_history", payload.get("conversation_context"))
    if not isinstance(chat_history, list):
        chat_history = []
    conversation_state = payload.get("conversation_state")
    if not isinstance(conversation_state, dict):
        conversation_state = {}
    if not question:
        return jsonify({
            "status": "validation_error",
            "error": {"message": "Question is required."},
        }), 400

    outbound = json.dumps({
        "question": question,
        "session_id": session_id,
        "chat_history": chat_history,
        "conversation_context": chat_history,
        "conversation_state": conversation_state,
    }).encode("utf-8")
    data, status_code = _call_gateway_with_retry(api_url, outbound)
    return jsonify(data), status_code


def _call_gateway_with_retry(api_url: str, outbound: bytes) -> tuple[dict, int]:
    last_error: dict | None = None
    for attempt in range(2):
        data, status_code = _call_gateway_once(api_url, outbound, timeout=55)
        if status_code < 500:
            return data, status_code
        last_error = data
        if not _is_retryable_error(data, status_code):
            return data, status_code
    return last_error or _error_payload("api_error", "Could not reach Raj Intelligence Desk API.", True), 502


def _call_gateway_once(api_url: str, outbound: bytes, timeout: int) -> tuple[dict, int]:
    api_request = urllib_request.Request(
        api_url,
        data=outbound,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib_request.urlopen(api_request, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
            status_code = response.getcode()
    except error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        status_code = exc.code
    except socket.timeout:
        return _error_payload("api_timeout", "Raj Intelligence Desk API timed out. Please retry.", True), 504
    except Exception as exc:
        return _error_payload("api_error", f"Could not reach Raj Intelligence Desk API: {exc}", True), 502

    try:
        return json.loads(raw or "{}"), status_code
    except json.JSONDecodeError:
        return _error_payload("bad_response", "API returned a non-JSON response.", True, raw[:500]), 502


def _error_payload(error_type: str, message: str, retryable: bool, raw: str | None = None) -> dict:
    payload = {
        "status": "error",
        "error_type": error_type,
        "retryable": retryable,
        "error": {"message": message, "error_type": error_type, "retryable": retryable},
    }
    if raw:
        payload["raw"] = raw
    return payload


def _is_retryable_error(data: dict, status_code: int) -> bool:
    error_info = data.get("error") if isinstance(data, dict) else {}
    error_type = data.get("error_type") or (error_info or {}).get("error_type")
    retryable = data.get("retryable") if "retryable" in data else (error_info or {}).get("retryable")
    return bool(retryable or status_code in {502, 503, 504} or error_type in {"api_timeout", "api_error", "lambda_error", "bedrock_error"})


@app.get("/health")
def health():
    return {"status": "healthy", "service": "raj-intelligence-desk-flaskapp"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
