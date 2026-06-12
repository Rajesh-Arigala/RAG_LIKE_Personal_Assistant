# Raj Intelligence Desk Flask Frontend

Public Flask frontend for Raj AI Concierge.

## Local Environment

Create a local `.env` file from `.env.example`:

```text
RID_API_URL=https://voxzt38jvh.execute-api.us-east-1.amazonaws.com/default/raj-intelligence-desk-concierge
FLASK_DEBUG=1
```

Do not commit `.env`.

## Run Locally

```bash
pip install -r requirements.txt
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

## Render Start Command

```bash
gunicorn app:app
```

## Request Shape

The browser sends this body to API Gateway:

```json
{
  "session_id": "RID-...",
  "question": "What is Rajesh Arigala's professional background?"
}
```

The current Lambda ignores `session_id`, but the frontend includes it so Phase 2 can add session-aware behavior.
