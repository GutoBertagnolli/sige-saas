import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(email: string, password: string, tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant || !tenant.active) throw new UnauthorizedException('Cliente inválido ou inativo');

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      include: {
        role: true,
        employee: {
          include: {
            school: true,
          },
        },
      },
    });
    if (!user || !user.active) throw new UnauthorizedException('Usuário ou senha inválidos');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Usuário ou senha inválidos');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    const token = this.jwt.sign({ sub: user.id, tenantId: tenant.id, roleId: user.roleId, email: user.email });
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name,
        employee: user.employee,
      },
      tenant,
    };
  }
}
