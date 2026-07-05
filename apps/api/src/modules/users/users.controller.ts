import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '@edham/shared-types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

class UpdateUserStatusDto {
  @IsIn([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED])
  status!: UserStatus;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERVISOR)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** POST /api/v1/users — المشرف ينشئ حساب موظف (TECH.md §5.3). */
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<{ id: string; role: UserRole }> {
    const user = await this.usersService.createEmployee(dto);
    return { id: user.id, role: user.role as UserRole };
  }

  @Get()
  async findAll(@Query('role') role?: UserRole): Promise<Record<string, unknown>[]> {
    const users = await this.usersService.findAll(role);
    return users.map(UsersService.toDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Record<string, unknown>> {
    return UsersService.toDto(await this.usersService.getOr404(id));
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<Record<string, unknown>> {
    return UsersService.toDto(await this.usersService.updateProfile(id, dto));
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<Record<string, unknown>> {
    return UsersService.toDto(await this.usersService.setStatus(id, dto.status));
  }
}
