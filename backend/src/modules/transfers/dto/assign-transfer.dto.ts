import { IsInt, IsPositive } from 'class-validator';

export class AssignTransferDto {
  @IsInt()
  @IsPositive()
  vehicleId: number;

  @IsInt()
  @IsPositive()
  driverId: number;
}
