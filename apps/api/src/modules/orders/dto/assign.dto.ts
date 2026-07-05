import { IsUUID } from 'class-validator';

/** إسناد سائق + مركبة لطلب مؤكَّد من العميل (SPEC Flow 2). */
export class AssignOrderDto {
  @IsUUID()
  driverId!: string;

  @IsUUID()
  vehicleId!: string;
}
