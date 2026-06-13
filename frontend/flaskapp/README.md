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

The browser calls Flask `/api/chat`. Flask forwards the request to API Gateway.

The browser now sends chat history and structured conversation state:

```json
{
  "session_id": "RID-...",
  "question": "Which signals predict failure?",
  "chat_history": [
    {"role": "user", "text": "Explore BPCL reliability work."},
    {"role": "assistant", "text": "Previous assistant answer."}
  ],
  "conversation_state": {
    "current_route": "WORK_EXPERIENCE",
    "current_topic": "BPCL",
    "last_experience_topic": "BPCL",
    "topic_turn_count": 1,
    "total_turn_count": 2,
    "covered_experiences": ["BPCL"],
    "last_options": [
      "Explore BPCL reliability work.",
      "Which signals predict failure?"
    ],
    "selected_option": null,
    "last_user_intent": "EXPERIENCE_FOLLOWUP",
    "comparison_milestones_shown": [],
    "journey_seed": "SMAAT",
    "experience_sequence": [
      "SMAAT",
      "BPCL",
      "Medtronic",
      "Supreme Court",
      "R-Cafe",
      "RedRybbons"
    ]
  }
}
```

The frontend stores:

```text
rid_session_id
rid_chat_history
rid_conversation_state
```

The Lambda response contains `answer`, `options`, and updated `conversation_state`. The frontend renders `answer` as bullets and `options` as clickable buttons.
New-session journey behavior:

- The browser creates one random `journey_seed` per new session.
- The generated `experience_sequence` controls the professional thread order.
- Clear History and New Session reset the state and create a fresh seed.

