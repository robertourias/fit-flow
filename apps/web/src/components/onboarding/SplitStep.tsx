"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPLIT_PRESETS, type SplitType } from "@/lib/onboarding/split-presets";

interface SplitStepProps {
  splitType?: SplitType;
  programName: string;
  onSplitTypeChange: (type: SplitType) => void;
  onProgramNameChange: (name: string) => void;
}

export function SplitStep({
  splitType,
  programName,
  onSplitTypeChange,
  onProgramNameChange,
}: SplitStepProps) {
  const defaultProgramName = splitType ? splitType : "";

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="split">Tipo de Split *</Label>
        <Select value={splitType} onValueChange={(val) => onSplitTypeChange(val as SplitType)}>
          <SelectTrigger id="split">
            <SelectValue placeholder="Escolha um split" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(SPLIT_PRESETS).map((key) => (
              <SelectItem key={key} value={key}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {splitType && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Treinos que serão criados:</p>
          <div className="bg-muted p-3 rounded-md">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {SPLIT_PRESETS[splitType].map((workout) => (
                <li key={workout}>{workout}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="programName">Nome do Programa *</Label>
        <Input
          id="programName"
          value={programName}
          onChange={(e) => onProgramNameChange(e.target.value)}
          placeholder={defaultProgramName || "Qual o nome do seu programa?"}
        />
      </div>
    </div>
  );
}
