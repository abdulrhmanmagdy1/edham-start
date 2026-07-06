import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';
import { UserRole } from '@edham/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { phone, deletedAt: null } });
  }

  /** تسجيل دخول الموظفين: بالبريد أو رقم الموظف (السائق). */
  async findByIdentifier(identifier: string): Promise<User | null> {
    const byEmail = await this.prisma.user.findFirst({
      where: { email: identifier, deletedAt: null },
    });
    if (byEmail) return byEmail;

    const driver = await this.prisma.driver.findUnique({
      where: { employeeId: identifier },
      include: { user: true },
    });
    return driver?.user ?? null;
  }

  async setOtp(userId: string, otpCode: string, otpExpiresAt: Date): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { otpCode, otpExpiresAt } });
  }

  async clearOtpAndTouchLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { otpCode: null, otpExpiresAt: null, lastLoginAt: new Date() },
    });
  }

  async touchLogin(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }

  /** بحث بالجوال أو البريد (للاستعادة/التسجيل). */
  findByPhoneOrEmail(phone: string, email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { deletedAt: null, OR: [{ phone }, { email }] },
    });
  }

  /** إنشاء حساب عميل كامل (تسجيل ذاتي): user + ملف الشركة + كلمة مرور. */
  createCustomerAccount(input: {
    companyName: string;
    commercialRegistrationNumber?: string;
    vatNumber?: string;
    fullName: string;
    phone: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: input.fullName,
          phone: input.phone,
          email: input.email,
          role: UserRole.CUSTOMER,
          status: 'ACTIVE',
          passwordHash: input.passwordHash,
        },
      });
      await tx.customer.create({
        data: {
          userId: user.id,
          companyName: input.companyName,
          commercialRegistrationNumber: input.commercialRegistrationNumber ?? null,
          vatNumber: input.vatNumber ?? null,
          contactPersonName: input.fullName,
          billingEmail: input.email,
        },
      });
      return user;
    });
  }

  async setPasswordAndClearOtp(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, otpCode: null, otpExpiresAt: null },
    });
  }

  /** ينشئ حساب عميل (shell) عند أول send-otp لرقم غير موجود. */
  createCustomerShell(phone: string): Promise<User> {
    return this.prisma.user.create({
      data: {
        fullName: 'عميل جديد',
        phone,
        role: UserRole.CUSTOMER,
        status: 'ACTIVE',
      },
    });
  }

  /** المشرف ينشئ موظفاً (DRIVER/ACCOUNTANT/WORKSHOP/SUPERVISOR). */
  async createEmployee(dto: CreateUserDto): Promise<User> {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ phone: dto.phone }, { email: dto.email }], deletedAt: null },
    });
    if (existing) {
      throw new ConflictException({
        code: 'USER_EXISTS',
        message: 'يوجد مستخدم بنفس الجوال أو البريد',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          email: dto.email,
          role: dto.role,
          status: 'ACTIVE',
          passwordHash,
        },
      });

      if (dto.role === UserRole.DRIVER) {
        const driverData: Prisma.DriverCreateInput = {
          user: { connect: { id: user.id } },
          employeeId: dto.employeeId as string,
          licenseNumber: dto.licenseNumber as string,
          licenseExpiry: new Date(dto.licenseExpiry as string),
        };
        await tx.driver.create({ data: driverData });
      }

      return user;
    });
  }

  /** قائمة المستخدمين (موظفون افتراضياً) — SUPERVISOR. */
  findAll(role?: UserRole): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { deletedAt: null, ...(role ? { role } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProfile(id: string, data: { fullName?: string; email?: string }): Promise<User> {
    await this.getOr404(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName ?? undefined,
        email: data.email ?? undefined,
      },
    });
  }

  async setStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<User> {
    await this.getOr404(id);
    return this.prisma.user.update({ where: { id }, data: { status } });
  }

  async getOr404(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'المستخدم غير موجود' });
    return user;
  }

  static toDto(u: User): Record<string, unknown> {
    return {
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
    };
  }
}
