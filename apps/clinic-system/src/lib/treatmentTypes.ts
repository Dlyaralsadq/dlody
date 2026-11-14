export interface TreatmentTypeOption {
  value: string;
  labelAr: string;
  labelEn: string;
}

export function parseCustomTreatmentTypes(json: string | null | undefined): TreatmentTypeOption[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function mergeTreatmentTypes(
  defaults: TreatmentTypeOption[],
  custom: TreatmentTypeOption[]
): TreatmentTypeOption[] {
  const map = new Map<string, TreatmentTypeOption>();
  for (const t of defaults) map.set(t.value, t);
  for (const t of custom) map.set(t.value, t);
  return Array.from(map.values());
}
