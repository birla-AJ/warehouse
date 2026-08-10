import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../../database/prisma.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      document: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [DocumentsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(DocumentsService);
  });

  it('throws NotFoundException for an unknown document', async () => {
    prisma.document.findUnique.mockResolvedValue(null);
    await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
  });

  it('registers metadata linking to a farmer', async () => {
    prisma.document.create.mockResolvedValue({ id: 'doc1' });

    await service.register({ type: 'AADHAAR', fileUrl: 'https://s3/doc1.pdf', farmerId: 'f1' } as any, 'user1');

    expect(prisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'AADHAAR',
          fileUrl: 'https://s3/doc1.pdf',
          uploadedById: 'user1',
        }),
      }),
    );
  });

  it('getUploadUrl throws a clear config error when AWS env vars are unset', async () => {
    delete process.env.AWS_REGION;
    delete process.env.AWS_S3_BUCKET;

    await expect(service.getUploadUrl({ fileName: 'a.pdf', mimeType: 'application/pdf' } as any)).rejects.toThrow(
      /AWS_S3_BUCKET is not configured/,
    );
  });
});
