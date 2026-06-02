export interface PlannedSet {
  setNumber: number;
  targetReps: number | string;
  targetKg?: number | string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup: string;
  image: string;
  restSeconds: number;
  sets: PlannedSet[];
}

export interface WorkoutDetail {
  id: string;
  name: string;
  programId: string;
  exercises: WorkoutExercise[];
}

export interface ExecutedSet {
  setNumber: number;
  kg?: number;
  reps?: number;
  completedAt?: string;
}

export interface ExecutedExercise {
  exerciseId: string;
  notes: string;
  sets: ExecutedSet[];
}

export interface WorkoutSession {
  workoutId: string;
  startedAt: string;
  exercises: ExecutedExercise[];
}

export const mockWorkouts: Record<string, WorkoutDetail> = {
  "a-lower-1": {
    id: "a-lower-1",
    name: "A – LOWER 1",
    programId: "abc-def",
    exercises: [
      {
        id: "agachamento-livre",
        name: "Agachamento Livre",
        muscleGroup: "Quadríceps",
        image: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 120,
        sets: [
          { setNumber: 1, targetReps: 8, targetKg: 80 },
          { setNumber: 2, targetReps: 8, targetKg: 80 },
          { setNumber: 3, targetReps: 8, targetKg: 80 },
          { setNumber: 4, targetReps: 8, targetKg: 80 },
        ],
      },
      {
        id: "leg-press",
        name: "Leg Press 45°",
        muscleGroup: "Quadríceps",
        image: "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 90,
        sets: [
          { setNumber: 1, targetReps: 12, targetKg: 120 },
          { setNumber: 2, targetReps: 12, targetKg: 120 },
          { setNumber: 3, targetReps: 12, targetKg: 120 },
        ],
      },
      {
        id: "romanian-deadlift",
        name: "Romanian Deadlift",
        muscleGroup: "Posterior",
        image: "https://images.unsplash.com/photo-1585152969027-6e1d63f51630?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 90,
        sets: [
          { setNumber: 1, targetReps: 10, targetKg: 60 },
          { setNumber: 2, targetReps: 10, targetKg: 60 },
          { setNumber: 3, targetReps: 10, targetKg: 60 },
        ],
      },
      {
        id: "extensao-joelho",
        name: "Extensão de Joelho",
        muscleGroup: "Quadríceps",
        image: "https://images.unsplash.com/photo-1766287451324-9f679a2266a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: "10-15" },
          { setNumber: 2, targetReps: "10-15" },
          { setNumber: 3, targetReps: "10-15" },
        ],
      },
      {
        id: "panturrilha-em-pe",
        name: "Panturrilha em Pé",
        muscleGroup: "Panturrilha",
        image: "https://images.unsplash.com/photo-1641785041080-54b0413a2aa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: 15 },
          { setNumber: 2, targetReps: 15 },
          { setNumber: 3, targetReps: 15 },
          { setNumber: 4, targetReps: 15 },
        ],
      },
    ],
  },

  "b-push": {
    id: "b-push",
    name: "B – PUSH",
    programId: "abc-def",
    exercises: [
      {
        id: "supino-reto",
        name: "Supino Reto",
        muscleGroup: "Peito",
        image: "https://images.unsplash.com/photo-1652363722856-214ce6a06a44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 120,
        sets: [
          { setNumber: 1, targetReps: 8, targetKg: 70 },
          { setNumber: 2, targetReps: 8, targetKg: 70 },
          { setNumber: 3, targetReps: 8, targetKg: 70 },
          { setNumber: 4, targetReps: 8, targetKg: 70 },
        ],
      },
      {
        id: "desenvolvimento-ombro",
        name: "Desenvolvimento com Halteres",
        muscleGroup: "Ombro",
        image: "https://images.unsplash.com/photo-1659350774802-a7abd7b75dc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 90,
        sets: [
          { setNumber: 1, targetReps: 10, targetKg: 20 },
          { setNumber: 2, targetReps: 10, targetKg: 20 },
          { setNumber: 3, targetReps: 10, targetKg: 20 },
        ],
      },
      {
        id: "elevacao-lateral",
        name: "Elevação Lateral",
        muscleGroup: "Ombro",
        image: "https://images.unsplash.com/photo-1775313091497-40c958123586?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: "12-15", targetKg: 10 },
          { setNumber: 2, targetReps: "12-15", targetKg: 10 },
          { setNumber: 3, targetReps: "12-15", targetKg: 10 },
          { setNumber: 4, targetReps: "12-15", targetKg: 10 },
        ],
      },
      {
        id: "triceps-pulley",
        name: "Tríceps Pulley",
        muscleGroup: "Tríceps",
        image: "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: 12, targetKg: 30 },
          { setNumber: 2, targetReps: 12, targetKg: 30 },
          { setNumber: 3, targetReps: 12, targetKg: 30 },
        ],
      },
    ],
  },

  "c-pull": {
    id: "c-pull",
    name: "C – PULL",
    programId: "abc-def",
    exercises: [
      {
        id: "puxada-frontal",
        name: "Puxada Frontal",
        muscleGroup: "Costas",
        image: "https://images.unsplash.com/photo-1641785041080-54b0413a2aa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 90,
        sets: [
          { setNumber: 1, targetReps: 10, targetKg: 55 },
          { setNumber: 2, targetReps: 10, targetKg: 55 },
          { setNumber: 3, targetReps: 10, targetKg: 55 },
          { setNumber: 4, targetReps: 10, targetKg: 55 },
        ],
      },
      {
        id: "remada-curvada",
        name: "Remada Curvada",
        muscleGroup: "Costas",
        image: "https://images.unsplash.com/photo-1585152969027-6e1d63f51630?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 90,
        sets: [
          { setNumber: 1, targetReps: 10, targetKg: 60 },
          { setNumber: 2, targetReps: 10, targetKg: 60 },
          { setNumber: 3, targetReps: 10, targetKg: 60 },
        ],
      },
      {
        id: "rosca-direta",
        name: "Rosca Direta",
        muscleGroup: "Bíceps",
        image: "https://images.unsplash.com/photo-1766287451324-9f679a2266a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: 12, targetKg: 14 },
          { setNumber: 2, targetReps: 12, targetKg: 14 },
          { setNumber: 3, targetReps: 12, targetKg: 14 },
        ],
      },
      {
        id: "face-pull",
        name: "Face Pull",
        muscleGroup: "Ombro",
        image: "https://images.unsplash.com/photo-1659350774802-a7abd7b75dc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: "15-20", targetKg: 20 },
          { setNumber: 2, targetReps: "15-20", targetKg: 20 },
          { setNumber: 3, targetReps: "15-20", targetKg: 20 },
        ],
      },
    ],
  },

  "d-lower-2": {
    id: "d-lower-2",
    name: "D – LOWER 2",
    programId: "abc-def",
    exercises: [
      {
        id: "lever-kneeling-leg-curl",
        name: "Lever Kneeling Leg Curl",
        muscleGroup: "Pernas",
        image: "https://images.unsplash.com/photo-1641785041080-54b0413a2aa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 90,
        sets: [
          { setNumber: 1, targetReps: 10 },
          { setNumber: 2, targetReps: 10 },
          { setNumber: 3, targetReps: 10 },
        ],
      },
      {
        id: "lever-reverse-hack-squat",
        name: "Lever Reverse Vertical Hack Squat",
        muscleGroup: "Quadríceps",
        image: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 90,
        sets: [
          { setNumber: 1, targetReps: 12, targetKg: 50 },
          { setNumber: 2, targetReps: 12, targetKg: 50 },
          { setNumber: 3, targetReps: 12, targetKg: 50 },
        ],
      },
      {
        id: "lever-hip-thrust",
        name: "Lever Hip Thrust",
        muscleGroup: "Glúteos",
        image: "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 90,
        sets: [
          { setNumber: 1, targetReps: "8-15", targetKg: "40-50" },
          { setNumber: 2, targetReps: "8-15", targetKg: "40-50" },
          { setNumber: 3, targetReps: "8-15", targetKg: "40-50" },
        ],
      },
      {
        id: "romanian-deadlift-d",
        name: "Romanian Deadlift",
        muscleGroup: "Posterior",
        image: "https://images.unsplash.com/photo-1585152969027-6e1d63f51630?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 90,
        sets: [
          { setNumber: 1, targetReps: 10 },
          { setNumber: 2, targetReps: 10 },
          { setNumber: 3, targetReps: 10 },
        ],
      },
      {
        id: "lever-seated-leg-curl",
        name: "Lever Seated Leg Curl",
        muscleGroup: "Posterior",
        image: "https://images.unsplash.com/photo-1766287451324-9f679a2266a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: "8-15", targetKg: "60-85" },
          { setNumber: 2, targetReps: "8-15", targetKg: "60-85" },
          { setNumber: 3, targetReps: "8-15", targetKg: "60-85" },
          { setNumber: 4, targetReps: "8-15", targetKg: "60-85" },
        ],
      },
      {
        id: "lever-leg-extension-d",
        name: "Lever Leg Extension",
        muscleGroup: "Quadríceps",
        image: "https://images.unsplash.com/photo-1775313091497-40c958123586?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: 10 },
          { setNumber: 2, targetReps: 10 },
          { setNumber: 3, targetReps: 10 },
        ],
      },
      {
        id: "lever-seated-hip-abduction",
        name: "Lever Seated Hip Abduction",
        muscleGroup: "Glúteos",
        image: "https://images.unsplash.com/photo-1659350774802-a7abd7b75dc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: "12-15" },
          { setNumber: 2, targetReps: "12-15" },
          { setNumber: 3, targetReps: "12-15" },
        ],
      },
    ],
  },

  "e-peito-costas": {
    id: "e-peito-costas",
    name: "E – PEITO + COSTAS",
    programId: "abc-def",
    exercises: [
      {
        id: "supino-inclinado",
        name: "Supino Inclinado com Halteres",
        muscleGroup: "Peito",
        image: "https://images.unsplash.com/photo-1652363722856-214ce6a06a44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 90,
        sets: [
          { setNumber: 1, targetReps: 10, targetKg: 24 },
          { setNumber: 2, targetReps: 10, targetKg: 24 },
          { setNumber: 3, targetReps: 10, targetKg: 24 },
        ],
      },
      {
        id: "puxada-aberta",
        name: "Puxada Aberta",
        muscleGroup: "Costas",
        image: "https://images.unsplash.com/photo-1641785041080-54b0413a2aa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 90,
        sets: [
          { setNumber: 1, targetReps: 10, targetKg: 50 },
          { setNumber: 2, targetReps: 10, targetKg: 50 },
          { setNumber: 3, targetReps: 10, targetKg: 50 },
        ],
      },
      {
        id: "crossover-cabo",
        name: "Crossover no Cabo",
        muscleGroup: "Peito",
        image: "https://images.unsplash.com/photo-1775313091497-40c958123586?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: "12-15", targetKg: 15 },
          { setNumber: 2, targetReps: "12-15", targetKg: 15 },
          { setNumber: 3, targetReps: "12-15", targetKg: 15 },
        ],
      },
      {
        id: "remada-baixa",
        name: "Remada Baixa",
        muscleGroup: "Costas",
        image: "https://images.unsplash.com/photo-1585152969027-6e1d63f51630?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: 12, targetKg: 50 },
          { setNumber: 2, targetReps: 12, targetKg: 50 },
          { setNumber: 3, targetReps: 12, targetKg: 50 },
        ],
      },
    ],
  },

  "f-ombro-bracos": {
    id: "f-ombro-bracos",
    name: "F – OMBRO e BRAÇOS",
    programId: "abc-def",
    exercises: [
      {
        id: "desenvolvimento-militar",
        name: "Desenvolvimento Militar",
        muscleGroup: "Ombro",
        image: "https://images.unsplash.com/photo-1659350774802-a7abd7b75dc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 90,
        sets: [
          { setNumber: 1, targetReps: 8, targetKg: 40 },
          { setNumber: 2, targetReps: 8, targetKg: 40 },
          { setNumber: 3, targetReps: 8, targetKg: 40 },
          { setNumber: 4, targetReps: 8, targetKg: 40 },
        ],
      },
      {
        id: "elevacao-frontal",
        name: "Elevação Frontal",
        muscleGroup: "Ombro",
        image: "https://images.unsplash.com/photo-1775313091497-40c958123586?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: 12, targetKg: 8 },
          { setNumber: 2, targetReps: 12, targetKg: 8 },
          { setNumber: 3, targetReps: 12, targetKg: 8 },
        ],
      },
      {
        id: "rosca-martelo",
        name: "Rosca Martelo",
        muscleGroup: "Bíceps",
        image: "https://images.unsplash.com/photo-1766287451324-9f679a2266a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: 12, targetKg: 16 },
          { setNumber: 2, targetReps: 12, targetKg: 16 },
          { setNumber: 3, targetReps: 12, targetKg: 16 },
        ],
      },
      {
        id: "triceps-testa",
        name: "Tríceps Testa",
        muscleGroup: "Tríceps",
        image: "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: 12, targetKg: 25 },
          { setNumber: 2, targetReps: 12, targetKg: 25 },
          { setNumber: 3, targetReps: 12, targetKg: 25 },
        ],
      },
    ],
  },
};

export const mockLastSession: WorkoutSession = {
  workoutId: "d-lower-2",
  startedAt: "2025-05-14T21:53:00.000Z",
  exercises: [
    {
      exerciseId: "lever-kneeling-leg-curl",
      notes: "",
      sets: [
        { setNumber: 1, kg: 10, reps: 10, completedAt: "2025-05-14T21:55:00.000Z" },
        { setNumber: 2, kg: 10, reps: 10, completedAt: "2025-05-14T21:57:00.000Z" },
        { setNumber: 3, kg: 10, reps: 10, completedAt: "2025-05-14T21:59:00.000Z" },
      ],
    },
    {
      exerciseId: "lever-reverse-hack-squat",
      notes: "",
      sets: [
        { setNumber: 1, kg: 50, reps: 12, completedAt: "2025-05-14T22:02:00.000Z" },
        { setNumber: 2, kg: 50, reps: 12, completedAt: "2025-05-14T22:04:00.000Z" },
        { setNumber: 3, kg: 50, reps: 10, completedAt: "2025-05-14T22:06:00.000Z" },
      ],
    },
    {
      exerciseId: "lever-hip-thrust",
      notes: "",
      sets: [
        { setNumber: 1, kg: 40, reps: 12, completedAt: "2025-05-14T22:09:00.000Z" },
        { setNumber: 2, kg: 45, reps: 10, completedAt: "2025-05-14T22:11:00.000Z" },
        { setNumber: 3, kg: 45, reps: 8, completedAt: "2025-05-14T22:13:00.000Z" },
      ],
    },
    {
      exerciseId: "romanian-deadlift-d",
      notes: "",
      sets: [
        { setNumber: 1, reps: 10, completedAt: "2025-05-14T22:16:00.000Z" },
        { setNumber: 2, reps: 10, completedAt: "2025-05-14T22:18:00.000Z" },
        { setNumber: 3, reps: 10, completedAt: "2025-05-14T22:20:00.000Z" },
      ],
    },
    {
      exerciseId: "lever-seated-leg-curl",
      notes: "",
      sets: [
        { setNumber: 1, kg: 60, reps: 15, completedAt: "2025-05-14T22:23:00.000Z" },
        { setNumber: 2, kg: 65, reps: 12, completedAt: "2025-05-14T22:25:00.000Z" },
        { setNumber: 3, kg: 70, reps: 10, completedAt: "2025-05-14T22:27:00.000Z" },
        { setNumber: 4, kg: 70, reps: 8, completedAt: "2025-05-14T22:29:00.000Z" },
      ],
    },
    {
      exerciseId: "lever-leg-extension-d",
      notes: "",
      sets: [
        { setNumber: 1, reps: 10, completedAt: "2025-05-14T22:32:00.000Z" },
        { setNumber: 2, reps: 10, completedAt: "2025-05-14T22:34:00.000Z" },
        { setNumber: 3, reps: 10, completedAt: "2025-05-14T22:36:00.000Z" },
      ],
    },
    {
      exerciseId: "lever-seated-hip-abduction",
      notes: "",
      sets: [
        { setNumber: 1, reps: 15, completedAt: "2025-05-14T22:39:00.000Z" },
        { setNumber: 2, reps: 15, completedAt: "2025-05-14T22:41:00.000Z" },
        { setNumber: 3, reps: 12, completedAt: "2025-05-14T22:43:00.000Z" },
      ],
    },
  ],
};

export const mockLastSessions: Record<string, WorkoutSession> = {
  "d-lower-2": mockLastSession,
};
