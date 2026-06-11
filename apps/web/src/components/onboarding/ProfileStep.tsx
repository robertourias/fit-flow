"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProfileStepProps {
  name: string;
  age?: number;
  bio?: string;
  onNameChange: (value: string) => void;
  onAgeChange: (value: number | undefined) => void;
  onBioChange: (value: string | undefined) => void;
}

export function ProfileStep({
  name,
  age,
  bio,
  onNameChange,
  onAgeChange,
  onBioChange,
}: ProfileStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Seu nome"
        />
      </div>
      <div>
        <Label htmlFor="age">Idade</Label>
        <Input
          id="age"
          type="number"
          min="1"
          max="120"
          value={age ?? ""}
          onChange={(e) => onAgeChange(e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="Sua idade"
        />
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio ?? ""}
          onChange={(e) => onBioChange(e.target.value || undefined)}
          placeholder="Conte um pouco sobre você"
          maxLength={300}
        />
      </div>
    </div>
  );
}
