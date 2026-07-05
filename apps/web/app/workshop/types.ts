// أنواع محلية لدور الورشة (غير موجودة في shared-types)

export type MaintenanceType = 'ROUTINE' | 'EMERGENCY' | 'INSPECTION';

export interface MaintenanceRequest {
  id: string;
  vehicleId: string;
  type: string;
  description: string;
  status: string;
  cost: number | null;
  vehicle?: { plateNumber: string } | null;
  createdAt: string;
}

export const MAINTENANCE_TYPES: readonly MaintenanceType[] = [
  'ROUTINE',
  'EMERGENCY',
  'INSPECTION',
];

export function maintenanceTypeArabic(type: string): string {
  const map: Record<string, string> = {
    ROUTINE: 'دورية',
    EMERGENCY: 'طارئة',
    INSPECTION: 'فحص',
  };
  return map[type] ?? type;
}
