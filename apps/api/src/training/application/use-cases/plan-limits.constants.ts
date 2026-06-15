/**
 * Limite de treinos (workouts) por tenant no plano gratuito.
 * Usuários PRO não possuem limite (ver `User.isFreePlan()`).
 */
export const FREE_PLAN_WORKOUT_LIMIT = 6;
