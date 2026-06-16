export interface IBodyMeasurementProps {
  id: string;
  tenantId: string;
  measuredAt: Date;
  weight: number | null;
  neck: number | null;
  chest: number | null;
  waist: number | null;
  hip: number | null;
  leftArm: number | null;
  rightArm: number | null;
  leftThigh: number | null;
  rightThigh: number | null;
  calf: number | null;
  bodyFatPct: number | null;
  muscleMassPct: number | null;
  visceralFat: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BodyMeasurement {
  constructor(private readonly props: IBodyMeasurementProps) {}

  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get measuredAt() { return this.props.measuredAt; }
  get weight() { return this.props.weight; }
  get neck() { return this.props.neck; }
  get chest() { return this.props.chest; }
  get waist() { return this.props.waist; }
  get hip() { return this.props.hip; }
  get leftArm() { return this.props.leftArm; }
  get rightArm() { return this.props.rightArm; }
  get leftThigh() { return this.props.leftThigh; }
  get rightThigh() { return this.props.rightThigh; }
  get calf() { return this.props.calf; }
  get bodyFatPct() { return this.props.bodyFatPct; }
  get muscleMassPct() { return this.props.muscleMassPct; }
  get visceralFat() { return this.props.visceralFat; }
  get notes() { return this.props.notes; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  hasAnyMeasurement(): boolean {
    return (
      this.props.weight !== null ||
      this.props.neck !== null ||
      this.props.chest !== null ||
      this.props.waist !== null ||
      this.props.hip !== null ||
      this.props.leftArm !== null ||
      this.props.rightArm !== null ||
      this.props.leftThigh !== null ||
      this.props.rightThigh !== null ||
      this.props.calf !== null ||
      this.props.bodyFatPct !== null ||
      this.props.muscleMassPct !== null ||
      this.props.visceralFat !== null
    );
  }
}
