import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private buildUserResponse(user: any) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl ?? user.employee?.photoUrl ?? null,
      role: user.role?.name,
      employee: user.employee,
    };
  }

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
      user: this.buildUserResponse(user),
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
      user: this.buildUserResponse(user),
      tenant: user.tenant,
    };
  }

  async updateProfile(authorization: string | undefined, data: { photoUrl?: string | null }) {
    const session = await this.me(authorization);
    const userId = session.user.id;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        photoUrl: data.photoUrl || null,
        employee: session.user.employee
          ? {
              update: {
                photoUrl: data.photoUrl || null,
              },
            }
          : undefined,
      },
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

    return {
      user: this.buildUserResponse(user),
      tenant: user.tenant,
    };
  }

  async updatePassword(
    authorization: string | undefined,
    data: { currentPassword: string; newPassword: string },
  ) {
    if (!data.currentPassword || !data.newPassword || data.newPassword.length < 6) {
      throw new UnauthorizedException('Informe a senha atual e uma nova senha com pelo menos 6 caracteres.');
    }

    const session = await this.me(authorization);
    const user = await this.prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !user.active) throw new UnauthorizedException('Sessao expirada. Entre novamente.');

    const ok = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Senha atual invalida.');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(data.newPassword, 10),
      },
    });

    return { success: true };
  }
}
