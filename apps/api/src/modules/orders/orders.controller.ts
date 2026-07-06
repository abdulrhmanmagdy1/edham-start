import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Order as OrderDto, PaginationMeta, UserRole } from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AssignOrderDto } from './dto/assign.dto';
import { CreateOrderDto, CreateOrderForCustomerDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { SetPriceDto, UpdateOrderStatusDto } from './dto/pricing.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderDto> {
    return this.orders.create(dto, user);
  }

  /** المشرف ينشئ طلباً نيابةً عن شركة (Flow 1B). */
  @Post('for-customer')
  @Roles(UserRole.SUPERVISOR)
  createForCustomer(@Body() dto: CreateOrderForCustomerDto): Promise<OrderDto> {
    return this.orders.createForCustomer(dto.customerId, dto);
  }

  @Get()
  @Roles(UserRole.SUPERVISOR, UserRole.ACCOUNTANT)
  findAll(@Query() query: OrderQueryDto): Promise<{ data: OrderDto[]; meta: PaginationMeta }> {
    return this.orders.findAll(query);
  }

  @Get('my')
  @Roles(UserRole.CUSTOMER)
  findMy(@CurrentUser() user: AuthenticatedUser): Promise<OrderDto[]> {
    return this.orders.findMy(user);
  }

  @Get(':id')
  @Roles(UserRole.SUPERVISOR, UserRole.ACCOUNTANT, UserRole.CUSTOMER, UserRole.DRIVER)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderDto> {
    return this.orders.findOne(id, user);
  }

  @Get(':id/track')
  @Roles(UserRole.CUSTOMER, UserRole.SUPERVISOR)
  track(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Record<string, unknown>> {
    return this.orders.track(id, user);
  }

  // ── فلو التسعير ──

  @Patch(':id/set-price')
  @Roles(UserRole.SUPERVISOR)
  setPrice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPriceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderDto> {
    return this.orders.setPrice(id, dto, user);
  }

  @Post(':id/accept-price')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CUSTOMER)
  acceptPrice(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderDto> {
    return this.orders.acceptPrice(id, user);
  }

  @Post(':id/reject-price')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CUSTOMER)
  rejectPrice(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderDto> {
    return this.orders.rejectPrice(id, user);
  }

  /** إسناد سائق + مركبة (بعد CUSTOMER_CONFIRMED). */
  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPERVISOR)
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderDto> {
    return this.orders.assign(id, dto, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPERVISOR)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderDto> {
    return this.orders.updateStatus(id, dto, user);
  }
}
