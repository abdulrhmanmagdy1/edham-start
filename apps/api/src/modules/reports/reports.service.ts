import { Injectable } from '@nestjs/common';
import { InvoiceStatus, TripStatus } from '@edham/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** عدد الطلبات لكل أسبوع (آخر 8 أسابيع). */
  async ordersPerWeek(): Promise<Array<{ week: string; count: number }>> {
    const since = new Date(Date.now() - 56 * 86400000);
    const orders = await this.prisma.order.findMany({
      where: { deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const buckets = new Map<string, number>();
    for (const o of orders) {
      const key = ReportsService.weekKey(o.createdAt);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  /** الإيرادات لكل شهر (فواتير مدفوعة، آخر 6 أشهر). */
  async revenuePerMonth(): Promise<Array<{ month: string; revenue: number }>> {
    const since = new Date(Date.now() - 183 * 86400000);
    const invoices = await this.prisma.invoice.findMany({
      where: { status: InvoiceStatus.PAID, paidAt: { gte: since } },
      select: { paidAt: true, totalAmount: true },
    });
    const buckets = new Map<string, number>();
    for (const inv of invoices) {
      if (!inv.paidAt) continue;
      const key = inv.paidAt.toISOString().slice(0, 7); // YYYY-MM
      buckets.set(key, (buckets.get(key) ?? 0) + Number(inv.totalAmount));
    }
    return Array.from(buckets.entries())
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /** أداء السائقين: عدد الرحلات المكتملة لكل سائق. */
  async driverPerformance(): Promise<Array<{ employeeId: string; fullName: string; completedTrips: number }>> {
    const grouped = await this.prisma.trip.groupBy({
      by: ['driverId'],
      where: { status: TripStatus.COMPLETED },
      _count: { _all: true },
    });
    const drivers = await this.prisma.driver.findMany({
      where: { id: { in: grouped.map((g) => g.driverId) } },
      include: { user: { select: { fullName: true } } },
    });
    const byId = new Map(drivers.map((d) => [d.id, d]));
    return grouped
      .map((g) => {
        const d = byId.get(g.driverId);
        return {
          employeeId: d?.employeeId ?? '—',
          fullName: d?.user.fullName ?? '—',
          completedTrips: g._count._all,
        };
      })
      .sort((a, b) => b.completedTrips - a.completedTrips);
  }

  /** تقرير الالتزام بسلسلة التبريد. */
  async coldChain(): Promise<{
    totalReadings: number;
    violations: number;
    compliancePct: number;
    coldOrders: number;
  }> {
    const [totalReadings, violations, coldOrders] = await this.prisma.$transaction([
      this.prisma.temperatureLog.count(),
      this.prisma.temperatureLog.count({ where: { isViolation: true } }),
      this.prisma.order.count({ where: { coldChainRequired: true, deletedAt: null } }),
    ]);
    const compliancePct =
      totalReadings === 0 ? 100 : Math.round(((totalReadings - violations) / totalReadings) * 1000) / 10;
    return { totalReadings, violations, compliancePct, coldOrders };
  }

  private static weekKey(date: Date): string {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }
}
