import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authorization = request.headers?.authorization as string | undefined;
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      throw new UnauthorizedException('Sessao expirada. Entre novamente.');
    }

    let payload: any;
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Sessao expirada. Entre novamente.');
    }

    if (!payload?.sub || !payload?.sid || !payload?.tenantId) {
      throw new UnauthorizedException('Sessao expirada. Entre novamente.');
    }

    const session = await this.prisma.userSession.findUnique({
      where: { tokenId: payload.sid },
      include: {
        user: {
          include: {
            tenant: true,
            role: true,
            employee: {
              include: {
                school: true,
                assignments: {
                  where: { active: true },
                  include: { school: true, function: true, subject: true },
                },
              },
            },
          },
        },
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.userId !== payload.sub ||
      !session.user.active ||
      !session.user.tenant.active ||
      session.user.tenantId !== payload.tenantId
    ) {
      throw new UnauthorizedException('Sessao expirada. Entre novamente.');
    }

    request.user = session.user;
    request.auth = { payload, session };

    await this.prisma.userSession.update({
      where: { tokenId: payload.sid },
      data: { lastSeenAt: new Date() },
    });

    return true;
  }
}
