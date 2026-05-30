"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubstitutionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../common/prisma.service");
let SubstitutionsService = class SubstitutionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async attachTeachers(substitution) {
        const employeeIds = [
            substitution.originalTeacherId,
            substitution.substituteTeacherId,
        ].filter(Boolean);
        const employees = await this.prisma.employee.findMany({
            where: {
                id: {
                    in: employeeIds,
                },
            },
            include: {
                school: true,
            },
        });
        const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
        return {
            ...substitution,
            originalTeacher: employeeById.get(substitution.originalTeacherId) ?? null,
            substituteTeacher: substitution.substituteTeacherId
                ? employeeById.get(substitution.substituteTeacherId) ?? null
                : null,
        };
    }
    async findAll() {
        const substitutions = await this.prisma.substitution.findMany({
            include: {
                absence: {
                    include: {
                        employee: {
                            include: {
                                school: true,
                            },
                        },
                    },
                },
                classSchedule: {
                    include: {
                        class: true,
                    },
                },
                timeSlot: true,
                scoreDetails: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const employeeIds = Array.from(new Set(substitutions.flatMap((substitution) => [
            substitution.originalTeacherId,
            substitution.substituteTeacherId,
        ]).filter(Boolean)));
        const employees = await this.prisma.employee.findMany({
            where: {
                id: {
                    in: employeeIds,
                },
            },
            include: {
                school: true,
            },
        });
        const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
        return substitutions.map((substitution) => ({
            ...substitution,
            originalTeacher: employeeById.get(substitution.originalTeacherId) ?? null,
            substituteTeacher: substitution.substituteTeacherId
                ? employeeById.get(substitution.substituteTeacherId) ?? null
                : null,
        }));
    }
    async create(data) {
        if (!data.absenceId) {
            throw new common_1.BadRequestException('absenceId é obrigatório.');
        }
        if (!data.timeSlotId) {
            throw new common_1.BadRequestException('timeSlotId é obrigatório.');
        }
        if (!data.weekday) {
            throw new common_1.BadRequestException('weekday é obrigatório.');
        }
        if (!data.substituteTeacherId) {
            throw new common_1.BadRequestException('substituteTeacherId é obrigatório.');
        }
        const absence = await this.prisma.absence.findUnique({
            where: {
                id: data.absenceId,
            },
        });
        if (!absence) {
            throw new common_1.NotFoundException('Afastamento não encontrado.');
        }
        const originalTeacherId = data.originalTeacherId ?? absence.employeeId;
        if (originalTeacherId === data.substituteTeacherId) {
            throw new common_1.BadRequestException('O substituto deve ser diferente do servidor afastado.');
        }
        const substitute = await this.prisma.employee.findUnique({
            where: {
                id: data.substituteTeacherId,
            },
        });
        if (!substitute || !substitute.active) {
            throw new common_1.BadRequestException('Substituto inválido ou inativo.');
        }
        const existing = await this.prisma.substitution.findFirst({
            where: {
                absenceId: data.absenceId,
                timeSlotId: data.timeSlotId,
                weekday: data.weekday,
                classScheduleId: data.classScheduleId ?? null,
            },
            include: {
                timeSlot: true,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Já existe substituto selecionado para este afastamento, dia e horário. Apague a substituição atual antes de selecionar outro professor.');
        }
        const substitution = await this.prisma.$transaction(async (transaction) => {
            const created = await transaction.substitution.create({
                data: {
                    absenceId: data.absenceId,
                    classScheduleId: data.classScheduleId ?? null,
                    timeSlotId: data.timeSlotId,
                    weekday: data.weekday,
                    originalTeacherId,
                    substituteTeacherId: data.substituteTeacherId,
                    score: data.score ?? 0,
                    status: data.status ?? client_1.SubstitutionStatus.PENDING_DIRECTOR,
                },
                include: {
                    absence: true,
                    classSchedule: {
                        include: {
                            class: true,
                        },
                    },
                    timeSlot: true,
                    scoreDetails: true,
                },
            });
            await transaction.absence.update({
                where: {
                    id: data.absenceId,
                },
                data: {
                    status: 'SUBSTITUTIONS_GENERATED',
                },
            });
            return created;
        });
        return this.attachTeachers(substitution);
    }
    async remove(id) {
        const substitution = await this.prisma.substitution.findUnique({
            where: { id },
        });
        if (!substitution) {
            throw new common_1.NotFoundException('Substituição não encontrada.');
        }
        return this.prisma.$transaction(async (transaction) => {
            const deleted = await transaction.substitution.delete({
                where: { id },
            });
            const remaining = await transaction.substitution.count({
                where: {
                    absenceId: substitution.absenceId,
                },
            });
            if (remaining === 0) {
                await transaction.absence.update({
                    where: {
                        id: substitution.absenceId,
                    },
                    data: {
                        status: 'OPEN',
                    },
                });
            }
            return deleted;
        });
    }
};
exports.SubstitutionsService = SubstitutionsService;
exports.SubstitutionsService = SubstitutionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubstitutionsService);
//# sourceMappingURL=substitutions.service.js.map