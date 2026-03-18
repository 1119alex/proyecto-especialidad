import { UserRole } from '../../../common/enums/user-role.enum';

export class AuthResponseDto {
  accessToken: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    warehouseId?: number;
    warehouseName?: string;
  };
}
