import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePaymentDto, RefundPaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    let invoice = null;
    if (dto.invoiceId) {
      invoice = await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId }, include: { payments: true } });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.farmerId !== dto.farmerId) {
        throw new BadRequestException('Invoice does not belong to this farmer');
      }
    }

    const receiptNo = await this.generateReceiptNumber();

    const payment = await this.prisma.payment.create({
      data: {
        farmer: { connect: { id: dto.farmerId } },
        invoice: dto.invoiceId ? { connect: { id: dto.invoiceId } } : undefined,
        amount: dto.amount,
        method: dto.method,
        referenceNo: dto.referenceNo,
        receiptNo,
      },
    });

    if (invoice) {
      const netPaid =
        invoice.payments.reduce(
          (sum, p) => sum + (p.type === 'REFUND' ? -Number(p.amount) : Number(p.amount)),
          0,
        ) + dto.amount;
      const status = netPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL';
      await this.prisma.invoice.update({ where: { id: invoice.id }, data: { status } });
    }

    return payment;
  }

  /**
   * Records a refund against an existing payment's invoice — a negative
   * transaction, not a deletion of the original payment (the payment
   * history must stay intact for audit purposes). Recomputes the invoice
   * status from the net of all payments minus refunds.
   */
  async refund(paymentId: string, dto: RefundPaymentDto) {
    const original = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: { include: { payments: true } } },
    });
    if (!original) throw new NotFoundException('Payment not found');
    if (original.type === 'REFUND') throw new BadRequestException('Cannot refund a refund');

    const netPaid = (original.invoice?.payments ?? [original]).reduce(
      (sum, p) => sum + (p.type === 'REFUND' ? -Number(p.amount) : Number(p.amount)),
      0,
    );
    if (dto.amount > netPaid) {
      throw new BadRequestException('Refund amount cannot exceed the net amount paid');
    }

    const receiptNo = await this.generateReceiptNumber();

    const refund = await this.prisma.payment.create({
      data: {
        farmer: { connect: { id: original.farmerId } },
        invoice: original.invoiceId ? { connect: { id: original.invoiceId } } : undefined,
        amount: dto.amount,
        type: 'REFUND',
        method: original.method,
        note: dto.note,
        receiptNo,
      },
    });

    if (original.invoiceId) {
      const newNet = netPaid - dto.amount;
      const status = newNet <= 0 ? 'PENDING' : newNet < Number(original.invoice.totalAmount) ? 'PARTIAL' : 'PAID';
      await this.prisma.invoice.update({ where: { id: original.invoiceId }, data: { status } });
    }

    return refund;
  }

  list(farmerId?: string, page = 1, limit = 20) {
    const where = farmerId ? { farmerId } : {};
    return Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { invoice: true },
      }),
      this.prisma.payment.count({ where }),
    ]).then(([items, total]) => ({ items, meta: { page, limit, total } }));
  }

  async farmerOutstanding(farmerId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { farmerId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
      include: { payments: true },
    });

    const breakdown = invoices.map((inv) => {
      const paid = inv.payments.reduce(
        (sum, p) => sum + (p.type === 'REFUND' ? -Number(p.amount) : Number(p.amount)),
        0,
      );
      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        totalAmount: Number(inv.totalAmount),
        paid,
        outstanding: Number(inv.totalAmount) - paid,
      };
    });

    return {
      farmerId,
      totalOutstanding: breakdown.reduce((sum, b) => sum + b.outstanding, 0),
      invoices: breakdown,
    };
  }

  private async generateReceiptNumber(): Promise<string> {
    const count = await this.prisma.payment.count();
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `RCPT-${datePart}-${(count + 1).toString().padStart(6, '0')}`;
  }
}
