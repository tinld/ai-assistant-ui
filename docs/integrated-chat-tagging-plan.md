# Integrated Chat Tagging Plan

## Goal

Upgrade the integrated chat experience so users can type source tags like `@Drive`, `@Gmail`, or `@Files` inside the chat composer, browse matching content from that source, attach selected items as context, and ask the assistant to use that context in the conversation.

Example flows:

- Type `@Drive` to browse and select files from Google Drive.
- Type `@Gmail` to search recent emails or threads.
- Type `@Files` or `@Synced` to reference local or synced workspace files.
- Send a message like: `Summarize @Drive Q3 Report and compare it with @Files proposal.md`.

## Core Experience

1. User types `@` in the chat composer.
2. The app opens a tag suggestion menu.
3. User selects a source such as `@Drive`, `@Gmail`, or `@Files`.
4. The app opens a source picker for that integration.
5. User searches or browses available files, emails, or synced items.
6. User selects one or more items.
7. The selected items appear in the composer as context chips.
8. When the message is sent, the app resolves the selected items into structured context for the assistant.

## Supported Source Tags

### MVP Tags

| Tag | Purpose | Example |
| --- | --- | --- |
| `@Drive` | Find and attach Google Drive files | `@Drive Product Roadmap.pdf` |
| `@Gmail` | Find and attach Gmail emails or threads | `@Gmail Contract update from Alice` |
| `@Files` | Find and attach synced local/workspace files | `@Files /docs/spec.md` |
| `@Synced` | Alias for synced files if the product language prefers it | `@Synced onboarding-notes.md` |

### Future Tags

| Tag | Purpose |
| --- | --- |
| `@Calendar` | Reference meetings, events, and schedules |
| `@Slack` | Reference Slack messages or channels |
| `@Notion` | Reference Notion pages or databases |
| `@Contacts` | Reference people and contact records |
| `@Web` | Reference saved web pages or live web search results |

## Chat Composer Requirements

### Tag Detection

- Detect `@` when typed in the composer.
- Continue matching while the user types characters after `@`.
- Show source suggestions for partial matches.
- Example: `@Gm` should show `@Gmail`.
- Close the suggestion menu when the user presses `Escape`, clicks outside, or deletes the trigger text.

### Suggestion Menu

Each suggestion should show:

- Source icon.
- Source name.
- Short description.
- Connection state, if relevant.

Example suggestions:

- `@Drive` - Google Drive files.
- `@Gmail` - Gmail emails and threads.
- `@Files` - Synced files in this workspace.

### Keyboard Support

- `ArrowDown` and `ArrowUp` move through suggestions.
- `Enter` selects the highlighted suggestion.
- `Tab` can select the highlighted suggestion.
- `Escape` closes the menu.
- Backspace/delete updates or removes the active query.

## Source Picker Requirements

### Google Drive Picker

The `@Drive` picker should support:

- Recent files.
- Search by file name.
- File type display.
- Modified date.
- Owner or shared-by information when available.
- Multi-select.
- Open-in-Drive action.
- Permission/connect prompt when Drive is not connected.

Useful metadata:

- Drive file ID.
- File name.
- MIME type.
- Web URL.
- Last modified time.
- Owner/shared status.
- Export or download method.

### Gmail Picker

The `@Gmail` picker should support:

- Recent threads.
- Search by sender, subject, and keyword.
- Thread subject.
- Sender.
- Date.
- Short preview.
- Selection of a full thread or a specific message.
- Permission/connect prompt when Gmail is not connected.

Useful metadata:

- Gmail thread ID.
- Message ID, if selecting a specific message.
- Subject.
- Sender.
- Recipients.
- Date.
- Snippet.
- Attachment metadata, if present.

### Files Picker

The `@Files` or `@Synced` picker should support:

- Search indexed local or synced files.
- Filter by folder.
- Show path, file type, and modified date.
- Respect workspace and permission boundaries.
- Allow single or multi-select.

Useful metadata:

- File path.
- Display name.
- File extension.
- Last modified time.
- Size.
- Index status.
- Read permission status.

## Context Chips

After selection, the composer should show each selected item as a structured chip rather than plain text only.

Examples:

- `@Drive Quarterly Report.pdf`
- `@Gmail Sarah - Contract update`
- `@Files /docs/spec.md`

Each chip should store:

- Source type: `drive`, `gmail`, `files`.
- Source item ID or file path.
- Display label.
- Original tag.
- Permission state.
- Retrieval method.
- Optional preview metadata.

Chip actions:

- Preview.
- Remove.
- Replace.
- Open source.
- View metadata.

## Message Send Flow

When the user sends a message with tagged context:

1. Validate all attached chips.
2. Check connector permissions.
3. Resolve each chip into assistant-readable context.
4. Extract or fetch content when allowed.
5. Convert large content into chunks or summaries.
6. Send the user message plus structured context to the assistant.
7. Show per-chip status in the chat timeline.

Possible chip statuses:

- `Loading`
- `Attached`
- `Failed to read`
- `Needs permission`
- `Unavailable`
- `Too large, summarized`
- `Unsupported file type`

## Data Model Draft

```ts
type ChatContextSource = 'drive' | 'gmail' | 'files' | 'synced';

interface ChatContextChip {
  id: string;
  source: ChatContextSource;
  tag: string;
  label: string;
  referenceId: string;
  metadata?: Record<string, unknown>;
  status: 'pending' | 'ready' | 'failed' | 'permission_required' | 'unavailable';
}

interface ResolvedChatContext {
  chipId: string;
  source: ChatContextSource;
  title: string;
  content?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}
```

## Backend and Connector Requirements

The backend should own source access, permission checks, content extraction, and context resolution. The frontend should only request searchable items, display selected chips, and send structured context references with the chat message.

This keeps the chat UI clean and prevents Drive, Gmail, and local file logic from spreading across React components.

### Source Registry

Create a registry that defines available tag sources.

Each source should define:

- Tag name.
- Display name.
- Icon.
- Connection status.
- Search method.
- Recent-items method.
- Resolve-content method.
- Permission requirements.

Suggested source contract:

```ts
interface ChatContextSourceProvider {
  source: ChatContextSource;
  tag: string;
  displayName: string;
  checkConnection(userId: string): Promise<SourceConnectionStatus>;
  recent(request: SourceRecentRequest): Promise<SourceSearchResponse>;
  search(request: SourceSearchRequest): Promise<SourceSearchResponse>;
  resolve(request: SourceResolveRequest): Promise<ResolvedChatContext>;
}
```

The chat backend should depend on this contract, not on source-specific implementation details.

### Backend API Endpoints

Add a small set of chat context endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/chat/context/sources` | List available sources and connection states |
| `GET` | `/api/chat/context/:source/recent` | Load recent items for a source |
| `GET` | `/api/chat/context/:source/search?q=` | Search one source |
| `POST` | `/api/chat/context/resolve` | Resolve selected chips into readable context |
| `POST` | `/api/chat/messages` | Send chat message with structured context references |

The existing frontend API pattern can add this as a dedicated service, for example `src/services/chatContextApi.ts`, instead of mixing it into the Drive or file upload services.

### Search API

Each source should expose a consistent search contract:

```ts
interface SourceSearchRequest {
  source: ChatContextSource;
  query: string;
  limit?: number;
  cursor?: string;
}

interface SourceSearchResponse {
  results: SourceSearchResult[];
  nextCursor?: string | null;
}

interface SourceSearchResult {
  id: string;
  source: ChatContextSource;
  title: string;
  subtitle?: string;
  preview?: string;
  metadata?: Record<string, unknown>;
}
```

### Resolve API

Each selected item needs a resolver:

- Drive resolver fetches file metadata and readable/exported content.
- Gmail resolver fetches thread or message content.
- Files resolver reads local/synced file content if permitted.

The resolver should return plain text where possible and metadata when content is not directly readable.

Resolve request shape:

```ts
interface SourceResolveRequest {
  source: ChatContextSource;
  referenceId: string;
  metadata?: Record<string, unknown>;
}

interface ChatContextResolveRequest {
  items: SourceResolveRequest[];
}

interface ChatContextResolveResponse {
  resolved: ResolvedChatContext[];
}
```

### Chat Message Payload Change

Current chat messages should evolve from plain text-only payloads to text plus structured context references.

```ts
interface SendChatMessageRequest {
  message: string;
  conversationId?: string;
  contextChips?: ChatContextChip[];
}
```

Backend send flow:

1. Validate `contextChips`.
2. Check user permissions for each source.
3. Resolve selected references.
4. Extract text or metadata.
5. Summarize or chunk oversized content.
6. Build the final assistant context.
7. Call the AI provider.
8. Return the assistant response plus per-chip statuses.

### Connector Responsibilities

#### Drive Connector

Backend Drive connector should support:

- Check Google Drive connection and scopes.
- List recent Drive files.
- Search Drive files.
- Fetch file metadata.
- Export Google Docs, Sheets, and Slides into readable formats.
- Download readable files such as PDF, TXT, Markdown, and DOCX where supported.
- Return permission errors without leaking unavailable file metadata.

#### Gmail Connector

Backend Gmail connector should support:

- Check Gmail connection and scopes.
- List recent threads.
- Search threads by sender, subject, and keyword.
- Fetch thread messages.
- Return sender, recipients, subject, date, and snippet metadata.
- Include attachment metadata by default.
- Avoid reading attachment content unless the user explicitly selects it later.

#### Files Connector

Backend files connector should support:

- Search indexed local or synced files.
- Read allowed file contents.
- Track file metadata.
- Ignore restricted folders.
- Handle moved, renamed, and deleted files.
- Return clear unavailable states when the index is stale.

### Frontend Integration Boundaries

Keep frontend changes scoped to these areas:

- `src/types/`: shared context source and chip types.
- `src/services/`: `chatContextApi.ts` for source, search, recent, and resolve calls.
- `src/pages/Chat.tsx`: composer wiring and send payload integration.
- `src/components/`: reusable tag menu, source picker, and context chip components.
- `src/hooks/`: optional `useChatContextTags` or `useChatContextPicker` hooks.

Avoid putting connector-specific fetch logic directly inside page components. `Chat.tsx` should work with generic context chip state and call the service layer.

### Clean Code Rules for Implementation

- One source registry contract for all source types.
- One frontend API service for chat context.
- One set of reusable UI components for tag suggestions and source picking.
- Typed request and response interfaces before wiring UI state.
- No duplicated Drive/Gmail/Files picker logic where a shared picker shell can handle it.
- No AI token logic inside React components.
- No private source content stored in frontend state longer than needed for the current message.
- Source-specific details belong in providers/connectors, not the chat send pipeline.

## Permissions and Safety

- Show only content the user is allowed to access.
- Do not expose file or email metadata from disconnected sources.
- Prompt the user to connect Drive or Gmail before browsing those sources.
- Reading selected context can happen after the user selects an item.
- Any write action still requires explicit confirmation.
- Sensitive actions include sending email, deleting files, modifying files, sharing files, or changing labels.
- Keep an audit/debug log of which sources were attached to a chat message.

Recommended audit fields:

```ts
interface ChatContextAuditLog {
  chatMessageId: string;
  userId: string;
  source: ChatContextSource;
  referenceId: string;
  label: string;
  status: 'ready' | 'failed' | 'permission_required' | 'unavailable';
  resolvedAt: string;
}
```

Do not store full private email or file contents in audit logs unless a future product requirement explicitly needs it.

## Search and Indexing

### Unified Search

Later versions can support queries like:

- `@Drive budget`
- `@Gmail from:alice`
- `@Files onboarding`

Ranking can consider:

- Text relevance.
- Recency.
- Frequency of use.
- Source priority.
- Exact title matches.

### Synced File Indexing

For local or synced files:

- Index file metadata.
- Optionally index file content.
- Refresh index incrementally.
- Remove deleted files.
- Update moved or renamed files.
- Respect ignored folders and permission boundaries.

## Performance and Optimization

Optimization should be part of the first design, not a cleanup step after the UI works.

### Picker Performance

- Load recent items immediately when a source picker opens.
- Debounce search input before calling backend APIs.
- Cancel stale requests when the user keeps typing.
- Use pagination or cursors for Drive and Gmail result sets.
- Cache recent results per source for the active session.
- Show loading states per source, not one global blocking loader.

### Backend Performance

- Resolve content only after the user sends the message.
- Fetch metadata during browsing, not full file or email content.
- Enforce max selected items per message.
- Enforce max bytes per item.
- Enforce max total context size per message.
- Chunk or summarize large files before the final assistant call.
- Reuse extracted text for the same source item within a short cache window when safe.
- Handle Drive and Gmail rate limits with retries and clear user-facing statuses.

### Files Index Performance

- Index metadata first, content second.
- Run incremental indexing for changed files only.
- Keep deleted or moved file cleanup separate from search requests.
- Avoid blocking chat send on a full workspace re-index.
- Store enough index metadata to detect stale entries.

### Token Budget Control

Before calling the assistant:

1. Reserve tokens for system instructions and the user message.
2. Allocate the remaining budget across selected context chips.
3. Prefer exact excerpts for small files and summaries for large files.
4. Return chip-level status when content is reduced.
5. Never silently drop selected context without reporting status.

## MVP Scope

The first version should include:

1. `@` autocomplete in the chat composer.
2. Source suggestions for `@Drive`, `@Gmail`, and `@Files`.
3. Source picker modal or popover.
4. Recent items and search results.
5. Context chips in the composer.
6. Structured metadata for selected chips.
7. Content resolution when the message is sent.
8. Basic permission and connector prompts.
9. Graceful error states for unavailable content.
10. Backend context source endpoints.
11. Token and file-size limits.
12. Basic result caching and debounced search.

## Suggested Implementation Phases

### Phase 1: Composer Tagging

- Add `@` trigger detection.
- Add source suggestion menu.
- Add keyboard navigation.
- Insert selected source into composer state.

### Phase 2: Source Picker

- Build shared picker shell.
- Add Drive, Gmail, and Files tabs or source-specific views.
- Add recent items and search.
- Support single and multi-select.

### Phase 3: Context Chips

- Render selected items as chips.
- Store chip metadata in message draft state.
- Add remove, preview, and open-source actions.

### Phase 4: Context Resolution

- Add source resolvers.
- Resolve selected chips during send.
- Handle loading, permission, and failure states.
- Add large-content summarization/chunking behavior.

### Phase 5: Backend Connector Layer

- Add source registry.
- Add context source endpoints.
- Add Drive, Gmail, and Files provider contracts.
- Add chat message payload support for `contextChips`.
- Add token and file-size enforcement.

### Phase 6: Connector Hardening

- Add connection checks.
- Add permission prompts.
- Add audit/debug logs.
- Add tests for disconnected and unavailable states.

### Phase 7: Search Quality

- Improve ranking.
- Add filters.
- Cache recent results.
- Add indexed local/synced file search.

### Phase 8: Optimization

- Add request cancellation.
- Add source-level result caching.
- Add pagination for Drive and Gmail.
- Add stale index detection for files.
- Add rate-limit handling.

## UX Notes

- The user should not need to leave the chat composer to attach context.
- Recent items should appear quickly before search results finish loading.
- Keyboard-first interaction should feel natural.
- Mobile should use a full-screen picker instead of a tiny popover.
- Chips should be visually compact but easy to inspect.
- Error states should be specific and recoverable.

## Open Questions

- Should the local/synced file tag be called `@Files`, `@Synced`, or both?
- Should selecting `@Drive` immediately open a picker, or should the user continue typing a search query inline?
- Should users be able to attach entire folders from Drive or local synced files?
- Should Gmail allow attaching only threads, or also individual messages?
- How much content should be sent directly to the assistant before summarization?
- Do we need per-workspace source permissions?
- Should tags be editable after selection, or only removable/replaced through chip actions?

## Acceptance Criteria

- Typing `@` in the chat composer shows source suggestions.
- Selecting `@Drive`, `@Gmail`, or `@Files` opens the correct picker.
- The picker can show recent items and search results.
- Selected items appear as structured chips.
- Sending a message resolves selected chips into assistant context.
- Disconnected sources show a clear connect prompt.
- Permission denied or unavailable content does not break message sending.
- The implementation supports adding future sources without rewriting the composer.
- Backend source integrations share one provider contract.
- Chat messages support structured context references.
- Large context is summarized, chunked, or reported instead of silently dropped.
- Search calls are debounced and stale requests are ignored or cancelled.
