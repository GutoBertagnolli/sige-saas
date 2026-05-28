import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SubstitutionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.substitution.findMany({
      include: {
        absence: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  create(data: any) {
    return this.prisma.substitution.create({
      data,
    });
  }
}
