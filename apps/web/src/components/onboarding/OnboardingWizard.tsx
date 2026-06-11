"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ProfileStep } from "./ProfileStep";
import { GoalsStep } from "./GoalsStep";
import { SplitStep } from "./SplitStep";
import { useCompleteOnboarding } from "@/lib/api/hooks/use-complete-onboarding";
import type { SplitType } from "@/lib/onboarding/split-presets";

interface OnboardingState {
  step: 1 | 2 | 3;
  name: string;
  age?: number;
  bio?: string;
  goals: string[];
  splitType?: SplitType;
  programName: string;
  error?: string;
}

type OnboardingAction =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_AGE"; payload: number | undefined }
  | { type: "SET_BIO"; payload: string | undefined }
  | { type: "SET_GOALS"; payload: string[] }
  | { type: "SET_SPLIT_TYPE"; payload: SplitType }
  | { type: "SET_PROGRAM_NAME"; payload: string }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" };

function reducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.payload };
    case "SET_AGE":
      return { ...state, age: action.payload };
    case "SET_BIO":
      return { ...state, bio: action.payload };
    case "SET_GOALS":
      return { ...state, goals: action.payload };
    case "SET_SPLIT_TYPE":
      return { ...state, splitType: action.payload };
    case "SET_PROGRAM_NAME":
      return { ...state, programName: action.payload };
    case "NEXT_STEP":
      return { ...state, step: Math.min(3, state.step + 1) as 1 | 2 | 3, error: undefined };
    case "PREV_STEP":
      return { ...state, step: Math.max(1, state.step - 1) as 1 | 2 | 3 };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: undefined };
    default:
      return state;
  }
}

interface OnboardingWizardProps {
  userName?: string;
}

export function OnboardingWizard({ userName }: OnboardingWizardProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [state, dispatch] = useReducer(reducer, {
    step: 1,
    name: userName || "",
    goals: [],
    programName: "",
  });

  const mutation = useCompleteOnboarding();

  const canNext = () => {
    if (state.step === 1) return state.name.trim().length > 0;
    if (state.step === 2) return state.goals.length > 0;
    if (state.step === 3) return state.splitType && state.programName.trim().length > 0;
    return false;
  };

  const handleNext = () => {
    if (state.step === 3) {
      handleComplete();
    } else {
      dispatch({ type: "NEXT_STEP" });
    }
  };

  const handleComplete = async () => {
    dispatch({ type: "CLEAR_ERROR" });
    try {
      await mutation.mutateAsync({
        name: state.name,
        age: state.age,
        bio: state.bio,
        goals: state.goals,
        splitType: state.splitType!,
        programName: state.programName,
      });

      // Update session before navigating
      await updateSession({ hasOnboarded: true });
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao completar onboarding";
      dispatch({ type: "SET_ERROR", payload: message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Bem-vindo ao FitFlow</h1>
        <p className="text-muted-foreground">Etapa {state.step} de 3</p>
      </div>

      <div className="min-h-[300px]">
        {state.step === 1 && (
          <ProfileStep
            name={state.name}
            age={state.age}
            bio={state.bio}
            onNameChange={(val) => dispatch({ type: "SET_NAME", payload: val })}
            onAgeChange={(val) => dispatch({ type: "SET_AGE", payload: val })}
            onBioChange={(val) => dispatch({ type: "SET_BIO", payload: val })}
          />
        )}
        {state.step === 2 && (
          <GoalsStep
            goals={state.goals}
            onGoalsChange={(val) => dispatch({ type: "SET_GOALS", payload: val })}
          />
        )}
        {state.step === 3 && (
          <SplitStep
            splitType={state.splitType}
            programName={state.programName}
            onSplitTypeChange={(val) => dispatch({ type: "SET_SPLIT_TYPE", payload: val })}
            onProgramNameChange={(val) => dispatch({ type: "SET_PROGRAM_NAME", payload: val })}
          />
        )}
      </div>

      {state.error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {state.error}
        </div>
      )}

      <div className="flex gap-3 justify-between">
        <Button
          variant="outline"
          onClick={() => dispatch({ type: "PREV_STEP" })}
          disabled={state.step === 1}
        >
          Voltar
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canNext() || mutation.isPending}
          isLoading={mutation.isPending}
        >
          {state.step === 3 ? "Concluir" : "Avançar"}
        </Button>
      </div>
    </div>
  );
}
