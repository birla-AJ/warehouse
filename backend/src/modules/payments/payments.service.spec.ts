import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../database/prisma.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      invoice: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      payment: { create: jest.fn(), count: jest.fn().mockResolvedValue(0), findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [PaymentsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(PaymentsService);
  });

  it('throws NotFoundException for an unknown invoice', async () => {
    prisma.invoice.findUnique.mockResolvedValue(null);
    await expect(
      service.create({ farmerId: 'f1', invoiceId: 'missing', amount: 100, method: 'CASH' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when invoice belongs to a different farmer', async () => {
    prisma.invoice.findUnique.mockResolvedValue({ id: 'inv1', farmerId: 'other-farmer', payments: [] });
    await expect(
      service.create({ farmerId: 'f1', invoiceId: 'inv1', amount: 100, method: 'CASH' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('marks invoice PARTIAL when payment does not cover the full amount', async () => {
    prisma.invoice.findUnique.mockResolvedValue({ id: 'inv1', farmerId: 'f1', totalAmount: 500, payments: [] });
    prisma.payment.create.mockResolvedValue({ id: 'p1', amount: 200 });

    await service.create({ farmerId: 'f1', invoiceId: 'inv1', amount: 200, method: 'UPI' } as any);

    expect(prisma.invoice.update).toHaveBeenCalledWith({ where: { id: 'inv1' }, data: { status: 'PARTIAL' } });
  });

  it('marks invoice PAID when payments cover the full amount', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv1',
      farmerId: 'f1',
      totalAmount: 500,
      payments: [{ amount: 300 }],
    });
    prisma.payment.create.mockResolvedValue({ id: 'p1', amount: 200 });

    await service.create({ farmerId: 'f1', invoiceId: 'inv1', amount: 200, method: 'UPI' } as any);

    expect(prisma.invoice.update).toHaveBeenCalledWith({ where: { id: 'inv1' }, data: { status: 'PAID' } });
  });

  it('computes total outstanding across multiple invoices', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      { id: 'inv1', invoiceNumber: 'INV-1', totalAmount: 500, payments: [{ amount: 200 }] },
      { id: 'inv2', invoiceNumber: 'INV-2', totalAmount: 300, payments: [] },
    ]);

    const result = await service.farmerOutstanding('f1');
    expect(result.totalOutstanding).toBe(600); // (500-200) + (300-0)
  });

  it('refund throws NotFoundException for an unknown payment', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    await expect(service.refund('missing', { amount: 100 } as any)).rejects.toThrow(NotFoundException);
  });

  it('refund rejects refunding a refund', async () => {
    prisma.payment.findUnique.mockResolvedValue({ id: 'p1', type: 'REFUND', invoice: null });
    await expect(service.refund('p1', { amount: 100 } as any)).rejects.toThrow(BadRequestException);
  });

  it('refund rejects an amount exceeding net paid', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 'p1', type: 'PAYMENT', farmerId: 'f1', invoiceId: 'inv1', method: 'CASH',
      invoice: { totalAmount: 500, payments: [{ amount: 200, type: 'PAYMENT' }] },
    });
    await expect(service.refund('p1', { amount: 500 } as any)).rejects.toThrow(BadRequestException);
  });

  it('refund creates a REFUND payment and recomputes invoice status to PARTIAL', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 'p1', type: 'PAYMENT', farmerId: 'f1', invoiceId: 'inv1', method: 'CASH',
      invoice: { totalAmount: 500, payments: [{ amount: 500, type: 'PAYMENT' }] },
    });
    prisma.payment.create.mockResolvedValue({ id: 'refund1', type: 'REFUND', amount: 200 });

    const result = await service.refund('p1', { amount: 200, note: 'partial return' } as any);

    expect(result.type).toBe('REFUND');
    expect(prisma.invoice.update).toHaveBeenCalledWith({ where: { id: 'inv1' }, data: { status: 'PARTIAL' } });
  });

  it('refund recomputes invoice status to PENDING when fully refunded', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 'p1', type: 'PAYMENT', farmerId: 'f1', invoiceId: 'inv1', method: 'CASH',
      invoice: { totalAmount: 500, payments: [{ amount: 500, type: 'PAYMENT' }] },
    });
    prisma.payment.create.mockResolvedValue({ id: 'refund1', type: 'REFUND', amount: 500 });

    await service.refund('p1', { amount: 500 } as any);

    expect(prisma.invoice.update).toHaveBeenCalledWith({ where: { id: 'inv1' }, data: { status: 'PENDING' } });
  });
});
