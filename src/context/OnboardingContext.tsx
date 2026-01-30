// src/context/OnboardingContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { OnboardingState, BaselineContext, Episode, Intervention } from '../types';
import { saveBaselineContext } from '../db/repositories/baselineContext';
import { createEpisode } from '../db/repositories/episodes';
import { createIntervention } from '../db/repositories/interventions';
import { formatDateISO, getQuarterEndDate, getQuarterLabel } from '../utils/dates';

interface OnboardingContextType {
  state: OnboardingState;
  updateBaseline: (data: Partial<BaselineContext>) => void;
  updateEpisode: (data: Partial<Episode>) => void;
  addIntervention: (data: Partial<Intervention>) => void;
  removeIntervention: (index: number) => void;
  updateReminders: (data: OnboardingState['reminders']) => void;
  completeOnboarding: () => Promise<void>;
  isComplete: boolean;
  setIsComplete: (value: boolean) => void;
}

const defaultReminders = {
  enabled: true,
  dayOfWeek: 0, // Sunday
  time: '09:00',
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const today = new Date();
  
  const [state, setState] = useState<OnboardingState>({
    baseline: {},
    episode: {
      title: getQuarterLabel(today),
      start_date: formatDateISO(today),
      end_date: formatDateISO(getQuarterEndDate(today)),
      type: 'observational',
      status: 'active',
    },
    interventions: [],
    reminders: defaultReminders,
  });

  const [isComplete, setIsComplete] = useState(false);

  const updateBaseline = (data: Partial<BaselineContext>) => {
    setState((prev) => ({
      ...prev,
      baseline: { ...prev.baseline, ...data },
    }));
  };

  const updateEpisode = (data: Partial<Episode>) => {
    setState((prev) => ({
      ...prev,
      episode: { ...prev.episode, ...data },
    }));
  };

  const addIntervention = (data: Partial<Intervention>) => {
    setState((prev) => ({
      ...prev,
      interventions: [...prev.interventions, data],
    }));
  };

  const removeIntervention = (index: number) => {
    setState((prev) => ({
      ...prev,
      interventions: prev.interventions.filter((_, i) => i !== index),
    }));
  };

  const updateReminders = (data: OnboardingState['reminders']) => {
    setState((prev) => ({
      ...prev,
      reminders: data,
    }));
  };

  const completeOnboarding = async () => {
    // Save baseline context
    await saveBaselineContext({
      sex: state.baseline.sex,
      age_bracket: state.baseline.age_bracket,
      height_bracket_cm: state.baseline.height_bracket_cm,
      weight_bracket_kg: state.baseline.weight_bracket_kg,
      relationship_status: state.baseline.relationship_status,
      typical_cardio_min_per_week: state.baseline.typical_cardio_min_per_week,
      health_notes: state.baseline.health_notes,
      routine: state.baseline.routine ?? [],
      share_defaults: state.baseline.share_defaults ?? {},
    });

    // Create episode
    const episode = await createEpisode({
      title: state.episode.title ?? getQuarterLabel(new Date()),
      start_date: state.episode.start_date ?? formatDateISO(new Date()),
      end_date: state.episode.end_date ?? formatDateISO(getQuarterEndDate(new Date())),
      type: state.episode.type ?? 'observational',
      status: 'active',
      special_summary: state.episode.special_summary,
    });

    // Create interventions
    for (const intervention of state.interventions) {
      if (intervention.compound) {
        await createIntervention({
          episode_id: episode.id,
          compound: intervention.compound,
          dose: intervention.dose,
          unit: intervention.unit,
          route: intervention.route,
          form: intervention.form,
          timing: intervention.timing ?? [],
          with_food: intervention.with_food,
          brand: intervention.brand,
          product: intervention.product,
          notes: intervention.notes,
        });
      }
    }

    // TODO: Schedule reminders if enabled
    // This will be implemented in a later iteration

    setIsComplete(true);
  };

  return (
    <OnboardingContext.Provider
      value={{
        state,
        updateBaseline,
        updateEpisode,
        addIntervention,
        removeIntervention,
        updateReminders,
        completeOnboarding,
        isComplete,
        setIsComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
