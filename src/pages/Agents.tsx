import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  AGENT_EMPTY_STATE_TEXT,
  AGENT_SETUP_STEPS,
  AGENT_TONES,
  DEFAULT_AGENT_FORM,
  REQUIRED_AGENT_TOOLS,
  buildAgentSystemPrompt,
} from '../constants/agent.constants';
import { agentApi } from '../services/agentApi';
import type { RootState } from '../store';
import type { AgentFormValues, AgentProfile, ModelOptions, ModelPreset } from '../types/agent.types';
import { BrandMark } from '../components/BrandMark';
import { useDismissibleLayer } from '../hooks/useDismissibleLayer';

const createEmptyForm = (): AgentFormValues => ({
  ...DEFAULT_AGENT_FORM,
  enabled_tools: [...DEFAULT_AGENT_FORM.enabled_tools],
  model_profile: { ...DEFAULT_AGENT_FORM.model_profile },
});

const formFromAgent = (agent: AgentProfile): AgentFormValues => ({
  name: agent.name,
  description: agent.description,
  system_prompt: agent.system_prompt,
  style_prompt: agent.style_prompt,
  model_profile: { ...agent.model_profile },
  enabled_tools: [...agent.enabled_tools],
  use_rag: agent.use_rag,
});

const getActiveAgent = (agents: AgentProfile[]): AgentProfile | null =>
  agents.find((agent) => agent.is_active) ?? agents[0] ?? null;

const getModelLabel = (preset: ModelPreset): string =>
  `${preset.description} (${preset.model_name})`;

const getToneByPrompt = (stylePrompt: string) =>
  AGENT_TONES.find((tone) => tone.stylePrompt === stylePrompt) ?? AGENT_TONES[0];

const LAST_SETUP_STEP_INDEX = AGENT_SETUP_STEPS.length - 1;

export const Agents: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelOptions>({ providers: [], presets: [] });
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<AgentFormValues>(createEmptyForm);
  const [isCreating, setIsCreating] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState(0);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const setupDialogRef = useRef<HTMLElement>(null);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.agent_id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );

  const activeAgent = useMemo(() => getActiveAgent(agents), [agents]);
  const selectedTone = useMemo(() => getToneByPrompt(formValues.style_prompt), [formValues.style_prompt]);

  const loadAgents = useCallback(async (): Promise<void> => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const [loadedAgents, loadedModelOptions] = await Promise.all([
        agentApi.getAgents(token),
        agentApi.getModelOptions(token),
      ]);
      const nextSelectedAgent = getActiveAgent(loadedAgents);

      setAgents(loadedAgents);
      setModelOptions(loadedModelOptions);
      setSelectedAgentId(nextSelectedAgent?.agent_id ?? null);
      setFormValues(nextSelectedAgent ? formFromAgent(nextSelectedAgent) : createEmptyForm());
      setIsCreating(!nextSelectedAgent);
    } catch (loadError) {
      console.error(loadError);
      setError('Failed to load AI agents.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAgents();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAgents]);

  const handleCloseSetup = (): void => {
    setIsSetupOpen(false);
    setSelectedAgentId(null);
    setSetupStep(0);
    setError(null);
  };

  useDismissibleLayer({
    enabled: isSetupOpen,
    ref: setupDialogRef,
    onDismiss: handleCloseSetup,
  });

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleSelectAgent = (agent: AgentProfile): void => {
    setSelectedAgentId(agent.agent_id);
    setFormValues(formFromAgent(agent));
    setIsCreating(false);
    setSetupStep(0);
    setIsSetupOpen(true);
    setError(null);
  };

  const handleCreateNew = (): void => {
    setSelectedAgentId(null);
    setFormValues(createEmptyForm());
    setIsCreating(true);
    setSetupStep(0);
    setIsSetupOpen(true);
    setError(null);
  };

  const handlePresetChange = (profileId: string): void => {
    const preset = modelOptions.presets.find((option) => option.profile_id === profileId);
    if (!preset) return;

    setFormValues((current) => ({
      ...current,
      model_profile: {
        ...current.model_profile,
        profile_id: preset.profile_id,
        provider: preset.provider,
        model_name: preset.model_name,
        temperature: preset.temperature,
      },
    }));
  };

  const handleDescriptionChange = (description: string): void => {
    setFormValues((current) => ({
      ...current,
      description,
      system_prompt: buildAgentSystemPrompt(description),
      enabled_tools: REQUIRED_AGENT_TOOLS.map((tool) => tool.id),
    }));
  };

  const handleToneChange = (toneId: string): void => {
    const tone = AGENT_TONES.find((option) => option.id === toneId);
    if (!tone) return;

    setFormValues((current) => ({
      ...current,
      style_prompt: tone.stylePrompt,
    }));
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    setError(null);

    try {
      const payload: AgentFormValues = {
        ...formValues,
        system_prompt: buildAgentSystemPrompt(formValues.description),
        enabled_tools: REQUIRED_AGENT_TOOLS.map((tool) => tool.id),
      };
      const savedAgent = isCreating || !selectedAgent
        ? await agentApi.createAgent(payload, token)
        : await agentApi.updateAgent(selectedAgent.agent_id, payload, token);

      await loadAgents();
      setSelectedAgentId(null);
      setFormValues(formFromAgent(savedAgent));
      setIsCreating(false);
      setSetupStep(0);
      setIsSetupOpen(false);
    } catch (saveError) {
      console.error(saveError);
      setError('Failed to save AI agent.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (agentId: string): Promise<void> => {
    setError(null);

    try {
      await agentApi.activateAgent(agentId, token);
      await loadAgents();
    } catch (activateError) {
      console.error(activateError);
      setError('Failed to activate AI agent.');
    }
  };

  const canContinueSetup = formValues.name.trim().length > 0 && formValues.description.trim().length > 0;

  const handleNextStep = (): void => {
    if (setupStep < LAST_SETUP_STEP_INDEX) {
      setSetupStep((current) => current + 1);
    }
  };

  const handlePreviousStep = (): void => {
    if (setupStep > 0) {
      setSetupStep((current) => current - 1);
    }
  };

  return (
    <div className="flex-1 bg-surface-bright dark:bg-slate-900 overflow-y-auto font-['Inter']">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <BrandMark size="md" />
            <div>
            <h1 className="text-2xl font-bold text-on-surface dark:text-slate-100">AI Agents</h1>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1 max-w-2xl">
              Create specialized agents by describing what they should help with and how they should communicate.
            </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreateNew}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-700 active:translate-y-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Agent
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900 dark:bg-red-900/30 dark:text-red-400">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        <div>
          <section>
            {isLoading ? (
              <div className="agent-card-enter rounded-lg border border-outline-variant dark:border-slate-800 bg-white dark:bg-slate-950 p-8 text-sm text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-violet-500 animate-pulse"></span>
                  Loading AI agents...
                </div>
              </div>
            ) : agents.length === 0 ? (
              <div className="agent-card-enter rounded-lg border border-dashed border-outline-variant dark:border-slate-800 bg-white dark:bg-slate-950 p-8 text-center">
                <BrandMark size="lg" className="mx-auto" />
                <h2 className="mt-3 text-lg font-semibold text-slate-800 dark:text-slate-100">No AI agents yet</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{AGENT_EMPTY_STATE_TEXT}</p>
                <button
                  onClick={handleCreateNew}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-700 active:translate-y-0"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Create Agent
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="agent-card-enter agent-card-hover rounded-lg border border-dashed border-violet-300 bg-violet-50/70 p-5 text-left shadow-sm hover:border-violet-500 dark:border-violet-800 dark:bg-violet-950/20 dark:hover:border-violet-600"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
                      <span className="material-symbols-outlined text-[20px]">add</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Create Agent</h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Open the same guided setup flow to define a new agent.
                      </p>
                    </div>
                  </div>
                </button>
                {agents.map((agent, index) => (
                  <button
                    key={agent.agent_id}
                    onClick={() => handleSelectAgent(agent)}
                    style={{ animationDelay: `${Math.min(index * 45, 240)}ms` }}
                    className={`agent-card-enter agent-card-hover rounded-lg border bg-white p-5 text-left shadow-sm hover:border-violet-300 dark:bg-slate-950 dark:hover:border-violet-700 ${
                      selectedAgentId === agent.agent_id
                        ? 'border-violet-500 ring-2 ring-violet-100 dark:ring-violet-900/30'
                        : 'border-outline-variant dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <BrandMark size="sm" />
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-bold text-slate-800 dark:text-slate-100">{agent.name}</h2>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{agent.description}</p>
                        </div>
                      </div>
                      {agent.is_active && (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {agent.model_profile.provider}/{agent.model_profile.model_name}
                      </span>
                      <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                        {agent.use_rag ? 'Knowledge on' : 'Knowledge off'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {agent.enabled_tools.length} tools
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {isSetupOpen && (
        <div className="agent-backdrop-enter fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
          <aside ref={setupDialogRef} className="agent-modal-enter max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-lg border border-outline-variant bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {isCreating ? 'Create Agent' : 'Edit Agent'}
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {activeAgent ? `Active Agent: ${activeAgent.name}` : 'Describe the agent you need, then save it.'}
                </p>
              </div>
              {selectedAgent && !selectedAgent.is_active && (
                <button
                  onClick={() => void handleActivate(selectedAgent.agent_id)}
                  className="rounded-lg border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-900/20"
                >
                  Activate
                </button>
              )}
              <button
                type="button"
                onClick={handleCloseSetup}
                className="rounded-lg p-1.5 text-slate-400 transition-all duration-200 hover:rotate-90 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                title="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mb-6 grid grid-cols-4 gap-2">
              {AGENT_SETUP_STEPS.map((step, index) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setSetupStep(index)}
                  className={`agent-step-dot rounded-lg px-2 py-2 text-xs font-bold ${
                    setupStep === index
                      ? 'agent-step-dot-active bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {index + 1}. {step}
                </button>
              ))}
            </div>

            <div className="min-h-[420px]">
              {setupStep === 0 && (
                <div key="purpose-step" className="agent-step-enter space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Describe the agent</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tell the agent what job it should do. Plain language is enough.</p>
                  </div>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Agent name</span>
                    <input
                      value={formValues.name}
                      onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      placeholder="Travel Planner, Study Helper, Sales Assistant..."
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">What do you want this agent to do?</span>
                    <textarea
                      value={formValues.description}
                      onChange={(event) => handleDescriptionChange(event.target.value)}
                      className="mt-1.5 min-h-40 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      placeholder="Example: Help me compare travel options, estimate costs, and create simple day-by-day plans."
                    />
                  </label>
                </div>
              )}

              {setupStep === 1 && (
                <div key="style-step" className="agent-step-enter space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Choose how it should talk</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">This controls tone only. You can change it later.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {AGENT_TONES.map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => handleToneChange(tone.id)}
                        className={`agent-card-hover rounded-lg border p-3 text-left ${
                          selectedTone.id === tone.id
                            ? 'border-violet-500 bg-violet-50 dark:border-violet-700 dark:bg-violet-900/20'
                            : 'border-slate-200 hover:border-violet-300 dark:border-slate-800 dark:hover:border-violet-700'
                        }`}
                      >
                        <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{tone.label}</span>
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{tone.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {setupStep === 2 && (
                <div key="model-step" className="agent-step-enter space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Select model and knowledge</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose a backend model preset. Weather and web search are included automatically.</p>
                  </div>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Model</span>
                    <select
                      value={formValues.model_profile.profile_id}
                      onChange={(event) => handlePresetChange(event.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {modelOptions.presets.map((preset) => (
                        <option key={preset.profile_id} value={preset.profile_id}>
                          {getModelLabel(preset)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <label className="flex items-center justify-between gap-4">
                      <span>
                        <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Use uploaded knowledge</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">Let this agent answer using files you have synced.</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={formValues.use_rag}
                        onChange={(event) => setFormValues((current) => ({ ...current, use_rag: event.target.checked }))}
                        className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                    </label>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Included capabilities</span>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {REQUIRED_AGENT_TOOLS.map((tool) => (
                        <div key={tool.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                          <span className="material-symbols-outlined mt-0.5 text-[18px] text-violet-600 dark:text-violet-400">check_circle</span>
                          <span>
                            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{tool.label}</span>
                            <span className="block text-xs text-slate-500 dark:text-slate-400">{tool.description}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {setupStep === 3 && (
                <div key="review-step" className="agent-step-enter space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Review and save</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Confirm the setup before saving this agent.</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="font-semibold text-slate-700 dark:text-slate-300">Name</dt>
                        <dd className="mt-0.5 text-slate-500 dark:text-slate-400">{formValues.name || 'Untitled agent'}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-700 dark:text-slate-300">Purpose</dt>
                        <dd className="mt-0.5 text-slate-500 dark:text-slate-400">{formValues.description}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-700 dark:text-slate-300">Style</dt>
                        <dd className="mt-0.5 text-slate-500 dark:text-slate-400">{selectedTone.label}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-700 dark:text-slate-300">Model</dt>
                        <dd className="mt-0.5 text-slate-500 dark:text-slate-400">{formValues.model_profile.model_name}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-700 dark:text-slate-300">Knowledge</dt>
                        <dd className="mt-0.5 text-slate-500 dark:text-slate-400">{formValues.use_rag ? 'Uploaded knowledge enabled' : 'Uploaded knowledge disabled'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={handlePreviousStep}
                disabled={setupStep === 0}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Back
              </button>
              {setupStep < LAST_SETUP_STEP_INDEX ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canContinueSetup}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={() => void handleSave()}
                  disabled={isSaving || !canContinueSetup}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {isSaving ? 'Saving...' : 'Save Agent'}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
