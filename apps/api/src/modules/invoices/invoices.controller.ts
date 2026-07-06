import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Invoice as InvoiceDto, PaginationMeta, UserRole } from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateInvoiceDto, MarkPaidDto } from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Post()
  @Roles(UserRole.ACCOUNTANT)
  create(@Body() dto: CreateInvoiceDto): Promise<InvoiceDto> {
    return this.invoices.create(dto);
  }

  @Get()
  @Roles(UserRole.ACCOUNTANT)
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ): Promise<{ data: InvoiceDto[]; meta: PaginationMeta }> {
    return this.invoices.findAll(page, limit);
  }

  @Get('my')
  @Roles(UserRole.CUSTOMER)
  findMy(@CurrentUser() user: AuthenticatedUser): Promise<InvoiceDto[]> {
    return this.invoices.findMy(user);
  }

  /** ملخص مالي للوحة المحاسب. */
  @Get('summary')
  @Roles(UserRole.ACCOUNTANT)
  summary(): ReturnType<InvoicesService['financialSummary']> {
    return this.invoices.financialSummary();
  }

  /** قائمة الفواتير المتأخرة. */
  @Get('overdue')
  @Roles(UserRole.ACCOUNTANT)
  overdue(): Promise<InvoiceDto[]> {
    return this.invoices.findOverdue();
  }

  @Get(':id')
  @Roles(UserRole.ACCOUNTANT, UserRole.CUSTOMER)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InvoiceDto> {
    return this.invoices.findOne(id, user);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ACCOUNTANT)
  send(@Param('id', ParseUUIDPipe) id: string): Promise<InvoiceDto> {
    return this.invoices.send(id);
  }

  @Post(':id/mark-paid')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ACCOUNTANT)
  markPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkPaidDto,
  ): Promise<InvoiceDto> {
    return this.invoices.markPaid(id, dto);
  }
}
