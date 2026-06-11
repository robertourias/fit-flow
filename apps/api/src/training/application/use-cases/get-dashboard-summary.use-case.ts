import { Inject, Injectable } from "@nestjs/common";
import { WORKOUT_SESSIONS_REPOSITORY, WORKOUTS_REPOSITORY } from "../../training.tokens";
import { EXERCISES_REPOSITORY } from "../../../catalog/catalog.tokens";
import type { IWorkoutSessionsRepository } from "../../domain/repositories/workout-sessions.repository.interface";
import type { IWorkoutsRepository } from "../../domain/repositories/workouts.repository.interface";
import type { IExercisesRepository } from "../../../catalog/domain/repositories/exercises.repository.interface";
import type { Exercise } from "../../../catalog/domain/exercise.entity";
import { DashboardSummaryDto } from "../dto/dashboard-summary.dto";

@Injectable()
export class GetDashboardSummaryUseCase {
  private readonly WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

  constructor(
    @Inject(WORKOUT_SESSIONS_REPOSITORY)
    private readonly _workoutSessionsRepository: IWorkoutSessionsRepository,
    @Inject(WORKOUTS_REPOSITORY)
    private readonly _workoutsRepository: IWorkoutsRepository,
    @Inject(EXERCISES_REPOSITORY)
    private readonly _exercisesRepository: IExercisesRepository,
  ) {}

  async execute(tenantId: string): Promise<DashboardSummaryDto> {
    const now = new Date();
    const weekStart = this.startOfWeekMonday(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const monthStart = this.startOfMonth(now);
    const prevMonthStart = this.startOfMonth(now, -1);

    const sessions = await this._workoutSessionsRepository.findFinishedSince(tenantId, prevMonthStart);

    const volumeData = this.WEEKDAY_LABELS.map((dia) => ({ dia, volume: 0 }));
    const trainDatesSet = new Set<number>();
    const weekDaysSet = new Set<string>();
    let treinosNoMes = 0;
    let treinosMesAnterior = 0;
    let volumeSemanal = 0;
    const muscleSetCounts = new Map<string, number>();
    let totalSets = 0;
    const exerciseCache = new Map<string, Exercise | null>();

    for (const session of sessions) {
      const started = session.startedAt;
      const inMonth = started >= monthStart;
      const inWeek = started >= weekStart && started < weekEnd;

      if (inMonth) {
        treinosNoMes++;
        trainDatesSet.add(started.getDate());
      } else {
        treinosMesAnterior++;
      }

      if (inWeek) {
        weekDaysSet.add(this.dateKey(started));
        const dayIdx = (started.getDay() + 6) % 7;
        for (const ex of session.exercises) {
          for (const set of ex.executedSets) {
            const setVolume = (set.kg ?? 0) * (set.reps ?? 0);
            volumeData[dayIdx].volume += setVolume;
            volumeSemanal += setVolume;

            totalSets++;
            if (!exerciseCache.has(ex.exerciseId)) {
              exerciseCache.set(ex.exerciseId, await this._exercisesRepository.findById(ex.exerciseId));
            }
            const exercise = exerciseCache.get(ex.exerciseId);
            for (const mg of exercise?.muscleGroups.filter((m) => m.isPrimary) ?? []) {
              muscleSetCounts.set(mg.muscleGroup.name, (muscleSetCounts.get(mg.muscleGroup.name) ?? 0) + 1);
            }
          }
        }
      }
    }

    // Streaks: consecutive days ending today (or yesterday if no session today)
    const trainedDays = new Set(sessions.map((s) => this.dateKey(s.startedAt)));
    let diasSequencia = 0;
    const cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);
    if (!trainedDays.has(this.dateKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (trainedDays.has(this.dateKey(cursor))) {
      diasSequencia++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const muscleGroups = [...muscleSetCounts.entries()]
      .map(([nome, count]) => ({ nome, percentual: totalSets ? Math.round((count / totalSets) * 100) : 0 }))
      .sort((a, b) => b.percentual - a.percentual);

    const workoutsCount = await this._workoutsRepository.countByTenant(tenantId);

    const dto = new DashboardSummaryDto();
    dto.diasEstaSemana = weekDaysSet.size;
    dto.treinosNoMes = treinosNoMes;
    dto.treinosNoMesDelta = treinosNoMes - treinosMesAnterior;
    dto.diasSequencia = diasSequencia;
    dto.volumeSemanal = volumeSemanal;
    dto.volumeData = volumeData;
    dto.muscleGroups = muscleGroups;
    dto.trainDates = [...trainDatesSet].sort((a, b) => a - b);
    dto.workoutsCount = workoutsCount;

    return dto;
  }

  private startOfWeekMonday(d: Date): Date {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return date;
  }

  private startOfMonth(d: Date, offset = 0): Date {
    return new Date(d.getFullYear(), d.getMonth() + offset, 1);
  }

  private dateKey(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
