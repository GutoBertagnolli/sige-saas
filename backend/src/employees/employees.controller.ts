import { Body, Controller, Delete, ForbiddenException, Get, Headers, Param, Post, Put, Req } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getClientIp } from '../common/client-ip';
import { PrismaService } from '../common/prisma.service';
import { getSchoolScope } from '../common/school-scope';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly service: EmployeesService,
    private readonly audit: AuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  private getRequestedSchoolIds(body: any) {
    return Array.from(
      new Set(
        [body?.schoolId, ...(body?.schoolIds ?? [])]
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean),
      ),
    ) as string[];
  }

  private normalizeAccessText(value?: string | null) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  }

  private isFullAccessActor(actor: any) {
    const roleName = this.normalizeAccessText(actor?.role?.name);
    const roleType = this.normalizeAccessText(actor?.employee?.roleType);

    return roleType === 'SECRETARIA' || roleName.includes('ADMIN') || roleName.includes('SECRETARIA');
  }

  private getActorSchoolIds(actor: any) {
    return new Set(
      [
        actor?.employee?.schoolId,
        ...(actor?.employee?.assignments?.map((assignment: any) => assignment.schoolId) ?? []),
      ].filter(Boolean),
    );
  }

  private async assertTenantAndSchools(actor: any, body: any) {
    if (!actor?.tenantId) throw new ForbiddenException('Sessao sem cliente associado.');

    const schoolIds = this.getRequestedSchoolIds(body);
    if (!schoolIds.length) return;

    const count = await this.prisma.school.count({
      where: {
        id: { in: schoolIds },
        tenantId: actor.tenantId,
      },
    });

    if (count !== schoolIds.length) {
      throw new ForbiddenException('Uma ou mais escolas nao pertencem ao seu cliente.');
    }
  }

  private async assertEmployeeTenant(actor: any, id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: { tenantId: true },
    });

    if (!employee || employee.tenantId !== actor?.tenantId) {
      throw new ForbiddenException('Servidor nao encontrado.');
    }
  }

  private assertCanManageRequestedSchools(actor: any, body: any, currentSchoolIds: string[] = []) {
    const requestedSchoolIds = this.getRequestedSchoolIds(body);
    if (requestedSchoolIds.length === 0) return;

    const roleType = this.normalizeAccessText(actor?.employee?.roleType);

    if (this.isFullAccessActor(actor)) return;

    if (!['DIRETOR', 'ORIENTADOR'].includes(roleType)) {
      throw new ForbiddenException('Apenas Direcao, Orientacao, Secretaria e Administradores podem cadastrar servidores.');
    }

    const actorSchoolIds = this.getActorSchoolIds(actor);
    const currentSchoolIdSet = new Set(currentSchoolIds);
    const canManageAllChanges = requestedSchoolIds.every(
      (schoolId) => currentSchoolIdSet.has(schoolId) || actorSchoolIds.has(schoolId),
    );
    const removedSchoolIds = currentSchoolIds.filter((schoolId) => !requestedSchoolIds.includes(schoolId));
    const onlyRemovedManagedSchools = removedSchoolIds.every((schoolId) => actorSchoolIds.has(schoolId));

    if (!canManageAllChanges || !onlyRemovedManagedSchools) {
      throw new ForbiddenException('Voce so pode cadastrar servidores nas escolas em que atua.');
    }
  }

  @Get()
  async findAll(@Headers('authorization') authorization?: string) {
    const actor = await this.audit.getActor(authorization);
    return this.service.findAll(getSchoolScope(actor));
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    await this.assertTenantAndSchools(actor, body);
    this.assertCanManageRequestedSchools(actor, body);
    const result = await this.service.create({ ...body, tenantId: actor.tenantId });
    await this.audit.record({ authorization, entity: 'Servidor', entityId: result?.id, action: 'CREATE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    await this.assertEmployeeTenant(actor, id);
    await this.assertTenantAndSchools(actor, body);
    const currentSchoolIds = await this.service.getAssignedSchoolIds(id);
    this.assertCanManageRequestedSchools(actor, body, currentSchoolIds);
    const result = await this.service.update(id, { ...body, tenantId: actor.tenantId });
    await this.audit.record({ authorization, entity: 'Servidor', entityId: id, action: 'UPDATE', oldData: body, newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Post(':id/access')
  async generateAccess(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    await this.assertEmployeeTenant(actor, id);
    const currentSchoolIds = await this.service.getAssignedSchoolIds(id);
    this.assertCanManageRequestedSchools(actor, { schoolIds: currentSchoolIds }, currentSchoolIds);
    const result = await this.service.generateAccess(id);
    await this.audit.record({ authorization, entity: 'Servidor', entityId: id, action: 'GENERATE_ACCESS', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    await this.assertEmployeeTenant(actor, id);
    const currentSchoolIds = await this.service.getAssignedSchoolIds(id);
    this.assertCanManageRequestedSchools(actor, { schoolIds: currentSchoolIds }, currentSchoolIds);
    const result = await this.service.remove(id);
    await this.audit.record({ authorization, entity: 'Servidor', entityId: id, action: 'DELETE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }
}
