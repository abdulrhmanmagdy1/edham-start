import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@edham/shared-types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReportsService, SupervisorDashboard } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERVISOR)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /** لوحة مؤشرات المشرف (عدّادات فورية). */
  @Get('dashboard')
  dashboard(): Promise<SupervisorDashboard> {
    return this.reports.supervisorDashboard();
  }

  @Get('orders-per-week')
  ordersPerWeek(): Promise<Array<{ week: string; count: number }>> {
    return this.reports.ordersPerWeek();
  }

  @Get('revenue-per-month')
  revenuePerMonth(): Promise<Array<{ month: string; revenue: number }>> {
    return this.reports.revenuePerMonth();
  }

  @Get('driver-performance')
  driverPerformance(): Promise<Array<{ employeeId: string; fullName: string; completedTrips: number }>> {
    return this.reports.driverPerformance();
  }

  @Get('cold-chain')
  coldChain(): Promise<{
    totalReadings: number;
    violations: number;
    compliancePct: number;
    coldOrders: number;
  }> {
    return this.reports.coldChain();
  }
}
