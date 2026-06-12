# Raj Intelligence Desk

Public professional AI assistant for "Rajesh Arigala".

## Phase 1 Architecture

```text
Flask Frontend on Render
        |
        v
AWS API Gateway
        |
        v
AWS Lambda
        |
        v
AWS Bedrock - Amazon Nova Pro
```

## Project Structure

```text
Raj_Intelligence_Desk/
  frontend/
    flaskapp/      # Render-deployed Flask frontend
  backend/
    lambda/        # AWS Lambda function for API Gateway + Bedrock
    working_knowledge/
    WIP-do-not-touch/
  working_docs/    # Planning documents
```

## Frontend

```text
frontend/flaskapp
```

Local run:

```bash
cd frontend/flaskapp
pip install -r requirements.txt
python app.py
```

Render start command:

```bash
gunicorn app:app
```

## Backend Lambda

```text
backend/lambda/lambda_function.py
```

Current Phase 1 Lambda uses Option B: embedded context inside the Lambda file for AWS console copy-paste testing.
