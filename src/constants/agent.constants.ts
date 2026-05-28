export const REQUIRED_AGENT_TOOLS = [
  {
    id: 'get_weather',
    label: 'Weather',
    description: 'Can answer weather questions.',
  },
  {
    id: 'search_web',
    label: 'Web Search',
    description: 'Can look up current information online.',
  },
] as const;

export const AGENT_TONES = [
  {
    id: 'professional',
    label: 'Professional',
    description: 'Clear, polished, and work-ready.',
    stylePrompt: 'Use a professional, direct tone. Structure answers clearly and avoid casual phrasing.',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Warm, approachable, and supportive.',
    stylePrompt: 'Use a friendly, natural tone. Be supportive while staying practical and clear.',
  },
  {
    id: 'concise',
    label: 'Concise',
    description: 'Short, focused, and action-oriented.',
    stylePrompt: 'Use a concise tone. Prioritize direct answers, short explanations, and concrete next steps.',
  },
  {
    id: 'coach',
    label: 'Coach',
    description: 'Guiding, patient, and step-by-step.',
    stylePrompt: 'Use a coaching tone. Ask clarifying questions when useful and guide the user step by step.',
  },
  {
    id: 'creative',
    label: 'Creative',
    description: 'Useful for brainstorming and writing.',
    stylePrompt: 'Use a creative but practical tone. Offer options and help the user refine ideas.',
  },
] as const;

export const DEFAULT_AGENT_DESCRIPTION = 'Help me with daily work, questions, planning, and writing.';

export const buildAgentSystemPrompt = (description: string): string =>
  `You are a specialized AI agent. Your purpose is: ${description.trim() || DEFAULT_AGENT_DESCRIPTION} Help the user accomplish this clearly and safely. Be honest about limitations and ask a short clarifying question when the request is unclear.`;

export const DEFAULT_AGENT_FORM = {
  name: 'Custom Agent',
  description: DEFAULT_AGENT_DESCRIPTION,
  system_prompt: buildAgentSystemPrompt(DEFAULT_AGENT_DESCRIPTION),
  style_prompt: AGENT_TONES[0].stylePrompt,
  enabled_tools: REQUIRED_AGENT_TOOLS.map((tool) => tool.id),
  use_rag: true,
  model_profile: {
    profile_id: 'general_fast',
    provider: 'gemini',
    model_name: 'gemini-2.5-flash-lite',
    temperature: 0.7,
    max_output_tokens: null,
  },
} as const;

export const AGENT_EMPTY_STATE_TEXT = 'Create your first AI agent or load the default agent from the backend.';

export const AGENT_SETUP_STEPS = [
  'Purpose',
  'Style',
  'Model',
  'Review',
] as const;
