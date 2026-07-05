import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@edham/shared-types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** POST /api/v1/users — المشرف ينشئ حساب موظف (TECH.md §5.3). */
  @Post()
  @Roles(UserRole.SUPERVISOR)
  async create(@Body() dto: CreateUserDto): Promise<{ id: string; role: UserRole }> {
    const user = await this.usersService.createEmployee(dto);
    return { id: user.id, role: user.role as UserRole };
  }
}
