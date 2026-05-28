import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
@Injectable()
export class UsersService { constructor(private prisma: PrismaService) {} findByTenant(tenantId: string) { return this.prisma.user.findMany({ where: { tenantId }, include: { role: true } }); } }
