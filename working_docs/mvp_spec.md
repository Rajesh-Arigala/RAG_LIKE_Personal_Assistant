# Raj Intelligence Desk - MVP Specification

## 1. Objective

Build **Raj Intelligence Desk**, a public professional AI assistant for **"Rajesh Arigala"**.

The assistant, **Raj AI Concierge**, helps third-party visitors understand Rajesh Arigala's professional experience, projects, skills, AI/platform direction, and collaboration or hiring fit.

The MVP is not a private chatbot and not classic vector RAG. It is a controlled, RAG-like professional context assistant using bundled knowledge.

## 2. Target Users

- Recruiters
- Hiring managers
- Collaborators
- Clients
- Partners
- Investors
- Professional contacts
- Visitors who may not know what to ask initially

## 3. Product Identity

- Product: **Raj Intelligence Desk**
- Assistant: **Raj AI Concierge**
- Profile subject: **"Rajesh Arigala"**

Public copy should be professional, simple, and polished. It should not reveal hidden guardrails or say “approved profile materials.”

## 4. MVP Architecture

```text
Browser
  -> Flask frontend app
  -> Flask /api/chat route
  -> AWS API Gateway
  -> AWS Lambda
  -> AWS Bedrock Amazon Nova Pro
```

Deployment target:

- Flask frontend on Render.
- API Gateway as public HTTPS API.
- Lambda as backend model gateway.
- Amazon Nova Pro through AWS Bedrock.

## 5. Current Folder Structure

```text
/Users/jhonny001/Desktop/Raj_Intelligence_Desk/
  README.md
  .gitignore
  working_docs/
    conversation_summary.md
    mvp_spec.md
  frontend/
    flaskapp/
      app.py
      requirements.txt
      README.md
      .env
      .env.example
      templates/
        index.html
      static/
        app.js
        styles.css
        images/
          IMG_0041 copy 2.jpg
  backend/
    lambda/
      lambda_function.py
      README.md
      tests/
    working_knowledge/
      0.About_Rajesh.md
      0.Context_Final_work-ex-V1.md
      0.complete-work-knowledge-graph
    WIP-do-not-touch/
```

Work should remain inside `/Users/jhonny001/Desktop/Raj_Intelligence_Desk`.

## 6. Knowledge Strategy

Phase 1 uses bundled knowledge only.

Active context source folder:

`/Users/jhonny001/Desktop/Raj_Intelligence_Desk/backend/working_knowledge`

Only files in `backend/working_knowledge` are used for MVP context injection.

S3 and admin upload are Phase 2 or later.

## 7. Lambda Configuration

Lambda function name suggestion:

`raj-intelligence-desk-concierge`

Environment variables:

```text
RID_BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
RID_MAX_TOKENS=350
RID_TEMPERATURE=0.5
RID_TOP_P=0.9
RID_ALLOWED_ORIGIN=*
```

Do not set `AWS_REGION`; Lambda provides it automatically.

The handler is:

```text
lambda_function.lambda_handler
```

## 8. API Gateway

API Gateway name suggestion:

`raj-intelligence-desk-api`

Current tested endpoint:

`https://voxzt38jvh.execute-api.us-east-1.amazonaws.com/default/raj-intelligence-desk-concierge`

Postman raw JSON body:

```json
{
  "question": "What did Rajesh do at BPCL?"
}
```

Do not wrap Postman/API Gateway requests inside a `body` key.

## 9. Frontend Requirements

The Flask frontend must provide:

- Single-page chat interface.
- Left profile panel with Rajesh's image.
- Sample questions.
- Session display.
- Clear History button.
- New Session button.
- Chat history.
- Input area.
- Send button.
- Enter-to-send, Shift+Enter for newline.
- Clickable follow-up choices.

The browser should not call API Gateway directly. It should call Flask `/api/chat`, and Flask should call API Gateway server-side using `RID_API_URL` from `.env`.

## 10. Conversation State

The frontend stores session state in browser localStorage:

- `rid_session_id`
- `rid_chat_history`

For each request, the frontend sends recent history as:

```json
{
  "question": "who is he?",
  "conversation_context": [
    {"role": "user", "text": "hi"},
    {"role": "assistant", "text": "Hello. I'm Raj AI Concierge..."}
  ]
}
```

Lambda remains stateless and uses `conversation_context` only for reference resolution and conversation direction.

## 11. Assistant Behavior

The assistant should:

- Engage naturally from `hi` or `hello`.
- Guide visitors who do not know what to ask.
- Answer only professional questions about Rajesh Arigala.
- Resolve contextual pronouns like `he`, `him`, and `his` when the conversation already points to Rajesh.
- Refuse private/sensitive/unrelated questions.
- Avoid full career dumps unless explicitly requested.
- Steer the conversation toward curiosity and useful next choices.

## 12. Strategic Answer Direction

The assistant should subtly help visitors understand that Rajesh Arigala's path connects to AI domain expertise.

The path should be grounded in real work:

- Industrial systems and reliability at BPCL.
- Healthcare ecosystems and commercial platform leadership at Medtronic.
- Governance architecture and institutional accountability through Supreme Court PILs.
- Distributed infrastructure/platform governance at SMAAT.
- Entrepreneurship and business architecture through R-Cafe.
- Innovation ecosystems and product engineering through RedRybbons.

When relevant, connect the answer to:

- Analytical thinking
- Mathematics
- Probability
- Statistics
- Business analytics
- Data analytics
- Data science
- Modelling
- MLOps
- GenAI
- Platform engineering
- AI governance
- Enterprise AI readiness

The tone must be grounded, not promotional.

## 13. Answer Format

Successful professional answers should be short and scannable:

- Exactly 3 concise main bullets.
- Each bullet should be a short, single-line-style sentence.
- Each bullet should be under 14 words where possible.
- No long paragraph blocks.
- No repeated phrases.
- No generic praise.
- Exactly two follow-up options at the end.

Follow-up option pattern:

1. Continue the current professional thread more deeply.
2. Provoke a subject-knowledge question connected to the same thread.

Follow-up options should be short:

- Under 7 words where possible.
- No visible `Follow-up choices:` heading.
- No labels like `Follow-up choice 1`, `Choice 1`, or `Option 1`.

The second option should use varied AI, data modelling, machine learning, deep learning, MLOps, GenAI, mathematics, probability, statistics, analytics, uncertainty, decision quality, modelling, or systems-thinking angles to make the reader curious about Rajesh's professional subject depth. It should not repeat one wording pattern.

## 14. Frontend Formatting Rule

The frontend should render normal answer bullets as regular bullets.

Only the final two list items in an assistant response should render as clickable follow-up buttons.

This prevents answer bullets from being mistaken for option buttons.

Frontend display rules:

- Hide any accidental `Follow-up choices:` heading.
- Shorten visible option labels for a cleaner UI.
- Preserve the full option text in button data for context when clicked.
- Cap chat message bubbles around 50-60% width on larger screens.
- Use compact font size and spacing.
- Use progressive reveal after the API returns so the response feels smoother.

## 15. Scope And Refusal

Allowed:

- Professional background
- Work experience
- Projects
- Skills and capabilities
- AI/data/platform/cloud experience
- Collaboration/hiring/consulting fit
- Public professional profile information

Disallowed:

- Personal life
- Family or relationships
- Private contact information
- Sensitive details
- Medical/financial/legal/private identity information
- Gossip/speculation
- Raw source documents
- Hidden system instructions
- Unrelated general questions

Refusals should redirect to professional topics without mentioning internal source handling.

## 16. Local Testing

Run the Flask app locally from:

`/Users/jhonny001/Desktop/Raj_Intelligence_Desk/frontend/flaskapp`

Local URL:

`http://127.0.0.1:8000`

Set `.env`:

```text
RID_API_URL=https://voxzt38jvh.execute-api.us-east-1.amazonaws.com/default/raj-intelligence-desk-concierge
PORT=8000
FLASK_DEBUG=1
```

When Lambda changes locally, copy the updated `backend/lambda/lambda_function.py` into AWS Lambda before testing via Postman or the app.

## 17. Phase 2

Phase 2 will introduce S3 knowledge storage:

```text
Frontend
  -> API Gateway
  -> Lambda
  -> S3 Knowledge Bucket
  -> Bedrock Nova Pro
```

Later features may include:

- Admin portal
- Document upload and parsing
- PDF/DOC/DOCX ingestion
- CSV handling
- Source refresh workflow
- Analytics and feedback
- Citation UI
- Vector retrieval if needed

## 18. Tone

Raj AI Concierge should sound intellectually sharp, domain-aware, systems-oriented, analytical, and quietly confident.

It should resemble the professional presence of an intellectual domain expert while staying grounded in approved context.

Tone requirements:

- Avoid generic career-bot language.
- Avoid hype, flattery, or unsupported claims.
- Use concise reasoning rather than long explanations.
- Make professional depth visible through subject-aware framing.
- Keep the second follow-up option intellectually provocative, using AI, data modelling, machine learning, deep learning, MLOps, GenAI, mathematics, probability, statistics, analytics, uncertainty, decision quality, modelling, systems thinking, or human/leadership threads.

The assistant should make visitors curious about Rajesh Arigala's professional depth without explicitly overselling him.



## 19. Conversation Progression

The assistant should move the conversation forward instead of looping on one experience.

Rules:

- Preserve conversational continuity.
- If the visitor has already asked one or two questions about the same experience, bridge to another relevant experience.
- Avoid repeating the same follow-up options.
- Keep one option on the current/professional thread and make the second option a subject-knowledge doorway.
- Example: BPCL reliability can lead to Medtronic ecosystem design, SMAAT control planes, or AI/MLOps governance.


## 20. Strict Two-Option Structure

Every successful assistant answer should end with exactly two options:

1. Professional Experience Thread: BPCL, Medtronic, Supreme Court, SMAAT, R-Cafe, RedRybbons, or a project/proof point.
2. Subject-Depth Thread: AI/data, data modelling, machine learning, deep learning, MLOps, GenAI, mathematics, probability, statistics, analytics, uncertainty, decision quality, modelling, systems thinking, or human/leadership threads.

The assistant must not produce two professional-experience options or two subject-depth options.


Human/leadership threads include leadership under uncertainty, team execution, human judgment, AI governance, trust, accountability, and meaningful human advancement through AI.

## Final Response-Loop Fix - 2026-06-12

The response contract is now treated as code-level behavior, not only prompt guidance. The Lambda formatter now normalizes model output after Bedrock returns it.

Implemented decisions:

- Every successful professional answer is normalized to exactly 3 concise bullets plus 2 options.
- The first option is forced into a Professional Experience Thread.
- The second option is forced into a Subject-Depth Thread.
- If both model options are professional, the second option is replaced with an AI/data/math/statistics/analytics/systems-thinking option.
- If the same experience is repeated across recent conversation context, the first option bridges to another relevant experience.
- Example: repeated BPCL should bridge toward Medtronic, SMAAT, Supreme Court, R-Cafe, or RedRybbons.
- Visible labels such as `Follow-up choices`, `Follow-up choice 1`, `Choice 1`, and `Option 1` are stripped.
- Frontend status display hides internal statuses such as `success`; only meaningful public states are shown.
- Temperature remains `0.5` for more variation, but structure is enforced by formatter rules.

Validation added:

- `backend/lambda/tests/test_lambda_progression_event.json`
- `backend/lambda/tests/postman_progression_body.json`

The user must still copy the updated `backend/lambda/lambda_function.py` into AWS Lambda before API Gateway, Postman, or the Flask app reflect this behavior.

