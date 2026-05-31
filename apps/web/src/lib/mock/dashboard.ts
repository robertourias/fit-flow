export interface DashboardUser {
  name: string;
  initials: string;
  email: string;
  plan: "free" | "pro";
  planUsed: number;
  planLimit: number;
}

export interface DashboardMetrics {
  diasEstaSemana: number;
  treinosNoMes: number;
  treinosNoMesDelta: number;
  diasSequencia: number;
  volumeSemanal: number;
}

export interface TreinoHoje {
  estrategia: string;
  nome: string;
  exercicios: string[];
  diaDaSemana: string;
  duracao: string;
}

export interface VolumeData {
  dia: string;
  volume: number;
}

export interface MuscleGroup {
  nome: string;
  percentual: number;
}

export interface UpcomingWorkout {
  dayAbbr: string;
  dayNum: number;
  treino: string;
  numExercicios: number;
  hasWorkout: boolean;
}

export const mockUser: DashboardUser = {
  name: "Beto",
  initials: "B",
  email: "beto@exemplo.com",
  plan: "free",
  planUsed: 3,
  planLimit: 6,
};

export const mockMetrics: DashboardMetrics = {
  diasEstaSemana: 4,
  treinosNoMes: 12,
  treinosNoMesDelta: 3,
  diasSequencia: 3,
  volumeSemanal: 8400,
};

export const mockTreinoHoje: TreinoHoje = {
  estrategia: "Push — Semana 2",
  nome: "Treino B — Push",
  exercicios: ["Supino inclinado", "Desenvolvimento", "Tríceps corda"],
  diaDaSemana: "Quinta-feira",
  duracao: "60 min",
};

export const mockVolumeData: VolumeData[] = [
  { dia: "Seg", volume: 2200 },
  { dia: "Ter", volume: 0 },
  { dia: "Qua", volume: 3200 },
  { dia: "Qui", volume: 0 },
  { dia: "Sex", volume: 3000 },
  { dia: "Sáb", volume: 0 },
  { dia: "Dom", volume: 0 },
];

export const mockMuscleGroups: MuscleGroup[] = [
  { nome: "Peito", percentual: 75 },
  { nome: "Tríceps", percentual: 60 },
  { nome: "Ombros", percentual: 45 },
  { nome: "Costas", percentual: 30 },
  { nome: "Bíceps", percentual: 20 },
  { nome: "Pernas", percentual: 10 },
];

export const mockUpcomingWorkouts: UpcomingWorkout[] = [
  { dayAbbr: "Sex", dayNum: 30, treino: "Treino C — Pull", numExercicios: 5, hasWorkout: true },
  { dayAbbr: "Sáb", dayNum: 31, treino: "Treino D — Legs", numExercicios: 4, hasWorkout: true },
  { dayAbbr: "Dom", dayNum: 1, treino: "Descanso", numExercicios: 0, hasWorkout: false },
];

export const mockTreinoDates: number[] = [1, 5, 8, 13, 15, 16, 20, 22, 27, 29];
