import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
@Controller('users')
export class UsersController { constructor(private service: UsersService) {} @Get() find(@Query('tenantId') tenantId: string) { return this.service.findByTenant(tenantId); } }
