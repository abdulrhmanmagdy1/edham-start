import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** يتحقق من صلاحية الـ access token ويُرفق req.user. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
