# Backend Connection Reference

This frontend is connected to the `ai-chatbot` backend project. Use the backend source code as the source of truth whenever frontend behavior depends on an API contract.

## Workspace Paths

```text
Frontend: D:\proj\ai-assistant-ui
Backend:  D:\proj\ai-chatbot
```

Do not duplicate backend business logic in this frontend. When an endpoint, payload, validation rule, or response shape is unclear, inspect the backend implementation first.

## Backend Source Of Truth

Primary files:

```text
D:\proj\ai-chatbot\src\api\routes.py
D:\proj\ai-chatbot\src\utils\responses.py
D:\proj\ai-chatbot\src\main.py
```

Feature-specific sources:

```text
Agents: D:\proj\ai-chatbot\src\services\agent_profile_service.py
Agent schemas: D:\proj\ai-chatbot\src\schemas\agent_schema.py
Model registry: D:\proj\ai-chatbot\src\ai\models\model_registry.py
Database layer: D:\proj\ai-chatbot\src\database
```

`src/api/routes.py` is authoritative for registered routes, request fields, authentication requirements, query parameters, and HTTP status codes.

## Local Connection

The backend listens on port `8080` by default. The frontend currently connects through:

```env
VITE_API_URL=http://localhost:8080
```

Frontend configuration:

```text
D:\proj\ai-assistant-ui\.env
D:\proj\ai-assistant-ui\src\services\api.ts
```

Backend health checks:

```text
GET http://localhost:8080/
GET http://localhost:8080/health
GET http://localhost:8080/ping
```

Start the backend from `D:\proj\ai-chatbot` with:

```powershell
python -m src.main
```

The backend reads `PORT` when provided and otherwise uses `8080`.

## Authentication

Public endpoints:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
```

Authenticated endpoints require:

```http
Authorization: Bearer <access_token>
```

An absent, invalid, or expired token returns HTTP `401`. The frontend handles authenticated `401` responses centrally in `src/services/api.ts`, clears the stale session, and asks the user to sign in again.

## Response Contract

Successful responses are flat JSON objects. Backend `success_response(data=...)` merges the supplied data into the root object.

Example:

```json
{
  "success": true,
  "agents": []
}
```

It does not return this shape:

```json
{
  "success": true,
  "data": {
    "agents": []
  }
}
```

Successful message-only response:

```json
{
  "success": true,
  "message": "Operation completed"
}
```

Error response:

```json
{
  "error": "Error message"
}
```

Keep frontend response interfaces aligned with these flattened shapes.

## Current API Routes

### Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/me
```

### Chat

```text
POST   /api/chat
GET    /api/chat/conversations
GET    /api/chat/history
DELETE /api/chat/history
POST   /api/chat/feedback
```

`POST /api/chat` accepts:

```json
{
  "message": "Hello",
  "agent_id": "optional-agent-id",
  "conversation_id": "optional-server-conversation-id",
  "client_conversation_id": "optional-client-conversation-id",
  "client_history": []
}
```

The response can include:

```json
{
  "success": true,
  "response": "Assistant response",
  "conversation_id": "conversation-id",
  "user_message": {},
  "assistant_message": {},
  "messages": []
}
```

Chat history supports:

```text
GET /api/chat/history?conversation_id=<id>&limit=30&beforeCreatedAt=<timestamp>&beforeId=<id>
```

History responses include `history`, `items`, `nextCursor`, and `hasMore`.

### Analytics

```text
GET /api/analytics/usage?range=<today|7d|30d|year>
```

The Analytics page uses this endpoint for real conversation reporting. The backend aggregates from `chat_messages` and `chat_conversations`, so the frontend must not fetch full chat history for reporting.

Response shape:

```json
{
  "success": true,
  "report": {
    "range": "7d",
    "startAt": "2026-06-18T00:00:00+00:00",
    "endAt": "2026-06-25T00:00:00+00:00",
    "summary": {
      "totalConversations": 0,
      "totalMessages": 0,
      "userMessages": 0,
      "assistantMessages": 0,
      "estimatedTokens": 0,
      "activeDays": 0,
      "avgMessagesPerConversation": 0
    },
    "dailyUsage": [],
    "roleBreakdown": [],
    "recentActivity": [],
    "topConversations": []
  }
}
```

`estimatedTokens` is calculated from saved message text length. It is a usage estimate, not provider billing telemetry.

### Agents And Models

```text
GET  /api/agents
POST /api/agents
PUT  /api/agents/{agent_id}
POST /api/agents/{agent_id}/activate
GET  /api/models/options
```

Frontend integration:

```text
D:\proj\ai-assistant-ui\src\services\agentApi.ts
D:\proj\ai-assistant-ui\src\types\agent.types.ts
D:\proj\ai-assistant-ui\src\pages\Agents.tsx
```

### Files And Knowledge

```text
POST   /api/files/upload
GET    /api/files
PUT    /api/files/{file_id}
DELETE /api/files/{file_id}
POST   /api/files/sync_to_kb

POST   /api/rag/upload
POST   /api/rag/facts
GET    /api/rag/documents
PUT    /api/rag/documents/{document_id}
DELETE /api/rag/documents/{document_id}
PUT    /api/rag/documents/{document_id}/search-enabled
GET    /api/rag/facts
PUT    /api/rag/facts/{fact_id}
DELETE /api/rag/facts/{fact_id}
```

Uploads use `multipart/form-data`. Do not manually set a multipart boundary; let the browser or Axios generate it.

### Chat Attachment Flow

Chat attachments reuse File Manager storage and knowledge sync; there is no separate chat-upload endpoint.

```text
1. Validate one selected file in the frontend.
2. POST /api/files/upload using multipart/form-data.
3. Read file.id from the upload response.
4. POST /api/files/sync_to_kb with { "file_id": "<file.id>" }.
5. Mark the attachment ready only when sync returns document_id.
6. The uploaded file is then visible through GET /api/files and therefore appears in File Manager.
```

Frontend attachment constraints:

```text
Maximum size: 20MB per chat attachment
Supported types: PDF, DOC, DOCX, CSV, TXT, MD
Concurrent selection: one attachment
```

The backend currently accepts files up to 50MB, but Chat intentionally uses the lower 20MB product limit. Keep this limit centralized in `src/constants/file.constants.ts`.

Legacy Microsoft Word `.doc` files are converted to `.docx` by LibreOffice before entering the normal Docling/`python-docx` extraction pipeline. Docker installs `libreoffice-writer`. Local environments must install LibreOffice or configure `LIBREOFFICE_BIN` with the full path to `soffice`.

Frontend implementation:

```text
src/services/chatAttachmentService.ts
src/hooks/useChatAttachment.ts
src/components/ChatAttachmentChip.tsx
src/store/uploadSlice.ts
```

The shared Redux upload task allows File Manager to represent in-progress work consistently. Do not build a second storage model specifically for Chat.

### Google Drive

Google Drive reuses the File Manager storage model. Drive is a file source, not a separate file system.

```text
GET  /api/integrations/google-drive/status
POST /api/integrations/google-drive/connect
GET  /api/integrations/google-drive/oauth/callback
POST /api/integrations/google-drive/disconnect
GET  /api/google-drive/files?q=<search>&pageToken=<token>
POST /api/google-drive/sync
```

`POST /api/google-drive/sync` accepts:

```json
{
  "drive_file_id": "google-drive-file-id",
  "sync_to_kb": true
}
```

Google Drive sync downloads or exports the selected Drive file, saves it through `upload_service.save_file`, and optionally calls the existing `sync_to_kb` flow. Synced Drive files appear in `GET /api/files` alongside local uploads.

Drive-sourced file fields can include:

```text
source = "google_drive"
source_provider = "google_drive"
source_file_id
source_name
source_mime_type
source_modified_time
source_checksum
source_web_url
last_source_sync_at
```

Backend environment required for OAuth:

```text
FRONTEND_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
GOOGLE_TOKEN_ENCRYPTION_SECRET
GOOGLE_DRIVE_MAX_SYNC_BYTES
```

Google Drive file listing must stay paginated and field-limited. Do not fetch all Drive files into the frontend.

### Settings And Rules

```text
GET    /api/settings
PUT    /api/settings
GET    /api/rules
POST   /api/rules
DELETE /api/rules
```

## Frontend Integration Rules

1. Use `src/services/api.ts` for JSON requests.
2. Put feature-specific endpoint calls in a dedicated service such as `agentApi.ts` or `fileManagerApi.ts`.
3. Define reusable request and response contracts in `src/types`.
4. Never hardcode `http://localhost:8080` in components; use `VITE_API_URL` through `API_URL`.
5. Never read backend secrets from the frontend or expose backend `.env` values.
6. Preserve centralized `401` handling for authenticated requests.
7. Verify the backend route implementation before changing a frontend API type.
8. Keep UI terminology separate from backend identifiers. User-facing labels may change, but fields such as `agent_id`, `use_rag`, and `enabled_tools` must match the backend contract.

## Change Workflow

For work that crosses frontend and backend:

1. Read the relevant handler in `D:\proj\ai-chatbot\src\api\routes.py`.
2. Follow the called backend service and schema where needed.
3. Confirm request fields, response fields, status codes, and auth requirements.
4. Update frontend types before updating components.
5. Keep network access inside the frontend service layer.
6. Run the frontend build:

```powershell
cd D:\proj\ai-assistant-ui
npm run build
```

7. When backend code changes, run its relevant tests or start it and verify `/health` plus the affected endpoint.

## Important Guardrails

- The backend repository is a separate project. Do not move or copy its source into the frontend.
- Do not edit backend files unless the task explicitly includes backend changes.
- Do not treat planning documents as more authoritative than running code.
- Do not commit either project's `.env` file.
- CORS currently allows all origins for development. Restrict it to deployed frontend origins before production.
- Some backend source strings may display mojibake in terminals. Preserve UTF-8 when editing backend files.
