import { prisma } from "../src";

async function main() {
  // ─── 1. Muscle Groups ─────────────────────────────────────────────────────
  const muscleGroups: Record<string, string> = {};
  const mgData = [
    { name: "Peito", slug: "peito" },
    { name: "Costas", slug: "costas" },
    { name: "Ombros", slug: "ombros" },
    { name: "Bíceps", slug: "biceps" },
    { name: "Tríceps", slug: "triceps" },
    { name: "Pernas", slug: "pernas" },
  ];
  for (const mg of mgData) {
    const r = await prisma.muscleGroup.upsert({
      where: { slug: mg.slug },
      update: { name: mg.name },
      create: mg,
    });
    muscleGroups[mg.slug] = r.id;
  }
  console.log(`[seed] ${mgData.length} grupos musculares OK`);

  // ─── 2. Equipment ─────────────────────────────────────────────────────────
  const equipment: Record<string, string> = {};
  const eqData = [
    { name: "Barra", slug: "barra" },
    { name: "Halteres", slug: "halteres" },
    { name: "Máquina", slug: "maquina" },
  ];
  for (const eq of eqData) {
    const r = await prisma.equipment.upsert({
      where: { slug: eq.slug },
      update: { name: eq.name },
      create: eq,
    });
    equipment[eq.slug] = r.id;
  }
  console.log(`[seed] ${eqData.length} equipamentos OK`);

  // ─── 3. Exercises ─────────────────────────────────────────────────────────
  const exercises: Record<string, string> = {};
  const exerciseData: Array<{
    name: string;
    primary: string;
    secondary: string[];
    eq: string[];
  }> = [
    {
      name: "Supino Reto",
      primary: "peito",
      secondary: ["triceps", "ombros"],
      eq: ["barra"],
    },
    {
      name: "Agachamento",
      primary: "pernas",
      secondary: [],
      eq: ["barra"],
    },
    {
      name: "Levantamento Terra",
      primary: "costas",
      secondary: ["pernas"],
      eq: ["barra"],
    },
    {
      name: "Desenvolvimento com Barra",
      primary: "ombros",
      secondary: ["triceps"],
      eq: ["barra"],
    },
    {
      name: "Remada Curvada",
      primary: "costas",
      secondary: ["biceps"],
      eq: ["barra"],
    },
    {
      name: "Puxada Frontal",
      primary: "costas",
      secondary: ["biceps"],
      eq: ["maquina"],
    },
    {
      name: "Rosca Direta",
      primary: "biceps",
      secondary: [],
      eq: ["barra", "halteres"],
    },
    {
      name: "Tríceps Testa",
      primary: "triceps",
      secondary: [],
      eq: ["barra"],
    },
    {
      name: "Leg Press",
      primary: "pernas",
      secondary: [],
      eq: ["maquina"],
    },
    {
      name: "Stiff",
      primary: "pernas",
      secondary: ["costas"],
      eq: ["barra"],
    },
    {
      name: "Afundo",
      primary: "pernas",
      secondary: [],
      eq: ["halteres"],
    },
    {
      name: "Crucifixo",
      primary: "peito",
      secondary: [],
      eq: ["halteres"],
    },
    {
      name: "Elevação Lateral",
      primary: "ombros",
      secondary: [],
      eq: ["halteres"],
    },
    {
      name: "Barra Fixa",
      primary: "costas",
      secondary: ["biceps"],
      eq: [],
    },
    {
      name: "Mergulho",
      primary: "triceps",
      secondary: ["peito"],
      eq: [],
    },
  ];

  for (const ex of exerciseData) {
    // Idempotente: busca por nome + tenantId null (global)
    let existing = await prisma.exercise.findFirst({
      where: { name: ex.name, tenantId: null },
    });
    if (!existing) {
      existing = await prisma.exercise.create({
        data: { name: ex.name, tenantId: null },
      });
    }
    exercises[ex.name] = existing.id;

    // Upsert primary muscle group
    const primaryMgId = muscleGroups[ex.primary];
    if (primaryMgId) {
      await prisma.exerciseMuscleGroup.upsert({
        where: {
          exerciseId_muscleGroupId: {
            exerciseId: existing.id,
            muscleGroupId: primaryMgId,
          },
        },
        update: { isPrimary: true },
        create: {
          exerciseId: existing.id,
          muscleGroupId: primaryMgId,
          isPrimary: true,
        },
      });
    }

    // Upsert secondary muscle groups
    for (const sec of ex.secondary) {
      const secMgId = muscleGroups[sec];
      if (secMgId) {
        await prisma.exerciseMuscleGroup.upsert({
          where: {
            exerciseId_muscleGroupId: {
              exerciseId: existing.id,
              muscleGroupId: secMgId,
            },
          },
          update: { isPrimary: false },
          create: {
            exerciseId: existing.id,
            muscleGroupId: secMgId,
            isPrimary: false,
          },
        });
      }
    }

    // Upsert equipment
    for (const eqSlug of ex.eq) {
      const eqId = equipment[eqSlug];
      if (eqId) {
        await prisma.exerciseEquipment.upsert({
          where: {
            exerciseId_equipmentId: {
              exerciseId: existing.id,
              equipmentId: eqId,
            },
          },
          update: {},
          create: { exerciseId: existing.id, equipmentId: eqId },
        });
      }
    }
  }
  console.log(`[seed] ${exerciseData.length} exercícios OK`);

  // ─── 4. Template Strategies ───────────────────────────────────────────────
  // Limpar templates existentes para re-seed idempotente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).strategy.deleteMany({ where: { isTemplate: true } });

  type WorkoutDef = {
    name: string;
    order: number;
    exercises: Array<{
      exerciseName: string;
      order: number;
      sets: number;
      reps: string;
      kg: string;
    }>;
  };

  async function createTemplate(opts: {
    name: string;
    type: string;
    description: string;
    workouts: WorkoutDef[];
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const strategy = await (prisma as any).strategy.create({
      data: {
        name: opts.name,
        type: opts.type,
        description: opts.description,
        isTemplate: true,
        tenantId: null,
        isActive: true,
      },
    });

    for (const wo of opts.workouts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const workout = await (prisma as any).workout.create({
        data: {
          strategyId: strategy.id,
          tenantId: null,
          name: wo.name,
          order: wo.order,
        },
      });

      for (const ex of wo.exercises) {
        const exId = exercises[ex.exerciseName];
        if (!exId) {
          console.warn(`[seed] Exercício não encontrado: "${ex.exerciseName}"`);
          continue;
        }
        const we = await prisma.workoutExercise.create({
          data: {
            workoutId: workout.id,
            exerciseId: exId,
            order: ex.order,
            restSeconds: 90,
          },
        });
        for (let i = 1; i <= ex.sets; i++) {
          await prisma.plannedSet.create({
            data: {
              workoutExerciseId: we.id,
              setNumber: i,
              targetReps: ex.reps,
              targetKg: ex.kg,
            },
          });
        }
      }
    }

    console.log(`[seed] Template "${opts.name}" criado (${opts.workouts.length} treinos)`);
  }

  // Template 1: PPL Iniciante (6 treinos)
  await createTemplate({
    name: "PPL — Iniciante",
    type: "PPL",
    description: "6 treinos por semana com foco em push/pull/legs.",
    workouts: [
      {
        name: "Push A",
        order: 1,
        exercises: [
          { exerciseName: "Supino Reto", order: 1, sets: 4, reps: "8-10", kg: "60" },
          { exerciseName: "Desenvolvimento com Barra", order: 2, sets: 3, reps: "8-10", kg: "40" },
          { exerciseName: "Tríceps Testa", order: 3, sets: 3, reps: "10-12", kg: "20" },
        ],
      },
      {
        name: "Pull A",
        order: 2,
        exercises: [
          { exerciseName: "Puxada Frontal", order: 1, sets: 4, reps: "8-10", kg: "50" },
          { exerciseName: "Remada Curvada", order: 2, sets: 4, reps: "8-10", kg: "60" },
          { exerciseName: "Rosca Direta", order: 3, sets: 3, reps: "10-12", kg: "30" },
        ],
      },
      {
        name: "Legs A",
        order: 3,
        exercises: [
          { exerciseName: "Agachamento", order: 1, sets: 4, reps: "6-8", kg: "80" },
          { exerciseName: "Leg Press", order: 2, sets: 3, reps: "10-12", kg: "120" },
          { exerciseName: "Stiff", order: 3, sets: 3, reps: "10-12", kg: "60" },
        ],
      },
      {
        name: "Push B",
        order: 4,
        exercises: [
          { exerciseName: "Crucifixo", order: 1, sets: 3, reps: "12-15", kg: "15" },
          { exerciseName: "Elevação Lateral", order: 2, sets: 3, reps: "12-15", kg: "8" },
          { exerciseName: "Mergulho", order: 3, sets: 3, reps: "8-10", kg: "0" },
        ],
      },
      {
        name: "Pull B",
        order: 5,
        exercises: [
          { exerciseName: "Barra Fixa", order: 1, sets: 4, reps: "6-8", kg: "0" },
          { exerciseName: "Remada Curvada", order: 2, sets: 3, reps: "10-12", kg: "50" },
          { exerciseName: "Rosca Direta", order: 3, sets: 3, reps: "12-15", kg: "25" },
        ],
      },
      {
        name: "Legs B",
        order: 6,
        exercises: [
          { exerciseName: "Levantamento Terra", order: 1, sets: 4, reps: "5", kg: "100" },
          { exerciseName: "Afundo", order: 2, sets: 3, reps: "10 cada", kg: "20" },
          { exerciseName: "Leg Press", order: 3, sets: 3, reps: "15", kg: "100" },
        ],
      },
    ],
  });

  // Template 2: Upper/Lower (4 treinos)
  await createTemplate({
    name: "Upper/Lower",
    type: "UPPER_LOWER",
    description: "4 treinos por semana alternando upper e lower body.",
    workouts: [
      {
        name: "Upper A",
        order: 1,
        exercises: [
          { exerciseName: "Supino Reto", order: 1, sets: 4, reps: "6-8", kg: "70" },
          { exerciseName: "Remada Curvada", order: 2, sets: 4, reps: "6-8", kg: "70" },
          { exerciseName: "Desenvolvimento com Barra", order: 3, sets: 3, reps: "8-10", kg: "45" },
          { exerciseName: "Rosca Direta", order: 4, sets: 3, reps: "10-12", kg: "30" },
        ],
      },
      {
        name: "Lower A",
        order: 2,
        exercises: [
          { exerciseName: "Agachamento", order: 1, sets: 4, reps: "6-8", kg: "90" },
          { exerciseName: "Stiff", order: 2, sets: 4, reps: "8-10", kg: "70" },
          { exerciseName: "Afundo", order: 3, sets: 3, reps: "10 cada", kg: "24" },
          { exerciseName: "Leg Press", order: 4, sets: 3, reps: "12-15", kg: "130" },
        ],
      },
      {
        name: "Upper B",
        order: 3,
        exercises: [
          { exerciseName: "Crucifixo", order: 1, sets: 4, reps: "10-12", kg: "20" },
          { exerciseName: "Barra Fixa", order: 2, sets: 4, reps: "6-8", kg: "0" },
          { exerciseName: "Elevação Lateral", order: 3, sets: 3, reps: "12-15", kg: "10" },
          { exerciseName: "Tríceps Testa", order: 4, sets: 3, reps: "10-12", kg: "25" },
        ],
      },
      {
        name: "Lower B",
        order: 4,
        exercises: [
          { exerciseName: "Levantamento Terra", order: 1, sets: 4, reps: "5", kg: "110" },
          { exerciseName: "Leg Press", order: 2, sets: 3, reps: "15", kg: "140" },
          { exerciseName: "Stiff", order: 3, sets: 3, reps: "12", kg: "60" },
        ],
      },
    ],
  });

  // Template 3: ABC Intermediário (3 treinos)
  await createTemplate({
    name: "ABC — Intermediário",
    type: "ABC",
    description: "3 treinos por semana: A (Peito/Tríceps), B (Costas/Bíceps), C (Pernas/Ombros).",
    workouts: [
      {
        name: "A — Peito e Tríceps",
        order: 1,
        exercises: [
          { exerciseName: "Supino Reto", order: 1, sets: 4, reps: "8-10", kg: "70" },
          { exerciseName: "Crucifixo", order: 2, sets: 3, reps: "12-15", kg: "18" },
          { exerciseName: "Mergulho", order: 3, sets: 3, reps: "8-10", kg: "0" },
          { exerciseName: "Tríceps Testa", order: 4, sets: 3, reps: "10-12", kg: "25" },
        ],
      },
      {
        name: "B — Costas e Bíceps",
        order: 2,
        exercises: [
          { exerciseName: "Barra Fixa", order: 1, sets: 4, reps: "6-8", kg: "0" },
          { exerciseName: "Remada Curvada", order: 2, sets: 4, reps: "8-10", kg: "65" },
          { exerciseName: "Puxada Frontal", order: 3, sets: 3, reps: "10-12", kg: "55" },
          { exerciseName: "Rosca Direta", order: 4, sets: 3, reps: "10-12", kg: "32" },
        ],
      },
      {
        name: "C — Pernas e Ombros",
        order: 3,
        exercises: [
          { exerciseName: "Agachamento", order: 1, sets: 4, reps: "8-10", kg: "85" },
          { exerciseName: "Leg Press", order: 2, sets: 3, reps: "12", kg: "125" },
          { exerciseName: "Desenvolvimento com Barra", order: 3, sets: 4, reps: "8-10", kg: "48" },
          { exerciseName: "Elevação Lateral", order: 4, sets: 3, reps: "12-15", kg: "10" },
        ],
      },
    ],
  });

  // Template 4: Full Body Iniciante (3 treinos)
  await createTemplate({
    name: "Full Body — Iniciante",
    type: "FULL_BODY",
    description: "3 treinos por semana trabalhando o corpo todo em cada sessão.",
    workouts: [
      {
        name: "Full Body A",
        order: 1,
        exercises: [
          { exerciseName: "Supino Reto", order: 1, sets: 3, reps: "10-12", kg: "50" },
          { exerciseName: "Agachamento", order: 2, sets: 3, reps: "10-12", kg: "60" },
          { exerciseName: "Remada Curvada", order: 3, sets: 3, reps: "10-12", kg: "50" },
        ],
      },
      {
        name: "Full Body B",
        order: 2,
        exercises: [
          { exerciseName: "Desenvolvimento com Barra", order: 1, sets: 3, reps: "10-12", kg: "35" },
          { exerciseName: "Levantamento Terra", order: 2, sets: 3, reps: "8", kg: "80" },
          { exerciseName: "Puxada Frontal", order: 3, sets: 3, reps: "10-12", kg: "45" },
        ],
      },
      {
        name: "Full Body C",
        order: 3,
        exercises: [
          { exerciseName: "Crucifixo", order: 1, sets: 3, reps: "12-15", kg: "14" },
          { exerciseName: "Afundo", order: 2, sets: 3, reps: "10 cada", kg: "18" },
          { exerciseName: "Rosca Direta", order: 3, sets: 3, reps: "12-15", kg: "24" },
        ],
      },
    ],
  });

  console.log("[seed] Concluído com sucesso.");
}

main()
  .catch((e) => {
    console.error("[seed] Erro:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
