# Phase 1 UI Plan: Flexible AI Friends

This frontend project is in Phase 1 of the larger platform transformation. The backend is adding flexible agent profiles and model profiles. The UI must expose those foundations in a product-friendly way without breaking the existing chat, files, knowledge base, integrations, analytics, or settings screens.

Backend project:
- `D:\proj\ai-chatbot`

Frontend project:
- `D:\proj\ai-assistant-ui`

Backend source of truth plan:
- `D:\proj\ai-chatbot\.gemini\platform_transformation_plan.md`

## Phase 1 Goal

Create UI support for user-owned AI friends/agents.

Users should be able to:
- See their agents.
- Create a new agent.
- Edit an agent.
- Activate one agent.
- Choose an agent model profile.
- Toggle tools.
- Toggle knowledge/RAG access.
- Chat with the active or selected agent.

This is not yet the full multi-agent platform. This phase is the UI foundation for flexible agents.

## Product Direction

The feature should feel like managing personal AI friends, not configuring backend infrastructure.

Preferred product language:
- AI Friends
- My Agents
- Active Friend
- Personality
- Style
- Knowledge Access
- Tools
- Model

Avoid presenting the page as a raw developer settings screen. The model and prompt controls can be visible, but the default view should be approachable.

## Backend APIs Available

Agent endpoints:

```text
GET /api/agents
POST /api/agents
PUT /api/agents/{agent_id}
POST /api/agents/{agent_id}/activate
GET /api/models/options
```

Chat endpoint supports optional `agent_id`:

```text
POST /api/chat
```

Request:

```json
{
  "message": "hello",
  "agent_id": "default_friend"
}
```

If `agent_id` is omitted, backend uses the active agent or creates the default `Buddy` agent.

## Expected Agent Shape

```ts
export interface ModelProfile {
  provider: string;
  model_name: string;
  temperature: number;
  max_output_tokens?: number | null;
  profile_id: string;
}

export interface AgentProfile {
  agent_id: string;
  user_id: number;
  name: string;
  description: string;
  system_prompt: string;
  style_prompt: string;
  model_profile: ModelProfile;
  enabled_tools: string[];
  use_rag: boolean;
  is_active: boolean;
  version: string;
  created_at?: string;
  updated_at?: string;
}
```

Model options response:

```ts
export interface ModelOptions {
  providers: string[];
  presets: Array<{
    profile_id: string;
    provider: string;
    model_name: string;
    temperature: number;
    description: string;
  }>;
}
```

## Files To Add

Recommended new files:
- `src/types/agent.types.ts`
- `src/services/agentApi.ts`
- `src/pages/Agents.tsx`

Optional if state becomes shared:
- `src/store/agentSlice.ts`

Prefer local page state first if the data is only used by the Agents page and Chat selector.

## Files To Update

Required:
- `src/App.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/pages/Chat.tsx`
- `src/store/chatSlice.ts`

Maybe required:
- `src/components/layout/Header.tsx`
- `src/types/chat.types.ts`

## UI Scope

### Agents Page

Route:

```text
/agents
```

Sidebar label:

```text
AI Friends
```

The page should include:
- Header with title `AI Friends`.
- Short subtitle explaining that each friend can have its own personality, model, tools, and knowledge access.
- Agent list/grid.
- Active agent badge.
- Create agent button.
- Edit form or side panel.
- Activate button.
- Save button.
- Loading state.
- Empty state.
- Error state.

Agent card should show:
- name
- description
- active status
- provider/model
- RAG enabled/disabled
- enabled tools count or labels

### Agent Form

Fields:
- Name
- Description
- Personality/system prompt
- Style prompt
- Model preset
- Provider
- Model name
- Temperature
- Max output tokens
- Knowledge access toggle
- Tools toggle

Initial tools:
- `get_weather`
- `search_web`

Initial model presets come from:

```text
GET /api/models/options
```

### Chat Page

Chat should show which AI friend is currently used.

Minimum acceptable update:
- Load agents.
- Find active agent.
- Show active agent name near the chat header or composer.
- Send `agent_id` when sending chat messages.

Better update:
- Add compact agent selector in chat header.
- Let user switch agent for the conversation.
- Still keep default active agent behavior.

Do not make chat layout crowded. The selector should be compact.

## API Service Plan

Create `src/services/agentApi.ts`.

Methods:
- `getAgents(token)`
- `createAgent(payload, token)`
- `updateAgent(agentId, payload, token)`
- `activateAgent(agentId, token)`
- `getModelOptions(token)`

Use existing API wrapper conventions from:
- `src/services/api.ts`
- `src/services/kbApi.ts`
- `src/services/fileManagerApi.ts`

## Chat Store Update

Current `sendMessage` sends:

```ts
{ message: messageContent }
```

Update it to support optional `agentId`:

```ts
{ message: messageContent, agent_id: agentId }
```

Do not break callers that only pass a message.

Recommended thunk input:

```ts
{
  messageContent: string;
  token: string | null;
  agentId?: string;
}
```

## Design Guidance

Use the existing app style:
- Tailwind
- sidebar layout
- quiet SaaS/productivity interface
- cards only for repeated agents or forms
- no marketing hero
- no oversized decorative sections

Use lucide icons if helpful:
- Bot
- UserRoundCog
- Sparkles
- CheckCircle
- SlidersHorizontal
- Brain
- Wrench

Keep text sizes appropriate for dashboard panels. Do not use hero-scale typography.

## Acceptance Criteria

Phase 1 UI is acceptable when:
- `/agents` route exists.
- Sidebar has an `AI Friends` entry.
- User can load existing agents.
- Default backend-created `Buddy` agent appears after first load.
- User can create an agent.
- User can edit an agent.
- User can activate an agent.
- Model presets are loaded from `/api/models/options`.
- Chat sends selected or active `agent_id`.
- Old chat still works if no agent is selected.
- Build passes.

## Verification

Run from frontend directory:

```powershell
npm run build
```

Optional dev server:

```powershell
npm run dev
```

Frontend directory:

```text
D:\proj\ai-assistant-ui
```

Backend directory:

```text
D:\proj\ai-chatbot
```

## Out Of Scope For This UI Phase

Do not implement yet:
- Gmail OAuth UI.
- Gmail send UI.
- Pending action confirmations.
- Advanced analytics assistant.
- Multi-tenant admin console.
- Capability marketplace.
- EC2 deployment UI.

Those belong to later phases after permissions, audit logging, and capability registry are stable.

## Next Implementation Order

1. Add `agent.types.ts`.
2. Add `agentApi.ts`.
3. Add `Agents.tsx`.
4. Add `/agents` route in `App.tsx`.
5. Add sidebar item in `Sidebar.tsx`.
6. Update `chatSlice.ts` to accept optional `agentId`.
7. Update `Chat.tsx` to load/show active agent and pass `agentId`.
8. Run build.
