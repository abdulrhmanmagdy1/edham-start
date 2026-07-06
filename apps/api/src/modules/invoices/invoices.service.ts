import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Invoice as PrismaInvoice } from '@prisma/client';
import {
  Invoice as InvoiceDto,
  InvoiceStatus,
  NotificationType,
  OrderStatus,
  PaginationMeta,
  UserRole,
} from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ZatcaService } from '../../zatca/zatca.service';
import { EmailService } from '../messaging/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInvoiceDto, MarkPaidDto } from './dto/invoice.dto';

const VAT_RATE = 0.15; // ZATCA (SPEC §4 Feature 7)
const round2 = (n: number): number => Math.round(n * 100) / 100;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly zatca: ZatcaService,
  ) {}

  /** ACCOUNTANT ينشئ فاتورة من طلب مكتمل. VAT 15% تلقائي. */
  async create(dto: CreateInvoiceDto): Promise<InvoiceDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, deletedAt: null },
    });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' });
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException({
        code: 'ORDER_NOT_COMPLETED',
        message: 'لا يمكن الفوترة إلا لطلب مكتمل',
      });
    }
    if (order.quotedPrice === null) {
      throw new BadRequestException({ code: 'NO_PRICE', message: 'الطلب بلا سعر معتمد' });
    }
    const existing = await this.prisma.invoice.findUnique({ where: { orderId: order.id } });
    if (existing) {
      throw new ConflictException({ code: 'INVOICE_EXISTS', message: 'يوجد فاتورة لهذا الطلب' });
    }

    const subtotal = Number(order.quotedPrice);
    const vatAmount = round2(subtotal * VAT_RATE);
    const totalAmount = round2(subtotal + vatAmount);
    const invoiceNumber = await this.nextInvoiceNumber();

    const invoice = await this.prisma.invoice.create({
      data: {
        orderId: order.id,
        customerId: order.customerId,
        invoiceNumber,
        subtotal,
        vatRate: VAT_RATE,
        vatAmount,
        totalAmount,
        currency: order.currency,
        status: InvoiceStatus.DRAFT,
        notes: dto.notes ?? null,
      },
    });
    return InvoicesService.toDto(invoice);
  }

  async findAll(page = 1, limit = 20): Promise<{ data: InvoiceDto[]; meta: PaginationMeta }> {
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.invoice.count(),
      this.prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return {
      data: rows.map(InvoicesService.toDto),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** ملخص مالي للمحاسب: المُفوتر، المدفوع، المستحق، المتأخر، وتوزيع الحالات. */
  async financialSummary(): Promise<{
    totalInvoiced: number;
    totalPaid: number;
    outstanding: number;
    overdueAmount: number;
    overdueCount: number;
    thisMonthRevenue: number;
    byStatus: Record<string, number>;
  }> {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const [invoices, paidThisMonth] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where: { status: { not: InvoiceStatus.DRAFT } },
        select: { status: true, totalAmount: true, dueAt: true },
      }),
      this.prisma.invoice.findMany({
        where: { status: InvoiceStatus.PAID, paidAt: { gte: monthStart } },
        select: { totalAmount: true },
      }),
    ]);
    const grouped = await this.prisma.invoice.groupBy({
      by: ['status'],
      _count: { _all: true },
      orderBy: { status: 'asc' },
    });

    let totalInvoiced = 0;
    let totalPaid = 0;
    let outstanding = 0;
    let overdueAmount = 0;
    let overdueCount = 0;
    for (const inv of invoices) {
      const amount = Number(inv.totalAmount);
      totalInvoiced += amount;
      if (inv.status === InvoiceStatus.PAID) {
        totalPaid += amount;
      } else if (inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.OVERDUE) {
        outstanding += amount;
        if (inv.dueAt && inv.dueAt.getTime() < now.getTime()) {
          overdueAmount += amount;
          overdueCount += 1;
        }
      }
    }

    const byStatus: Record<string, number> = {};
    for (const g of grouped) byStatus[g.status] = g._count._all;
    const thisMonthRevenue = paidThisMonth.reduce((s, i) => s + Number(i.totalAmount), 0);

    return {
      totalInvoiced: round2(totalInvoiced),
      totalPaid: round2(totalPaid),
      outstanding: round2(outstanding),
      overdueAmount: round2(overdueAmount),
      overdueCount,
      thisMonthRevenue: round2(thisMonthRevenue),
      byStatus,
    };
  }

  /** الفواتير المتأخرة (SENT/OVERDUE وتجاوزت تاريخ الاستحقاق). */
  async findOverdue(): Promise<InvoiceDto[]> {
    const rows = await this.prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] },
        dueAt: { lt: new Date() },
      },
      orderBy: { dueAt: 'asc' },
    });
    return rows.map(InvoicesService.toDto);
  }

  async findMy(user: AuthenticatedUser): Promise<InvoiceDto[]> {
    const customer = await this.prisma.customer.findFirst({ where: { userId: user.sub } });
    if (!customer) return [];
    const rows = await this.prisma.invoice.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(InvoicesService.toDto);
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<InvoiceDto> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!invoice) throw new NotFoundException({ code: 'INVOICE_NOT_FOUND', message: 'الفاتورة غير موجودة' });
    if (user.role === UserRole.CUSTOMER && invoice.customer.userId !== user.sub) {
      throw new ForbiddenException({ code: 'FORBIDDEN_INVOICE', message: 'ليست فاتورتك' });
    }
    return InvoicesService.toDto(invoice);
  }

  /** إرسال الفاتورة: DRAFT → SENT، احتساب dueAt = issuedAt + payment_terms_days. */
  async send(id: string): Promise<InvoiceDto> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { customer: { include: { user: true } } },
    });
    if (!invoice) throw new NotFoundException({ code: 'INVOICE_NOT_FOUND', message: 'الفاتورة غير موجودة' });
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new ConflictException({ code: 'NOT_DRAFT', message: 'الفاتورة ليست مسودة' });
    }

    const issuedAt = new Date();
    const dueAt = new Date(issuedAt.getTime() + invoice.customer.paymentTermsDays * 86400000);

    // ZATCA (scaffold): يملأ الحقول لو ZATCA_ENABLED=true، وإلا null
    const zatca = this.zatca.enrich({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt,
      subtotal: Number(invoice.subtotal),
      vatAmount: Number(invoice.vatAmount),
      totalAmount: Number(invoice.totalAmount),
      customerName: invoice.customer.companyName,
      customerVatNumber: invoice.customer.vatNumber,
    });

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.SENT,
        issuedAt,
        dueAt,
        zatcaUuid: zatca?.uuid ?? undefined,
        zatcaHash: zatca?.hash ?? undefined,
        zatcaQr: zatca?.qr ?? undefined,
      },
    });

    const billingEmail = invoice.customer.billingEmail ?? invoice.customer.user.email;
    if (billingEmail) {
      await this.email.sendInvoiceEmail({
        to: billingEmail,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        currency: invoice.currency,
      });
    }
    await this.notifications.notify({
      userId: invoice.customer.userId,
      type: NotificationType.PAYMENT_DUE,
      title: 'فاتورة جديدة',
      body: `فاتورة ${invoice.invoiceNumber} بمبلغ ${Number(invoice.totalAmount)} ${invoice.currency}`,
      referenceType: 'INVOICE',
      referenceId: invoice.id,
    });

    return InvoicesService.toDto(updated);
  }

  /** تسجيل الدفع: SENT/OVERDUE → PAID. */
  async markPaid(id: string, dto: MarkPaidDto): Promise<InvoiceDto> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException({ code: 'INVOICE_NOT_FOUND', message: 'الفاتورة غير موجودة' });
    if (invoice.status !== InvoiceStatus.SENT && invoice.status !== InvoiceStatus.OVERDUE) {
      throw new ConflictException({ code: 'NOT_PAYABLE', message: 'الفاتورة غير قابلة للدفع في حالتها الحالية' });
    }
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        paymentReference: dto.paymentReference ?? null,
      },
    });
    return InvoicesService.toDto(updated);
  }

  private async nextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count();
    return `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  static toDto(i: PrismaInvoice): InvoiceDto {
    return {
      id: i.id,
      orderId: i.orderId,
      customerId: i.customerId,
      invoiceNumber: i.invoiceNumber,
      subtotal: Number(i.subtotal),
      vatRate: Number(i.vatRate),
      vatAmount: Number(i.vatAmount),
      totalAmount: Number(i.totalAmount),
      currency: i.currency,
      status: i.status as InvoiceStatus,
      zatcaUuid: i.zatcaUuid,
      zatcaHash: i.zatcaHash,
      zatcaQr: i.zatcaQr,
      pdfUrl: i.pdfUrl,
      issuedAt: i.issuedAt?.toISOString() ?? null,
      dueAt: i.dueAt?.toISOString() ?? null,
      paidAt: i.paidAt?.toISOString() ?? null,
      paymentReference: i.paymentReference,
      notes: i.notes,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    };
  }
}
