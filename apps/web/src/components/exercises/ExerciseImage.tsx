import Image from "next/image";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseImageProps {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

export function ExerciseImage({ src, alt, sizes, className, priority }: ExerciseImageProps) {
  if (!src) {
    return (
      <div className={cn("absolute inset-0 flex items-center justify-center bg-muted", className)}>
        <Dumbbell className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}
