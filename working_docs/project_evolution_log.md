# Raj Intelligence Desk - Project Evolution Log

## Purpose Of This Log

This document is the chronological memory spine for Raj Intelligence Desk.

It is meant to help a future Codex session understand the project without rereading the full conversation. It captures the story from the first idea through the current implementation, including decisions, problems, roadblocks, fixes, behavioral rules, and next actions.

This is not the product spec. It is the project evolution log: what happened, why it happened, what changed, and what still matters.

## Phase 0 - Original Idea

Raj Intelligence Desk began as a RAG-like personal professional assistant for **"Rajesh Arigala"**.

The original concept was not classic RAG and not ordinary prompt engineering. It sat between both:

- Use curated professional material about Rajesh.
- Let a visitor ask questions naturally.
- Avoid exposing raw documents.
- Avoid answering private or unrelated questions.
- Represent Rajesh professionally to recruiters, collaborators, clients, partners, and professional contacts.

The assistant was intended to behave like Rajesh's AI representative, not like an unrestricted chatbot over private files.

## Phase 1 - Product Identity

The product identity was refined through discussion.

Final naming:

- Product: **Raj Intelligence Desk**
- Assistant: **Raj AI Concierge**
- Profile subject: **"Rajesh Arigala"**

Important public-facing rule:

- The UI should not expose hidden guardrails.
- The UI should not say "approved profile materials".
- The assistant should sound professional, premium, and polished.

## Phase 2 - Architecture Decision

The MVP architecture was locked as:

```text
Browser
  -> Flask frontend app
  -> Flask /api/chat route
  -> AWS API Gateway
  -> AWS Lambda
  -> AWS Bedrock Amazon Nova Pro
```

Deployment intent:

- Flask frontend deployed on Render.
- API Gateway provides the public backend endpoint.
- Lambda invokes Bedrock.
- Amazon Nova Pro is the model.
- Phase 1 bundles knowledge into Lambda.
- S3/admin upload will come in Phase 2 or later.

## Phase 3 - Folder And Source Decisions

The project working folder was created at:

```text
/Users/jhonny001/Desktop/Raj_Intelligence_Desk
```

The active knowledge folder for Phase 1 became:

```text
/Users/jhonny001/Desktop/Raj_Intelligence_Desk/backend/working_knowledge
```

The old source folder was:

```text
/Users/jhonny001/Desktop/Context_Experience_webpages
```

But the active context source for code injection became only `backend/working_knowledge` to keep the GitHub upload clean.

Key structure:

```text
Raj_Intelligence_Desk/
  working_docs/
  frontend/flaskapp/
  backend/lambda/
  backend/working_knowledge/
  backend/WIP-do-not-touch/
```

## Phase 4 - Lambda MVP And AWS Testing

A Lambda function was created with embedded context for Phase 1.

Important AWS learnings:

- Do not set `AWS_REGION` manually in Lambda environment variables because it is reserved by AWS.
- Use `RID_BEDROCK_MODEL_ID=amazon.nova-pro-v1:0`.
- Bedrock permissions were added through `AmazonBedrockFullAccess` during testing.
- Later this can be reduced to least-privilege Bedrock invoke permissions.
- Lambda console test events require a `body` wrapper.
- Postman/API Gateway requests should not include the Lambda `body` wrapper.

Initial Postman body:

```json
{
  "question": "What is Rajesh Arigala's professional background?"
}
```

AWS Lambda and Postman tests confirmed the basic architecture worked.

## Phase 5 - Flask Frontend MVP

A Flask frontend was created under:

```text
/Users/jhonny001/Desktop/Raj_Intelligence_Desk/frontend/flaskapp
```

Frontend capabilities added:

- Single-page chat layout.
- Left profile panel.
- Rajesh image.
- Session ID display.
- Clear History button.
- New Session button.
- Sample questions.
- Input box and Send button.
- Enter-to-send and Shift+Enter for newline.
- Clickable follow-up choices.
- `.env`-based API Gateway endpoint.

The browser calls Flask `/api/chat`; Flask calls API Gateway server-side.

## Phase 6 - Early UI And Conversation Problems

Testing revealed many issues:

- The page initially showed internal guardrail-style text publicly.
- Sample questions were missing or visually weak.
- The chat did not always display responses correctly.
- The layout initially required scrolling where it should fit in one page.
- The assistant answered `hi` with too much profile content.
- Answers were too verbose.
- Follow-up options were not clickable at first.
- Enter-to-send was added after testing.
- The left panel needed Rajesh's image and cleaner layout.

These issues were fixed iteratively in the frontend.

## Phase 7 - Conversation Behavior Strategy

A major product insight emerged: many users will not know what to ask.

The assistant must create curiosity and guide the visitor.

Behavior rules were defined:

- If the visitor says `hi`, do not dump Rajesh's background.
- Greet and offer two clear starting directions.
- Keep the conversation professional.
- Stay away from personal life and sensitive topics.
- Answer about Rajesh's work, experience, skills, collaboration, hiring, and AI direction.
- Do not reveal raw documents or hidden instructions.
- Use follow-up options to steer the visitor.

Strategic direction:

- One option should continue the professional experience thread.
- One option should open an analytical / probability / statistics / AI / data / systems-thinking thread.
- The conversation should subtly show Rajesh as strong in AI, analytics, mathematics, probability, statistics, MLOps, GenAI, and platform thinking.
- This should feel natural, not promotional or fake.

## Phase 8 - Repeated Conversation Failures

Despite prompt improvements, repeated testing showed persistent problems:

- The assistant looped around BPCL.
- Follow-up options repeated.
- The AI connection was too forced.
- Answers were generic and shallow.
- The model sometimes ignored selected options.
- Subject-depth questions such as `Which signals predict failure?` were redirected incorrectly.
- The assistant sometimes repeated broad summaries instead of answering the exact question.
- `success` or model metadata appeared in awkward places.
- The model was expected to manage too many responsibilities at once.

The core diagnosis:

Raw prompt instructions and chat history were not enough.

The conversation needed structured state.

## Phase 9 - Conversation Control Redesign

The design was changed from prompt-heavy to code-controlled.

New principle:

- Code owns route, topic, memory, state, selected option, next options, and validation.
- Model writes only the answer body.
- Lambda assembles the final response.

Routes defined:

- `OUT_OF_SCOPE`
- `GREETING`
- `HIRING_FIT`
- `INTERVIEW_EVALUATION`
- `COLLABORATION_FIT`
- `COMPARISON`
- `AI_TECHNICAL_DEPTH`
- `WORK_EXPERIENCE`
- `PROFESSIONAL_OVERVIEW`
- `GUIDED_DISCOVERY`

Topics defined:

- `BPCL`
- `Medtronic`
- `Supreme Court`
- `SMAAT`
- `R-Cafe`
- `RedRybbons`
- `AI_PLATFORM`
- `MATH_PROBABILITY_STATS`
- `HIRING`
- `INTERVIEW`
- `COLLABORATION`
- `NONE`

Request contract:

```json
{
  "session_id": "RID-...",
  "question": "...",
  "chat_history": [],
  "conversation_state": {}
}
```

Response contract:

```json
{
  "status": "success",
  "assistant": "Raj AI Concierge",
  "profile": "Rajesh Arigala",
  "answer": "...",
  "options": [],
  "conversation_state": {},
  "model_id": "amazon.nova-pro-v1:0",
  "sources": []
}
```

## Phase 10 - Stateful Engine Implementation

The stateful engine was implemented in Lambda, Flask, and frontend.

Implemented behavior:

- Frontend sends `chat_history` and `conversation_state`.
- Flask forwards state and history to API Gateway.
- Lambda decides route/topic/options.
- Lambda returns separate `answer`, `options`, and `conversation_state`.
- Frontend stores state in localStorage.
- Follow-up choices come from `options`, not answer text.
- New session seeds were introduced so every visitor does not always start with BPCL.

Conversation state includes:

- `current_route`
- `current_topic`
- `last_experience_topic`
- `topic_turn_count`
- `total_turn_count`
- `covered_experiences`
- `last_options`
- `selected_option`
- `last_user_intent`
- `comparison_milestones_shown`
- `journey_seed`
- `experience_sequence`

This significantly improved conversation coherence.

## Phase 11 - 7/10 Checkpoint

A later live test showed the conversation had improved.

What worked better:

- The assistant was more coherent.
- It no longer looped only around BPCL.
- Hiring, GenAI, work history, teamwork, and summary questions were answered in scope.
- Follow-up options became cleaner.
- The general architecture felt more stable.

The flow was rated approximately **7/10**.

Remaining issues:

- Intermittent `Load failed` API errors.
- Route-specific follow-ups were still imperfect.
- Answers were sometimes generic.
- Hiring answers were too soft.
- Some current-job answers were vague.
- Team-player answers needed concrete stakeholder examples.
- Answers needed numbers/scores for judgment questions.
- Key user terms needed bold emphasis.
- Follow-up options needed tighter route awareness.

## Phase 12 - Latest Refinement Wave

The next refinement wave addressed API stability, answer quality, visible starter routes, and UI consistency.

Implemented changes:

- Flask now has structured API error handling.
- Flask uses a 55-second API call timeout, below the 1m03s API Gateway limit.
- Flask retries once for retryable errors.
- Frontend now displays a Retry button on failed assistant responses.
- Failed user turns preserve session state for retry.
- Lambda now strengthens hiring intent with `Fit: 100%`.
- Judgment-style answers can include score/confidence lines.
- Keyword emphasis was added using markdown-style bolding.
- Frontend renders bold keywords properly.
- Teamwork/collaboration route detection was expanded.
- GenAI and AI-platform questions route to `AI_PLATFORM` instead of unrelated work experiences.
- Seven left-panel starter questions were added.
- The seven left-panel questions use the same blue visual style as follow-up option buttons.
- JavaScript cache version was bumped to `v=22`.

Seven visible starter questions:

1. What did Rajesh do at BPCL?
2. What did Rajesh do at Medtronic?
3. What did Rajesh learn from Supreme Court work?
4. What did Rajesh build at SMAAT?
5. What did Rajesh execute at R-Cafe?
6. What did Rajesh create at RedRybbons?
7. How does Rajesh's experience connect to AI platforms?

Validation completed:

- Lambda compile passed.
- Flask syntax compile passed.
- Frontend JavaScript syntax check passed.
- Route-quality controller simulation passed.

## Current Files Of Interest

Main implementation files:

- `backend/lambda/lambda_function.py`
- `frontend/flaskapp/app.py`
- `frontend/flaskapp/static/app.js`
- `frontend/flaskapp/static/styles.css`
- `frontend/flaskapp/templates/index.html`

Main documentation files:

- `working_docs/conversation_summary.md`
- `working_docs/mvp_spec.md`
- `working_docs/conversation_contract_and_state_plan.md`
- `working_docs/project_evolution_log.md`

## Current Deployment Status

After the latest changes, deployment requires:

1. Update AWS Lambda with the latest `backend/lambda/lambda_function.py`.
2. Redeploy Render because Flask/frontend files changed.
3. No API Gateway change is needed unless the endpoint path changes.

## Important Locked Rules

Conversation rules:

- Professional-only scope.
- No private life.
- No raw document dumping.
- No hidden guardrail exposure.
- No unsupported claims.
- Answer the exact question first.
- Keep answers concise.
- Use two follow-up options.
- Code generates options.
- Model writes only answer body.
- Use evidence from Rajesh's real experience.
- Use AI/data/math/probability/statistics angles naturally.
- Hiring intent should be confident and strong.
- For judgment questions, use a number/score when appropriate.
- Bold the user's key term when possible.

UI rules:

- Single-page desktop layout.
- Left panel gives all six experience entry points plus one AI entry point.
- Follow-up choices are clickable.
- Enter sends message.
- Retry should be available after API failure.

## Known Roadblocks

- API Gateway has a hard timeout ceiling around 1m03s.
- Bedrock responses can still take time.
- Short answers and model token limits are important for stability.
- Prompting alone did not solve conversation flow.
- Raw chat history alone did not solve memory.
- Structured state is required.
- Route-specific options must remain code-controlled.

## Future Log Format

Append future updates using this format:

```md
## YYYY-MM-DD - Change Title

### What Changed

- ...

### Why It Changed

- ...

### Validation

- ...

### Remaining Issues

- ...

### Next Action

- ...
```

## 2026-06-13 - Log Created

### What Changed

- Created this project evolution log as a chronological handoff document.

### Why It Changed

- Future Codex sessions need a compact but complete story of the project, including decisions, failures, fixes, and current status.

### Validation

- The log captures the project from original idea through the latest API stability and answer-quality refinement wave.

### Remaining Issues

- The latest code changes still need to be deployed to AWS Lambda and Render.
- Live testing should confirm whether the conversation improves beyond the 7/10 checkpoint.

### Next Action

- Deploy the latest Lambda and Render updates, then run a fresh live conversation test.
