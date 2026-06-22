import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Req } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getClientIp } from '../common/client-ip';
import { assertCanManageSchools, getSchoolScope } from '../common/school-scope';
import { EmployeeWeeklySchedulesService } from './employee-weekly-schedules.service';

@Controller('employee-weekly-schedules')
export class EmployeeWeeklySchedulesController {
  constructor(
    private readonly service: EmployeeWeeklySchedulesService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get('employee/:employeeId')
  async findByEmployee(@Param('employeeId') employeeId: string, @Headers('authorization') authorization?: string) {
    const actor = await this.audit.getActor(authorization);
    return this.service.findByEmployee(employeeId, getSchoolScope(actor));
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    assertCanManageSchools(actor, [body.schoolId], 'Voce so pode cadastrar planner das escolas em que atua.');
    const result = await this.service.create(body);
    await this.audit.record({ authorization, entity: 'Planner', entityId: result?.id, action: 'CREATE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    const currentSchoolId = await this.service.getSchoolId(id);
    assertCanManageSchools(
      actor,
      [currentSchoolId, body.schoolId].filter(Boolean),
      'Voce so pode alterar planner das escolas em que atua.',
    );
    const result = await this.service.update(id, body);
    await this.audit.record({ authorization, entity: 'Planner', entityId: id, action: 'UPDATE', oldData: body, newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Post('bulk')
  async bulk(@Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    const scope = getSchoolScope(actor);
    const itemSchoolIds = Array.from(
      new Set((body.items || []).map((item: any) => item.schoolId).filter(Boolean)),
    ) as string[];
    assertCanManageSchools(actor, itemSchoolIds, 'Voce so pode salvar planner das escolas em que atua.');
    const result = await this.service.bulkReplace(body.employeeId, body.items || [], scope);
    await this.audit.record({
      authorization,
      entity: 'Planner',
      entityId: body.employeeId,
      action: 'BULK_REPLACE',
      newData: { employeeId: body.employeeId, totalItems: body.items?.length ?? 0 },
      ipAddress: getClientIp(request),
    });
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    const currentSchoolId = await this.service.getSchoolId(id);
    assertCanManageSchools(actor, [currentSchoolId].filter(Boolean), 'Voce so pode excluir planner das escolas em que atua.');
    const result = await this.service.remove(id);
    await this.audit.record({ authorization, entity: 'Planner', entityId: id, action: 'DELETE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }
}
