export type ArtifactBonusType = 'dpsPercent' | 'goldDropPercent' | 'clickDamagePercent' | 'skillChargeRate';

export interface Artifact {
  id: number;
  name: string;
  description: string;
  bonusType: ArtifactBonusType;
  bonusValue: number;
}
