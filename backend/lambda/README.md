# Raj Intelligence Desk Lambda Test Notes

## Lambda Function

Recommended Lambda function name:

```text
raj-intelligence-desk-concierge
```

Handler:

```text
lambda_function.lambda_handler
```

Runtime:

```text
Python 3.12
```

## Environment Variables

Do not manually add `AWS_REGION`; Lambda provides it automatically.

Use:

```text
RID_BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
RID_MAX_TOKENS=350
RID_TEMPERATURE=0.5
RID_TOP_P=0.9
RID_ALLOWED_ORIGIN=*
```

## IAM Permission

For first testing, the Lambda execution role has `AmazonBedrockFullAccess` attached.

Minimum required Bedrock permission later:

```text
bedrock:InvokeModel
```

## Lambda Console Test Event

Use this event in the Lambda console:

```json
{
  "body": "{\"question\":\"What is Rajesh Arigala's professional background?\"}"
}
```

## Successful Test Result

The Lambda console test succeeded.

Observed result:

```text
statusCode: 200
assistant: Raj AI Concierge
profile: Rajesh Arigala
model: amazon.nova-pro-v1:0
```

Observed runtime from AWS Lambda console:

```text
Duration: 7773.29 ms
Billed duration: 8152 ms
Max memory used: 95 MB
Configured memory: 128 MB
```

This confirms:

- Lambda executed successfully.
- Amazon Bedrock invocation worked.
- Amazon Nova Pro returned a professional answer.
- Embedded context was included in the model request.
- The function stayed within 128 MB memory for the first test.


## Response Formatting Rule

Professional answers should be concise and formatted as bullets, not a long paragraph. The Lambda prompt and formatter enforce exactly 3 short answer bullets, followed by exactly two short clickable follow-up choices.

The two-choice contract is deterministic:

- First option: Professional Experience Thread.
- Second option: Subject-Depth Thread across AI, data, ML, MLOps, GenAI, math, probability, statistics, analytics, systems thinking, or leadership.

If the visitor spends repeated turns on one experience, the first option should bridge to another relevant experience instead of looping.

## API Gateway Plan

Recommended API Gateway name:

```text
raj-intelligence-desk-api
```

Recommended route:

```text
POST /chat
```

Integration target:

```text
raj-intelligence-desk-concierge
```

When calling the API Gateway endpoint, send:

Header:

```text
Content-Type: application/json
```

Body:

```json
{
  "question": "What is Rajesh Arigala's professional background?"
}
```

## Private-Life Refusal Test

Use this body to confirm guardrails:

```json
{
  "question": "What is Rajesh Arigala's personal phone number?"
}
```

Expected behavior:

The assistant should refuse and redirect to professional topics.

## Postman API Gateway Test

Use this after API Gateway is created and connected to the Lambda function.

Method:

```text
POST
```

URL:

```text
https://<api-id>.execute-api.<region>.amazonaws.com/<stage>/chat
```

Header:

```text
Content-Type: application/json
```

Raw JSON body in Postman:

```json
{
  "question": "What is Rajesh Arigala's professional background?"
}
```

Do not wrap this Postman body inside a `body` key. API Gateway will create the Lambda `body` wrapper automatically.

## Updated Test Events - Conversation Context

The Lambda now supports a `conversation_context` parcel. The frontend sends this automatically from browser session history. Lambda does not store chat history itself; it uses the recent context included in each request.

### Lambda Console: Basic Professional Question

File:

```text
backend/lambda/tests/test_lambda_basic_event.json
```

Payload:

```json
{
  "body": "{\"question\": \"What is Rajesh Arigala's professional background?\"}"
}
```

### Lambda Console: Greeting Test

File:

```text
backend/lambda/tests/test_lambda_greeting_event.json
```

Payload:

```json
{
  "body": "{\"question\": \"hi\"}"
}
```

Expected behavior: short welcome response, no profile summary.

### Lambda Console: Conversation Context Follow-Up

File:

```text
backend/lambda/tests/test_lambda_context_event.json
```

This tests a follow-up such as `Tell me more about the first option` using prior chat context.


### Lambda Console: Pronoun Follow-Up Test

File:

```text
backend/lambda/tests/test_lambda_pronoun_followup_event.json
```

This tests a natural visitor follow-up such as `who is he?` after the conversation has already established that `he` refers to Rajesh Arigala.

Expected behavior: the assistant should answer who Rajesh Arigala is professionally, not return the generic redirected message.

### Postman/API Gateway: Basic Body

File:

```text
backend/lambda/tests/postman_basic_body.json
```

Use this as raw JSON body in Postman:

```json
{
  "question": "What is Rajesh Arigala's professional background?"
}
```

### Postman/API Gateway: Conversation Context Body

File:

```text
backend/lambda/tests/postman_context_body.json
```

Use this as raw JSON body in Postman to test contextual follow-ups through API Gateway. Do not wrap it inside a `body` key; API Gateway creates that wrapper before invoking Lambda.

## Current Lambda Environment Variables

Recommended values:

```text
RID_BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
RID_MAX_TOKENS=350
RID_TEMPERATURE=0.5
RID_TOP_P=0.9
RID_ALLOWED_ORIGIN=*
```

Do not manually add `AWS_REGION`; Lambda provides it automatically.


### Lambda Console: Progression / Anti-Loop Test

File:

```text
backend/lambda/tests/test_lambda_progression_event.json
```

This tests a repeated BPCL context. Expected behavior: the next professional option should bridge away from BPCL, while the second option should remain an AI/data/math-style subject-depth option.

### Postman: Progression / Anti-Loop Body

File:

```text
backend/lambda/tests/postman_progression_body.json
```

Use this body directly in Postman. Do not wrap it inside a `body` key.
