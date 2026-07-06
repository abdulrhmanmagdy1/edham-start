import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Customer as PrismaCustomer, Prisma } from '@prisma/client';
import { UserRole } from '@edham/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

type CustomerWithRelations = PrismaCustomer & {
  user?: { fullName: string; phone: string; email: string | null; status: string };
  _count?: { orders: number; invoices: number };
};

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /** قائمة الشركات العميلة (المشرف/المحاسب) مع بيانات التواصل وعدد الطلبات/الفواتير. */
  async findAll(): Promise<Record<string, unknown>[]> {
    const rows = await this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, phone: true, email: true, status: true } },
        _count: { select: { orders: true, invoices: true } },
      },
    });
    return rows.map(CustomersService.toDto);
  }

  async findOne(id: string): Promise<Record<string, unknown>> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, phone: true, email: true, status: true } },
        _count: { select: { orders: true, invoices: true } },
      },
    });
    if (!customer) {
      throw new NotFoundException({ code: 'CUSTOMER_NOT_FOUND', message: 'الشركة غير موجودة' });
    }
    return CustomersService.toDto(customer);
  }

  /** المشرف ينشئ شركة عميلة: user (CUSTOMER, بلا كلمة مرور → دخول OTP) + ملف الشركة. */
  async create(dto: CreateCustomerDto): Promise<Record<string, unknown>> {
    try {
      const customer = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            fullName: dto.contactPersonName,
            phone: dto.phone,
            email: dto.email ?? null,
            role: UserRole.CUSTOMER,
            status: 'ACTIVE',
          },
        });
        return tx.customer.create({
          data: {
            userId: user.id,
            companyName: dto.companyName,
            commercialRegistrationNumber: dto.commercialRegistrationNumber ?? null,
            vatNumber: dto.vatNumber ?? null,
            contactPersonName: dto.contactPersonName,
            billingAddress: dto.billingAddress ?? null,
            billingEmail: dto.billingEmail ?? dto.email ?? null,
            paymentTermsDays: dto.paymentTermsDays ?? 30,
            creditLimit: dto.creditLimit ?? null,
          },
          include: {
            user: { select: { fullName: true, phone: true, email: true, status: true } },
            _count: { select: { orders: true, invoices: true } },
          },
        });
      });
      return CustomersService.toDto(customer);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? (error.meta.target as string[]).join(', ') : '';
        const field = target.includes('commercial')
          ? 'رقم السجل التجاري'
          : target.includes('email')
            ? 'البريد الإلكتروني'
            : 'رقم الجوال';
        throw new ConflictException({ code: 'DUPLICATE_FIELD', message: `${field} مسجّل مسبقاً` });
      }
      throw error;
    }
  }

  /** تعديل بيانات الشركة (لا يشمل بيانات دخول المستخدم). */
  async update(id: string, dto: UpdateCustomerDto): Promise<Record<string, unknown>> {
    await this.ensureExists(id);
    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        companyName: dto.companyName ?? undefined,
        contactPersonName: dto.contactPersonName ?? undefined,
        vatNumber: dto.vatNumber ?? undefined,
        billingAddress: dto.billingAddress ?? undefined,
        billingEmail: dto.billingEmail ?? undefined,
        paymentTermsDays: dto.paymentTermsDays ?? undefined,
        creditLimit: dto.creditLimit ?? undefined,
      },
      include: {
        user: { select: { fullName: true, phone: true, email: true, status: true } },
        _count: { select: { orders: true, invoices: true } },
      },
    });
    return CustomersService.toDto(updated);
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      throw new NotFoundException({ code: 'CUSTOMER_NOT_FOUND', message: 'الشركة غير موجودة' });
    }
  }

  static toDto(c: CustomerWithRelations): Record<string, unknown> {
    return {
      id: c.id,
      userId: c.userId,
      companyName: c.companyName,
      commercialRegistrationNumber: c.commercialRegistrationNumber,
      vatNumber: c.vatNumber,
      contactPersonName: c.contactPersonName,
      billingAddress: c.billingAddress,
      billingEmail: c.billingEmail,
      paymentTermsDays: c.paymentTermsDays,
      creditLimit: c.creditLimit === null ? null : Number(c.creditLimit),
      contact: c.user
        ? { fullName: c.user.fullName, phone: c.user.phone, email: c.user.email, status: c.user.status }
        : null,
      ordersCount: c._count?.orders ?? 0,
      invoicesCount: c._count?.invoices ?? 0,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }
}
