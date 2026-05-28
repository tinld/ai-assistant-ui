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
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ModelPreset {
  profile_id: string;
  provider: string;
  model_name: string;
  temperature: number;
  description: string;
}

export interface ModelOptions {
  providers: string[];
  presets: ModelPreset[];
}

export interface AgentFormValues {
  name: string;
  description: string;
  system_prompt: string;
  style_prompt: string;
  model_profile: ModelProfile;
  enabled_tools: string[];
  use_rag: boolean;
}

export interface AgentsResponse {
  success: boolean;
  agents: AgentProfile[];
}

export interface AgentResponse {
  success: boolean;
  agent: AgentProfile;
}

export interface ModelOptionsResponse extends ModelOptions {
  success: boolean;
}
