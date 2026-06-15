interface WorkoutLimitBadgeProps {
  count: number;
  limit: number | null;
}

export function WorkoutLimitBadge({ count, limit }: WorkoutLimitBadgeProps) {
  if (limit === null) return null;

  return (
    <span className="inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground border border-border">
      {count}/{limit} treinos
    </span>
  );
}
