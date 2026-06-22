import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

export function normalizeAccessText(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

export function isFullAccessActor(actor: any) {
  const roleName = normalizeAccessText(actor?.role?.name);
  const roleType = normalizeAccessText(actor?.employee?.roleType);

  return (
    roleType === 'SECRETARIA' ||
    roleName.includes('ADMIN') ||
    roleName.includes('SECRETARIA')
  );
}

export function isSchoolScopedActor(actor: any) {
  const roleType = normalizeAccessText(actor?.employee?.roleType);
  return ['DIRETOR', 'ORIENTADOR'].includes(roleType);
}

export function getActorSchoolIds(actor: any) {
  return Array.from(
    new Set(
      [
        actor?.employee?.schoolId,
        ...(actor?.employee?.assignments?.map((assignment: any) => assignment.schoolId) ?? []),
      ].filter(Boolean) as string[],
    ),
  );
}

export function getSchoolScope(actor: any) {
  if (!actor || isFullAccessActor(actor)) {
    return undefined;
  }

  if (!isSchoolScopedActor(actor)) {
    return [];
  }

  return getActorSchoolIds(actor);
}

export function assertCanManageSchools(actor: any, schoolIds: string[], message: string) {
  if (!actor) {
    throw new UnauthorizedException('Sessao expirada. Entre novamente.');
  }

  if (isFullAccessActor(actor)) {
    return;
  }

  if (!isSchoolScopedActor(actor)) {
    throw new ForbiddenException(message);
  }

  const actorSchoolIds = new Set(getActorSchoolIds(actor));
  const canManageAll = schoolIds.filter(Boolean).every((schoolId) => actorSchoolIds.has(schoolId));

  if (!canManageAll) {
    throw new ForbiddenException(message);
  }
}
