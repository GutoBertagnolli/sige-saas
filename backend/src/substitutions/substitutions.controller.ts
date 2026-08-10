import { Body, Controller, Delete, ForbiddenException, Get, Headers, Param, Post, Put, Req } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getClientIp } from '../common/client-ip';
import { PrismaService } from '../common/prisma.service';
import { getSchoolScope } from '../common/school-scope';
import { SubstitutionsService } from './substitutions.service';

@Controller('substitutions')
export class SubstitutionsController {
  constructor(
    private readonly service: SubstitutionsService,
    private readonly audit: AuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  private normalize(value?: string | null) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  }

  private isFullAccessActor(actor: any) {
    const roleName = this.normalize(actor?.role?.name);
    const roleType = this.normalize(actor?.employee?.roleType);
    return ['ADMIN', 'ADMINISTRADOR', 'SECRETARIA'].includes(roleName) || roleType === 'SECRETARIA';
  }

  private assertCanManageSchools(actor: any, schoolIds: string[]) {
    if (schoolIds.length === 0) {
      throw new ForbiddenException('Nao foi possivel determinar a escola da substituicao.');
    }

    const roleType = this.normalize(actor?.employee?.roleType);

    if (this.isFullAccessActor(actor)) return;

    if (!['DIRETOR', 'ORIENTADOR'].includes(roleType)) {
      throw new ForbiddenException('Apenas Direcao, Orientacao, Secretaria e Administradores podem gerenciar substituicoes.');
    }

    const actorSchoolIds = new Set(
      [
        actor?.employee?.schoolId,
        ...(actor?.employee?.assignments?.map((assignment: any) => assignment.schoolId) ?? []),
      ].filter(Boolean),
    );

    if (!schoolIds.every((schoolId) => actorSchoolIds.has(schoolId))) {
      throw new ForbiddenException('Voce so pode gerenciar substituicoes das escolas em que atua.');
    }
  }

  private async assertEmployeeVisible(actor: any, employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { assignments: { where: { active: true } } },
    });

    if (!employee || employee.tenantId !== actor?.tenantId) {
      throw new ForbiddenException('Servidor nao encontrado.');
    }

    if (actor?.employee?.id === employeeId || this.isFullAccessActor(actor)) return;

    const schoolIds = Array.from(
      new Set([employee.schoolId, ...employee.assignments.map((item) => item.schoolId)].filter(Boolean) as string[]),
    );
    this.assertCanManageSchools(actor, schoolIds);
  }

  private async assertCanRespond(actor: any, substitutionId: string) {
    const substitution = await this.prisma.substitution.findUnique({
      where: { id: substitutionId },
      select: { substituteTeacherId: true, originalTeacherId: true },
    });

    if (!substitution) throw new ForbiddenException('Substituicao nao encontrada.');

    const referenceEmployeeId = substitution.substituteTeacherId || substitution.originalTeacherId;
    const employee = await this.prisma.employee.findUnique({
      where: { id: referenceEmployeeId },
      select: { tenantId: true },
    });

    if (!employee || employee.tenantId !== actor?.tenantId) {
      throw new ForbiddenException('Substituicao nao encontrada.');
    }

    if (substitution.substituteTeacherId && actor?.employee?.id === substitution.substituteTeacherId) return;

    this.assertCanManageSchools(actor, await this.service.getManagedSchoolIds({}, substitutionId));
  }

  @Get()
  async findAll(@Headers('authorization') authorization?: string) {
    const actor = await this.audit.getActor(authorization);
    return this.service.findAll(getSchoolScope(actor));
  }

  @Get('substitute/:employeeId')
  async findBySubstitute(@Param('employeeId') employeeId: string, @Headers('authorization') authorization?: string) {
    const actor = await this.audit.getActor(authorization);
    await this.assertEmployeeVisible(actor, employeeId);
    return this.service.findBySubstitute(employeeId);
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    this.assertCanManageSchools(actor, await this.service.getManagedSchoolIds(body));
    const result = await this.service.create(body);
    await this.audit.record({ authorization, entity: 'Substituicao', entityId: result?.id, action: 'CREATE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Put(':id/accept')
  async accept(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    await this.assertCanRespond(actor, id);
    const result = await this.service.accept(id);
    await this.audit.record({ authorization, entity: 'Substituicao', entityId: id, action: 'ACCEPT', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Put(':id/decline')
  async decline(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    await this.assertCanRespond(actor, id);
    const result = await this.service.decline(id);
    await this.audit.record({ authorization, entity: 'Substituicao', entityId: id, action: 'DECLINE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    await this.assertCanRespond(actor, id);
    this.assertCanManageSchools(actor, await this.service.getManagedSchoolIds(body, id));
    const result = await this.service.update(id, body);
    await this.audit.record({ authorization, entity: 'Substituicao', entityId: id, action: 'UPDATE', oldData: body, newData: result, ipAddress: getClientIp(request) });
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Req() request: any) {
    const actor = await this.audit.getActor(authorization);
    await this.assertCanRespond(actor, id);
    this.assertCanManageSchools(actor, await this.service.getManagedSchoolIds({}, id));
    const result = await this.service.remove(id);
    await this.audit.record({ authorization, entity: 'Substituicao', entityId: id, action: 'DELETE', newData: result, ipAddress: getClientIp(request) });
    return result;
  }
}
