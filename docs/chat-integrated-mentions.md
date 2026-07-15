# Chat integrated mentions

## Goal

Add source mentions to `/chat` so a user can explicitly control which connected app or stored file the assistant may use for one message.

Typing `@` opens an **Integrated** section containing only sources currently available to that user. Each source uses its own recognizable icon and color.

Initial sources:

| Mention | Meaning | Availability | Selection behavior |
| --- | --- | --- | --- |
| `@Drive` | The user's connected Google Drive account | Show only when Google Drive is connected | Open a searchable list of Drive files; selecting one syncs/resolves it to an internal document before chat uses it |
| `@Files` | Files already stored and synced in this app | Show only when at least one eligible file exists | Open a searchable list of indexed, AI-search-enabled files |
| `@Gmail` | Permission for the assistant to search/read Gmail for this prompt | Show only when Gmail is connected with the required scopes | Insert a provider-level Gmail chip; do not list individual emails in the first-level mention menu |

Unavailable integrations must normally be omitted from the mention menu. Do not show tags for apps the user has never connected. If a previously connected provider requires reauthorization, the menu may show a non-selectable warning row so a user typing that provider tag receives a clear reconnect instruction.

## Product decisions

### Mentions are structured context, not prompt text

The UI may render `@Drive`, `@Files`, and `@Gmail` inline, but chat must send structured source data separately from `message`. Do not make the backend parse display text to determine authorization or resource IDs.

```json
{
  "message": "Summarize the launch risks",
  "chat_mode": "private",
  "sources": [
    {
      "provider": "files",
      "resource_type": "document",
      "resource_id": "doc_123",
      "label": "Launch plan.pdf"
    }
  ]
}
```

The backend must validate every source against the authenticated user. A client-provided provider or resource ID is never proof of access.

### Drive should resolve to app documents

The existing UI can list Drive files through `GET /api/google-drive/files` and sync one through `POST /api/google-drive/sync`. Chat should not pass a raw Drive ID directly into retrieval.

Recommended selection flow:

1. User types `@Drive` and chooses a Drive file.
2. UI calls `POST /api/google-drive/sync` with `sync_to_kb: true`.
3. Backend returns the stable app document ID at `result.sync.document_id` and storage metadata at `result.file`.
4. UI adds a Drive-branded source chip carrying that `document_id`.
5. `POST /api/chat` receives the internal document ID and limits retrieval to it.

This reuses the app's indexing, permissions, and citation pipeline and avoids maintaining a second live-Drive retrieval path.

The current `GoogleDrivePanel` ignores the returned document ID and reloads `/api/files` after sync. The chat picker cannot do that because it needs an unambiguous selection. It should first read `result.sync?.document_id`; if an unchanged response omits that value, resolve the synced file from `/api/files` using the returned storage file ID/source metadata. Prefer updating the backend to always return `sync.document_id` for both changed and unchanged successful syncs.

### Files means eligible synced files

`@Files` should list results from `GET /api/files`, filtered to files the assistant can actually search:

- `in_kb === true`
- `search_enabled !== false`
- `status === "indexed"`
- a stable `document_id` or `kb_document_id` is present

Do not show processing, failed, uploaded-only, or AI-search-disabled files in the chat picker.

### Gmail defaults to provider-level access

The first-level menu should show only `@Gmail`, not email subjects, senders, snippets, or message IDs. This keeps potentially sensitive mailbox content out of an autocomplete menu.

When `@Gmail` is attached, the user's natural-language prompt defines the search, for example:

- `@Gmail summarize the latest updates from Acme`
- `@Gmail find the due date in the invoice email from last week`

The backend performs the mailbox search and returns only the minimum content needed to answer. The response should identify the emails used with safe citations such as sender, subject, received date, and an authorized deep link.

Selecting a specific email is acceptable only as a deliberate second-level action. If added later, the user must explicitly open a Gmail picker or issue a prompt that clearly identifies the message. Never preload recent email subjects merely because the user typed `@`.

Gmail safeguards:

- Use read-only OAuth scopes for chat retrieval.
- Never allow send, delete, archive, label, or modify operations through this mention.
- Search and fetch mailbox data on the backend; do not download a mailbox index into browser state.
- Treat the mention as permission for the current message, not permanent access for all future messages.
- Re-check connection, OAuth scope, account ownership, and token validity on every request.
- Do not include full email bodies in logs, analytics, conversation titles, or client error messages.
- If the request is ambiguous, ask the user to narrow the search instead of returning many messages.

## Chat interaction

### Opening the menu

- Trigger on `@` at the start of input or after whitespace.
- Filter options as the user types, such as `@dr`.
- Support keyboard navigation: Up, Down, Enter, Escape, and Backspace.
- Render the section label **Integrated** above available providers.
- Close the menu when the cursor leaves the active mention or the user presses Escape.

Recommended first-level menu:

```text
Integrated
  [Drive icon] Drive       Search connected Drive files
  [Files icon] Files       Choose a synced file
  [Gmail icon] Gmail       Search Gmail for this message
```

Only show rows returned as available by the source-capabilities endpoint. If no source is available, do not show an empty Integrated section.

### Provider behavior

`@Drive`

- Open a popover with search, loading, empty, error, and pagination states.
- Show file name, type, modified time, and sync state; do not show folders as selectable sources.
- On selection, sync/index when necessary, then insert one source chip.

`@Files`

- Open a popover of eligible app files with local filtering or server search.
- Show file name, type, source provider, and indexed status.
- A Drive-origin file still appears in Files and may retain a small Drive origin badge.

`@Gmail`

- Insert one Gmail provider chip immediately.
- Show helper text: `Gmail will be searched only for this message.`
- Do not open a recent-email list in the initial release.

### Composer chips

Each selection becomes a removable structured chip above or inside the composer. Use the official provider mark where available; use the existing file icon system for app files. Icons are visual support, so every chip and menu row must also have a text label.

Suggested chip labels:

- Drive file: Drive icon + `Launch plan`
- App file: Files icon + `Pricing.pdf`
- Gmail scope: Gmail icon + `Gmail`

The current bundle does not contain official Google brand assets. For the first implementation, use the icon libraries already in the app consistently:

- Drive: existing Material Symbol `add_to_drive`
- Files: existing Lucide `FileText` or `Database`, matching the Files screen
- Gmail: Lucide `Mail` until an approved Gmail brand asset is added

Do not hotlink provider icons from Drive's per-file `iconLink`; it is remote metadata and is not a stable application asset.

Do not store OAuth tokens, email content, or external provider IDs in rendered prompt text or browser local storage. Persist only safe source references in conversation history when needed for replay.

## Source availability

The first release can use the endpoints already represented in this codebase:

| Source | Availability check | Current state |
| --- | --- | --- |
| Drive | `GET /api/integrations/google-drive/status`; show when `configured && connected` | Implemented in `googleDriveApi.getStatus` |
| Files | `GET /api/files`; show when at least one result passes the eligible-file filters | Implemented in `fileManagerApi.getFiles` |
| Gmail | `GET /api/integrations/gmail/status`; show only when connected and read scope is valid | Implemented in `gmailApi.getStatus` and the backend Gmail service |

Do not derive availability from `Integrations.tsx`; its connection toggles are mock component state and are not authenticated or persisted.

The status and file requests can run in parallel when `/chat` mounts. Cache their results for the mounted chat page, refresh after a connection/sync change, and treat failed checks as unavailable without exposing provider details in the mention menu.

### Consolidated endpoint

Chat uses one authoritative endpoint to avoid one status request per integration:

`GET /api/chat/source-capabilities`

```json
{
  "success": true,
  "sources": [
    {
      "provider": "google_drive",
      "mention": "Drive",
      "connected": true,
      "selectable": true,
      "account_label": "user@example.com"
    },
    {
      "provider": "files",
      "mention": "Files",
      "connected": true,
      "selectable": true,
      "eligible_count": 12
    },
    {
      "provider": "gmail",
      "mention": "Gmail",
      "connected": false,
      "selectable": false
    }
  ]
}
```

The frontend includes `connected && selectable` sources. It also includes a previously connected provider with `reconnect_required: true` as a warning-only row; it cannot be selected until OAuth succeeds again. For app-owned Files, `connected` means the source feature is available to the user; it does not imply an external OAuth connection.

The backend returns Gmail as selectable only after its separate `gmail.readonly` OAuth connection succeeds.

## Types

Suggested frontend types:

```ts
export type ChatSourceProvider = 'google_drive' | 'files' | 'gmail';

export interface ChatSourceCapability {
  provider: ChatSourceProvider;
  mention: 'Drive' | 'Files' | 'Gmail';
  connected: boolean;
  selectable: boolean;
  account_label?: string;
  eligible_count?: number;
}

export interface ChatSourceSelection {
  client_id: string;
  provider: ChatSourceProvider;
  resource_type: 'document' | 'mailbox';
  resource_id?: string;
  label: string;
  icon_key: 'drive' | 'files' | 'gmail';
}
```

`resource_id` is required for Drive and Files documents and omitted for the Gmail mailbox scope. The backend should return a normalized source reference with assistant messages so citations and history can render consistently.

Add `sources?: ChatSourceSelection[]` to `Message` as well as `SendMessageInput`. The local user message needs the same safe references so retry and conversation history can preserve the exact source selection. Do not put `client_id` into persisted server history; it is only a React/client identity.

## Chat API changes

Extend `SendMessageInput` and `POST /api/chat` with `sources`.

```ts
export interface SendMessageInput {
  messageContent: string;
  // existing fields...
  sources?: ChatSourceSelection[];
}
```

In `chatSlice.sendMessage`, extract `input.sources` and append it to the existing `requestBody`:

```ts
...(sources?.length ? { sources } : {}),
```

The current upload attachment flow already obtains `attachment.documentId`, but `Chat.handleSend` sends only its display name/size/type to the local message and sends no file/document reference to `/api/chat`. As part of this work, convert a ready upload attachment into a `files` source selection using `attachment.documentId`. Otherwise the UI says the file is ready while the backend is not explicitly scoped to that file.

Explicit sources override broad retrieval behavior. If one or more source chips are present, the backend must constrain retrieval to those sources in `auto`, `private`, and `general` chat modes. `private` without a chip may continue to use all enabled knowledge sources according to current backend behavior.

The backend validates `chat_mode` and explicit-source precedence. Explicit document IDs bypass filename/profile/conversation-state document inference, and Sources-only mode disables external tools.

Backend behavior:

1. Reject unknown providers and malformed source objects with `400`.
2. Return `403` when the resource or connected account does not belong to the user.
3. Return `409` when a selected document is not ready for retrieval.
4. Return `424` when provider authorization expired or required scopes are missing.
5. Apply source constraints before retrieval; never retrieve globally and filter only after generation.
6. Return source citations and safe display metadata with the assistant message.

Suggested error body:

```json
{
  "success": false,
  "code": "SOURCE_AUTH_EXPIRED",
  "message": "Reconnect Gmail to use it in chat.",
  "provider": "gmail"
}
```

Backend `error_response` supports optional `code` and `provider` fields while preserving the existing `{ "error": "..." }` shape.

## Backend implementation status

Backend project: `telegram-ai-bot-python`.

### Ready to reuse

| Capability | Backend implementation | Readiness |
| --- | --- | --- |
| Authenticated user boundary | `require_auth` resolves the JWT user ID for chat, files, RAG, and Drive routes | Ready |
| Drive connection | `google_drive_service.py` implements status, OAuth, token refresh, disconnect, list, download, and read-only Drive scope | Ready for `@Drive` |
| Drive-to-document conversion | `sync_file(..., sync_to_kb=True)` stores the file and calls `upload_service.sync_to_kb` | Ready; consume `result.sync.document_id` |
| Eligible app files | `upload_service.get_user_files` and `rag_service.get_user_knowledge_files` return user-owned indexed files | Ready for `@Files` |
| Document-constrained retrieval | `search_knowledge_for_documents(..., document_ids=...)` and Qdrant `document_id` filters already exist | Ready to reuse |
| Retrieval isolation | Qdrant requires `tenant_id` and excludes `search_enabled=false` | Ready, but request ownership must still be validated before retrieval |

### Implemented in this update

| Area | Implemented behavior | Location |
| --- | --- | --- |
| Chat source input | Parses, limits, deduplicates, and validates structured `sources` before model execution | `chat_source_service.py`, `routes.py` |
| Chat mode | Validates `auto`, `private`, and `general`; Sources-only mode disables tools | `routes.py`, `agent.py` |
| Explicit-source routing | Uses only validated document IDs and bypasses inferred document selection | `agent.py` |
| Agent RAG setting | Explicit document selections enable bounded retrieval even when the agent default disables RAG | `agent.py` |
| Message persistence | Stores safe source references on user messages and retrieved citations on assistant messages | `memory.py` |
| Response citations | Returns document and Gmail references in chat responses and history | `agent.py`, `routes.py` |
| Structured errors | Returns stable source/mode error codes with optional provider | `responses.py`, `routes.py` |
| Gmail | Separate `gmail.readonly` OAuth, status, disconnect, search, safe context, and citations | `gmail_service.py`, `routes.py` |
| Tests | Covers ownership rejection, Drive-origin enforcement, Gmail gating, and serialization | `tests/test_chat_sources.py` |

### Implemented backend path

1. Add a small source schema/validator at the API boundary. Allow only known keys, cap the number of document sources, reject duplicate IDs, and allow at most one Gmail mailbox scope.
2. Resolve every Drive/Files `resource_id` against `rag_service.get_user_knowledge_files(user_id)`. The document must belong to the JWT user, be indexed, and remain search-enabled. Do this before calling the model or embedding service.
3. Add `chat_mode` and `explicit_document_ids` parameters to `AIAgent.get_response` and `get_rag_context`.
4. When explicit document IDs exist, skip `resolve_conversation_context` for document selection and call `search_knowledge_for_documents` directly with only those IDs. Conversation state must not add older active documents to this request.
5. Keep the existing Qdrant `tenant_id + document_id + search_enabled` filters as the final retrieval enforcement layer.
6. Extend chat memory so the saved user message contains safe normalized source references and the saved assistant message contains only citations actually retrieved. Include those fields in `serialize_message_doc` and history responses.
7. Return the normalized `sources` and `references` in `POST /api/chat` so the optimistic frontend message can reconcile with server state.
8. Gmail uses a separate read-only provider flow. The existing Drive connection grants only `drive.readonly` and does not authorize Gmail.

Suggested agent branch:

```py
if explicit_document_ids:
    facts = await rag_service.search_knowledge_for_documents(
        query=user_message,
        user_id=user_id,
        document_ids=explicit_document_ids,
        include_metadata=True,
    )
else:
    # Keep the existing classifier, filename, profile, and conversation-state routing.
    rag_context = await self.get_rag_context(...)
```

Do not treat the Qdrant tenant filter as the API ownership check. Validate source IDs first so invalid resources produce a controlled `403` instead of silently returning no context.

For production, require `GOOGLE_TOKEN_ENCRYPTION_SECRET` at startup. `GoogleDriveService` currently falls back to a hard-coded development encryption secret, which is not suitable for storing production Drive or future Gmail refresh tokens.

## Frontend structure

Keep mention logic out of the existing large `Chat.tsx` page. Suggested modules:

```text
src/
  components/chat/
    ChatComposer.tsx
    IntegratedMentionMenu.tsx
    SourceChip.tsx
    SourceResourcePicker.tsx
  hooks/
    useChatMentions.ts
    useAvailableChatSources.ts
  services/
    chatSourceService.ts
  types/
    chat-source.types.ts
```

State owned by the composer:

- Current mention query and cursor range
- Open menu/provider picker
- Selected structured sources
- Per-source loading/error state

The page currently renders two composer layouts (empty-chat and active-chat) in `Chat.tsx`. Both must use the same extracted `ChatComposer`; implementing mention state separately in both branches will cause inconsistent menus and stale selections.

Conversation/message state:

- Store safe normalized source references with the user message
- Clear composer selections after a successful dispatch
- Preserve selections when a send fails so the user can retry
- Do not carry selections automatically into the next message

`handleSend` currently dispatches without awaiting completion and immediately clears a ready attachment. Change it to await `dispatch(sendMessage(...)).unwrap()` before clearing source selections, while still adding the optimistic user message. On rejection, keep the source references available for retry. `handleRetryLastMessage` must pass `lastUserMessage.sources`, not only its text.

## Current code reuse and gaps

Reusable now:

- `/chat` route and composer in `src/pages/Chat.tsx`
- Drive connection/list/sync methods in `src/services/googleDriveApi.ts`
- Drive status and file types in `src/types/google-drive.types.ts`
- Stored file listing in `src/services/fileManagerApi.ts`
- Stored file source metadata in `src/types/file.types.ts`
- Existing Lucide icons and file icon utilities
- Existing upload-and-index flow in `src/services/chatAttachmentService.ts`

Implemented changes:

- Use authenticated backend status for Drive and Gmail
- Read available chat providers through the consolidated capability API
- Add mention parsing, menu, resource picker, and source chips
- Add `sources` to chat request and message/history types
- Pass the existing uploaded attachment `documentId` to chat as a source
- Add backend source authorization and retrieval constraints
- Add separate Gmail OAuth/status/search/read support and expose `@Gmail` only when connected
- Add source citations to assistant responses

## Acceptance criteria

- Typing `@` shows only sources available to the signed-in user.
- A never-connected or intentionally disconnected Drive or Gmail account never appears as a chat mention. An expired prior connection may appear only as a reconnect warning and is not selectable.
- `@Files` appears only when at least one indexed, AI-search-enabled file is available.
- Each provider and selected resource has a distinct icon plus a readable label.
- Choosing Drive opens that user's Drive file list and produces a usable indexed document reference.
- An unchanged Drive sync still resolves to a stable internal document ID.
- Choosing Files shows only eligible synced files.
- Choosing Gmail does not expose a list of email subjects in the first-level menu.
- Gmail data is accessed only for the message carrying the Gmail chip.
- Specific Gmail messages are read only when the prompt or a deliberate second-level selection identifies them.
- The backend rejects source IDs owned by another user.
- Removing a chip removes that source from the outgoing request.
- An uploaded chat attachment sends its indexed document ID, not only display metadata.
- Sending, retrying, history loading, and starting a new chat do not leak source selection into another message or conversation.
- Keyboard and screen-reader users can open, navigate, select, and remove source mentions.

## Delivery sequence

1. Add normalized source types, source authorization, and `sources` support to `/api/chat`.
2. Implement `@Files` end to end because it uses existing indexed documents.
3. Implement `@Drive` using the existing list and sync APIs.
4. Pass existing uploaded attachment document IDs through the same source contract.
5. Add Gmail OAuth with read-only scopes, then release provider-level `@Gmail`.
6. Add the consolidated capability endpoint for connected-only provider discovery.
7. Consider a specific-email picker only after privacy review and audit logging are complete.
