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

  async me(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new UnauthorizedException('Sessao expirada. Entre novamente.');

    let payload: any;
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Sessao expirada. Entre novamente.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        tenant: true,
        role: true,
        employee: {
          include: {
            school: true,
          },
        },
      },
    });

    if (!user || !user.active || !user.tenant.active) {
      throw new UnauthorizedException('Sessao expirada. Entre novamente.');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name,
        employee: user.employee,
      },
      tenant: user.tenant,
    };
  }
}
