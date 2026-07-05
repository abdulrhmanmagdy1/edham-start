import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';

export interface ZatcaInvoiceInput {
  invoiceNumber: string;
  issuedAt: Date;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  customerName: string;
  customerVatNumber: string | null;
}

export interface ZatcaResult {
  uuid: string;
  hash: string;
  qr: string;
}

/**
 * ZATCA (فاتورة إلكترونية سعودية Phase 2) — scaffold.
 * - يولّد QR (TLV base64) + hash + uuid ويملأ حقول invoice.zatca_*.
 * - معطّل افتراضياً (ZATCA_ENABLED=false). التكامل الفعلي (شهادات + CSR + clearance/reporting API)
 *   مؤجَّل حتى onboarding العميل — راجع docs/tech-debt.md.
 */
@Injectable()
export class ZatcaService {
  private readonly logger = new Logger(ZatcaService.name);
  private static readonly SELLER_NAME = 'إدهام للوجستيات';

  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return this.config.get<string>('ZATCA_ENABLED', 'false') === 'true';
  }

  /** يُنتج بيانات ZATCA لفاتورة، أو null لو معطّل. */
  enrich(input: ZatcaInvoiceInput): ZatcaResult | null {
    if (!this.enabled) return null;

    const sellerVat = this.config.get<string>('ZATCA_VAT_NUMBER', '');
    const qr = this.buildTlvQr({
      sellerName: ZatcaService.SELLER_NAME,
      sellerVat,
      timestamp: input.issuedAt.toISOString(),
      total: input.totalAmount.toFixed(2),
      vatTotal: input.vatAmount.toFixed(2),
    });
    const xml = this.buildInvoiceXml(input, sellerVat);
    const hash = createHash('sha256').update(xml).digest('base64');
    const uuid = randomUUID();
    this.logger.log(`🧾 ZATCA enrich للفاتورة ${input.invoiceNumber}`);
    return { uuid, hash, qr };
  }

  /** ترميز TLV (Tag-Length-Value) → base64 للـ QR (ZATCA Phase 1/2 الحقول الأساسية). */
  private buildTlvQr(fields: {
    sellerName: string;
    sellerVat: string;
    timestamp: string;
    total: string;
    vatTotal: string;
  }): string {
    const tag = (t: number, value: string): Buffer => {
      const v = Buffer.from(value, 'utf8');
      return Buffer.concat([Buffer.from([t, v.length]), v]);
    };
    const tlv = Buffer.concat([
      tag(1, fields.sellerName),
      tag(2, fields.sellerVat),
      tag(3, fields.timestamp),
      tag(4, fields.total),
      tag(5, fields.vatTotal),
    ]);
    return tlv.toString('base64');
  }

  /** قالب XML مبسّط (UBL-like) — scaffold، ليس متوافقاً كاملاً مع ZATCA بعد. */
  private buildInvoiceXml(input: ZatcaInvoiceInput, sellerVat: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  <ID>${input.invoiceNumber}</ID>
  <IssueDate>${input.issuedAt.toISOString()}</IssueDate>
  <Seller><Name>${ZatcaService.SELLER_NAME}</Name><VAT>${sellerVat}</VAT></Seller>
  <Buyer><Name>${input.customerName}</Name><VAT>${input.customerVatNumber ?? ''}</VAT></Buyer>
  <LegalMonetaryTotal>
    <TaxExclusiveAmount>${input.subtotal.toFixed(2)}</TaxExclusiveAmount>
    <TaxAmount>${input.vatAmount.toFixed(2)}</TaxAmount>
    <PayableAmount>${input.totalAmount.toFixed(2)}</PayableAmount>
  </LegalMonetaryTotal>
</Invoice>`;
  }
}
