import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@edham/shared-types';

export const ROLES_KEY = 'roles';

/** يحدد الأدوار المسموح لها بالوصول لـ handler (TECH.md §5.2). */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
