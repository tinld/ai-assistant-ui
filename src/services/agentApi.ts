import { api } from './api';
import type {
  AgentFormValues,
  AgentProfile,
  AgentResponse,
  AgentsResponse,
  ModelOptionsResponse,
} from '../types/agent.types';

export const agentApi = {
  getAgents: (token: string | null): Promise<AgentProfile[]> =>
    api.get<AgentsResponse>('/api/agents', token).then((response) => response.agents),

  createAgent: (payload: AgentFormValues, token: string | null): Promise<AgentProfile> =>
    api.post<AgentResponse>('/api/agents', payload, token).then((response) => response.agent),

  updateAgent: (agentId: string, payload: AgentFormValues, token: string | null): Promise<AgentProfile> =>
    api.put<AgentResponse>(`/api/agents/${agentId}`, payload, token).then((response) => response.agent),

  activateAgent: (agentId: string, token: string | null): Promise<void> =>
    api.post<{ success: boolean }>(`/api/agents/${agentId}/activate`, {}, token).then(() => undefined),

  getModelOptions: (token: string | null): Promise<ModelOptionsResponse> =>
    api.get<ModelOptionsResponse>('/api/models/options', token),
};
