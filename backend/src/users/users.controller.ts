import { Controller, Get, Query, Req } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Roles('ADMIN', 'ADMINISTRADOR', 'SECRETARIA')
  @Get()
  find(@Query('tenantId') tenantId: string | undefined, @Req() request: any) {
    const effectiveTenantId = request.user?.tenantId;
    return this.service.findByTenant(effectiveTenantId || tenantId);
  }
}
