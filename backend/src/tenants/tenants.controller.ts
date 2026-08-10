import { Controller, Get, Req } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private service: TenantsService) {}

  @Roles('ADMIN', 'ADMINISTRADOR', 'SECRETARIA')
  @Get()
  async findAll(@Req() request: any) {
    const tenants = await this.service.findAll();
    return tenants.filter((tenant: any) => tenant.id === request.user?.tenantId);
  }
}
