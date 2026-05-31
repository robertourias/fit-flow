export type ExerciseType = "Força" | "Cardio";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  type: ExerciseType;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  image: string;
  bookmarkCount: string;
}

export const mockExercises: Exercise[] = [
  {
    id: "supino-reto",
    name: "Supino Reto",
    muscleGroup: "Peito",
    equipment: "Barra",
    type: "Força",
    primaryMuscles: ["Peitoral maior"],
    secondaryMuscles: ["Deltóide anterior", "Tríceps"],
    image: "https://images.unsplash.com/photo-1652363722856-214ce6a06a44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    bookmarkCount: "140k",
  },
  {
    id: "supino-inclinado",
    name: "Supino Inclinado",
    muscleGroup: "Peito",
    equipment: "Halteres",
    type: "Força",
    primaryMuscles: ["Peitoral superior"],
    secondaryMuscles: ["Deltóide anterior", "Tríceps"],
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    bookmarkCount: "98k",
  },
  {
    id: "puxada-frontal",
    name: "Puxada Frontal",
    muscleGroup: "Costas",
    equipment: "Cabo",
    type: "Força",
    primaryMuscles: ["Grande dorsal"],
    secondaryMuscles: ["Bíceps", "Rombóide"],
    image: "https://images.unsplash.com/photo-1596357395328-bb8ef99affbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    bookmarkCount: "112k",
  },
  {
    id: "remada-curvada",
    name: "Remada Curvada",
    muscleGroup: "Costas",
    equipment: "Barra",
    type: "Força",
    primaryMuscles: ["Grande dorsal", "Rombóide"],
    secondaryMuscles: ["Bíceps", "Eretores da espinha"],
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    bookmarkCount: "87k",
  },
  {
    id: "desenvolvimento",
    name: "Desenvolvimento",
    muscleGroup: "Ombros",
    equipment: "Halteres",
    type: "Força",
    primaryMuscles: ["Deltóide médio"],
    secondaryMuscles: ["Trapézio", "Tríceps"],
    image: "https://images.unsplash.com/photo-1733517300919-ec69c1447345?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    bookmarkCount: "76k",
  },
  {
    id: "elevacao-lateral",
    name: "Elevação Lateral",
    muscleGroup: "Ombros",
    equipment: "Halteres",
    type: "Força",
    primaryMuscles: ["Deltóide lateral"],
    secondaryMuscles: ["Trapézio superior"],
    image: "https://images.unsplash.com/photo-1554344728-77cf90d9ed26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    bookmarkCount: "64k",
  },
  {
    id: "rosca-direta",
    name: "Rosca Direta",
    muscleGroup: "Bíceps",
    equipment: "Barra",
    type: "Força",
    primaryMuscles: ["Bíceps braquial"],
    secondaryMuscles: ["Braquiorradial", "Braquial"],
    image: "https://images.unsplash.com/photo-1772450014674-5b2035852e39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    bookmarkCount: "134k",
  },
  {
    id: "triceps-pulley",
    name: "Tríceps Pulley",
    muscleGroup: "Tríceps",
    equipment: "Cabo",
    type: "Força",
    primaryMuscles: ["Tríceps braquial"],
    secondaryMuscles: [],
    image: "https://images.unsplash.com/photo-1599577456698-e1e9ae4f4e5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    bookmarkCount: "92k",
  },
  {
    id: "agachamento",
    name: "Agachamento",
    muscleGroup: "Pernas",
    equipment: "Barra",
    type: "Força",
    primaryMuscles: ["Quadríceps", "Glúteo máximo"],
    secondaryMuscles: ["Isquiotibiais", "Panturrilhas", "Core"],
    image: "https://images.unsplash.com/photo-1734668470900-28982e41ce23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    bookmarkCount: "201k",
  },
  {
    id: "leg-press",
    name: "Leg Press",
    muscleGroup: "Pernas",
    equipment: "Máquina",
    type: "Força",
    primaryMuscles: ["Quadríceps"],
    secondaryMuscles: ["Glúteos", "Isquiotibiais"],
    image: "https://images.unsplash.com/photo-1738524107743-a62f57059b96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    bookmarkCount: "88k",
  },
  {
    id: "abdominal-crunch",
    name: "Abdominal Crunch",
    muscleGroup: "Abdômen",
    equipment: "Peso corporal",
    type: "Força",
    primaryMuscles: ["Reto abdominal"],
    secondaryMuscles: ["Oblíquos externos"],
    image: "https://images.unsplash.com/photo-1544033527-b192daee1f5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    bookmarkCount: "67k",
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    muscleGroup: "Glúteos",
    equipment: "Barra",
    type: "Força",
    primaryMuscles: ["Glúteo máximo"],
    secondaryMuscles: ["Isquiotibiais", "Core"],
    image: "https://images.unsplash.com/photo-1596357395328-bb8ef99affbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    bookmarkCount: "145k",
  },
];

export const muscleGroups = [
  { id: "todos", label: "Todos", image: "/exercises/muscles/todos.png" },
  { id: "Peito", label: "Peito", image: "/exercises/muscles/peito.png" },
  { id: "Costas", label: "Costas", image: "/exercises/muscles/costas.png" },
  { id: "Ombros", label: "Ombros", image: "/exercises/muscles/ombros.png" },
  { id: "Bíceps", label: "Bíceps", image: "/exercises/muscles/biceps.png" },
  { id: "Tríceps", label: "Tríceps", image: "/exercises/muscles/triceps.png" },
  { id: "Pernas", label: "Pernas", image: "/exercises/muscles/pernas.png" },
  { id: "Abdômen", label: "Abdômen", image: "/exercises/muscles/abdomen.png" },
  { id: "Glúteos", label: "Glúteos", image: "/exercises/muscles/gluteos.png" },
];

export const equipmentOptions = ["Todos", "Barra", "Halteres", "Cabo", "Máquina", "Peso corporal"];

export const typeOptions: Array<"Todos" | ExerciseType> = ["Todos", "Força", "Cardio"];
