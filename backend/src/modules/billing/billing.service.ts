import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBillingRuleDto, GenerateInvoicesDto } from './dto/billing.dto';
import { PdfUtil } from '../../common/utils/pdf.util';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  createRule(organizationId: string, dto: CreateBillingRuleDto) {
    const { cropId, ...rest } = dto;
  
    return this.prisma.billingRule.create({
      data: {
        ...rest,
        organization: { connect: { id: organizationId } },
        ...(cropId
          ? { crop: { connect: { id: cropId } } }
          : {}),
      },
    });
  }

  listRules(organizationId: string) {
    return this.prisma.billingRule.findMany({
      where: { organizationId, deletedAt: null },
      include: { crop: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Generates one invoice per farmer for bags they have IN_STORAGE, billing
   * storage days that overlap [periodFrom, periodTo] at the resolved rate
   * (crop-specific rule → org default rule → crop.defaultCharge → 0).
   *
   * NOTE: only currently IN_STORAGE bags are billed for now — a bag that was
   * received and fully dispatched within the same period is not yet picked
   * up. Revisit once InventoryMovement DISPATCH timestamps are used to
   * reconstruct historical occupancy for the period.
   */
  async generate(organizationId: string, dto: GenerateInvoicesDto) {
    const periodFrom = new Date(dto.periodFrom);
    const periodTo = new Date(dto.periodTo);
    const now = new Date();
    const effectiveEnd = periodTo < now ? periodTo : now;

    const [rules, farmers] = await Promise.all([
      this.prisma.billingRule.findMany({ where: { organizationId, deletedAt: null } }),
      this.prisma.farmer.findMany({
        where: {
          organizationId,
          deletedAt: null,
          ...(dto.farmerId ? { id: dto.farmerId } : {}),
        },
      }),
    ]);
    const defaultRule = rules.find((r) => r.isDefault);

    const invoices: Awaited<ReturnType<typeof this.prisma.invoice.create>>[] = [];

    for (const farmer of farmers) {
      const bags = await this.prisma.bag.findMany({
        where: { farmerId: farmer.id, status: 'IN_STORAGE', deletedAt: null, receivedAt: { lte: periodTo } },
        include: { crop: true },
      });
      if (bags.length === 0) continue;

      const lineItems: any[] = [];
      let subtotal = 0;

      for (const bag of bags) {
        const start = bag.receivedAt > periodFrom ? bag.receivedAt : periodFrom;
        const days = Math.ceil((effectiveEnd.getTime() - start.getTime()) / MS_PER_DAY);
        if (days <= 0) continue;

        const rule = rules.find((r) => r.cropId === bag.cropId) ?? defaultRule;
        const ratePerDay = rule
          ? Number(rule.ratePerBagPerDay) || Number(rule.ratePerKgPerDay) * Number(bag.weightKg)
          : Number(bag.crop.defaultCharge ?? 0);

        const amount = days * ratePerDay;
        subtotal += amount;
        lineItems.push({ bagId: bag.id, bagCode: bag.bagCode, cropName: bag.crop.name, days, ratePerDay, amount });
      }

      if (lineItems.length === 0) continue;

      const flatCharges = defaultRule
        ? Number(defaultRule.handlingCharge) +
          Number(defaultRule.loadingCharge) +
          Number(defaultRule.unloadingCharge) +
          Number(defaultRule.packingCharge) +
          Number(defaultRule.cleaningCharge) +
          Number(defaultRule.sortingCharge) +
          Number(defaultRule.insuranceCharge)
        : 0;

      const preGstTotal = subtotal + flatCharges;
      const gstPercent = defaultRule ? Number(defaultRule.gstPercent) : 0;
      const gstAmount = (preGstTotal * gstPercent) / 100;
      const discount = dto.discount ?? 0;
      const penalty = dto.penalty ?? 0;
      const totalAmount = preGstTotal + gstAmount - discount + penalty;

      const invoiceNumber = await this.generateInvoiceNumber();

      const invoice = await this.prisma.invoice.create({
        data: {
          invoiceNumber,
          farmer: { connect: { id: farmer.id } },
          periodFrom,
          periodTo,
          charges: { lineItems, flatCharges },
          subtotal: preGstTotal,
          gstAmount,
          discount,
          penalty,
          totalAmount,
        },
      });

      invoices.push(invoice);
    }

    return { generated: invoices.length, invoices };
  }

  list(farmerId?: string, status?: string, page = 1, limit = 20) {
    const where = { ...(farmerId ? { farmerId } : {}), ...(status ? { status: status as any } : {}) };
    return Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { farmer: true, payments: true },
      }),
      this.prisma.invoice.count({ where }),
    ]).then(([items, total]) => ({ items, meta: { page, limit, total } }));
  }

  async getById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { farmer: true, payments: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async getPdf(id: string) {
    return this.getById(id);
  }

  /** Real PDF rendering (pdfkit) — replaces the earlier raw-JSON stub. */
  async getInvoicePdf(id: string): Promise<Buffer> {
    const invoice = await this.getById(id);
    return PdfUtil.renderInvoice({
      invoiceNumber: invoice.invoiceNumber,
      periodFrom: invoice.periodFrom,
      periodTo: invoice.periodTo,
      subtotal: Number(invoice.subtotal),
      gstAmount: Number(invoice.gstAmount),
      discount: Number(invoice.discount),
      penalty: Number(invoice.penalty),
      totalAmount: Number(invoice.totalAmount),
      status: invoice.status,
      createdAt: invoice.createdAt,
      farmer: invoice.farmer,
      payments: invoice.payments
        ?.filter((p) => p.type !== 'REFUND')
        .map((p) => ({
          amount: Number(p.amount),
          paidAt: p.createdAt,
          mode: p.method,
          receiptNumber: p.receiptNo,
        })),
    });
  }

  private async generateInvoiceNumber(): Promise<string> {
    const count = await this.prisma.invoice.count();
    const datePart = new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM
    return `INV-${datePart}-${(count + 1).toString().padStart(6, '0')}`;
  }
}
