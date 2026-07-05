import { UserRole } from '@edham/shared-types';

/** المستخدم المُصادَق عليه المُرفق بالطلب (req.user) بعد JWT. */
export interface AuthenticatedUser {
  /** userId */
  sub: string;
  role: UserRole;
}
