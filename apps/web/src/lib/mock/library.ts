export interface Workout {
  id: string;
  name: string;
  exercises: number;
  image: string;
}

export interface TrainingProgram {
  id: string;
  name: string;
  image: string;
  tags: string[];
  workouts: Workout[];
}

export const libraryTemplates = [
  "Costas e bíceps",
  "Superior",
  "Inferior",
  "Mobilidade",
  "Antebraços",
  "Cervical",
  "Alongamentos",
  "Superior 2",
];

export const mockProgram: TrainingProgram = {
  id: "abc-def",
  name: "ABC DEF",
  image:
    "https://images.unsplash.com/photo-1570805234093-c456b5c5a193?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  tags: ["6 treinos", "Hipertrofia"],
  workouts: [
    {
      id: "a-lower-1",
      name: "A – LOWER 1",
      exercises: 8,
      image:
        "https://images.unsplash.com/photo-1641785041080-54b0413a2aa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      id: "b-push",
      name: "B – PUSH",
      exercises: 9,
      image:
        "https://images.unsplash.com/photo-1775313091497-40c958123586?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      id: "c-pull",
      name: "C – PULL",
      exercises: 10,
      image:
        "https://images.unsplash.com/photo-1585152969027-6e1d63f51630?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      id: "d-lower-2",
      name: "D – LOWER 2",
      exercises: 9,
      image:
        "https://images.unsplash.com/photo-1766287451324-9f679a2266a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      id: "e-peito-costas",
      name: "E – PEITO + COSTAS",
      exercises: 7,
      image:
        "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      id: "f-ombro-bracos",
      name: "F – OMBRO e BRAÇOS",
      exercises: 9,
      image:
        "https://images.unsplash.com/photo-1659350774802-a7abd7b75dc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
  ],
};
