import { Controller, Get } from '@nestjs/common';
import { TenantsService } from './tenants.service';
@Controller('tenants')
export class TenantsController { constructor(private service: TenantsService) {} @Get() findAll() { return this.service.findAll(); } }
