import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@edham/shared-types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  /** قائمة الشركات العميلة (المشرف + المحاسب). */
  @Get()
  @Roles(UserRole.SUPERVISOR, UserRole.ACCOUNTANT)
  findAll(): Promise<Record<string, unknown>[]> {
    return this.customers.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPERVISOR, UserRole.ACCOUNTANT)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Record<string, unknown>> {
    return this.customers.findOne(id);
  }

  /** المشرف ينشئ شركة عميلة جديدة. */
  @Post()
  @Roles(UserRole.SUPERVISOR)
  create(@Body() dto: CreateCustomerDto): Promise<Record<string, unknown>> {
    return this.customers.create(dto);
  }

  /** المشرف يعدّل بيانات الشركة (بما فيها شروط الدفع + حد الائتمان). */
  @Patch(':id')
  @Roles(UserRole.SUPERVISOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<Record<string, unknown>> {
    return this.customers.update(id, dto);
  }
}
