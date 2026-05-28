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
exports.AbsencesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
let AbsencesService = class AbsencesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.absence.findMany({
            include: {
                employee: true,
            },
            orderBy: {
                startDate: 'desc',
            },
        });
    }
    create(data) {
        return this.prisma.absence.create({
            data,
            include: {
                employee: true,
            },
        });
    }
    update(id, data) {
        return this.prisma.absence.update({
            where: { id },
            data,
            include: {
                employee: true,
            },
        });
    }
    remove(id) {
        return this.prisma.absence.delete({
            where: { id },
        });
    }
    async getReplacementSuggestions(absenceId) {
        const absence = await this.prisma.absence.findUnique({
            where: { id: absenceId },
            include: {
                employee: {
                    include: {
                        weeklySchedules: {
                            include: {
                                timeSlot: true,
                            },
                        },
                        school: true,
                    },
                },
            },
        });
        if (!absence) {
            return [];
        }
        const employee = absence.employee;
        const suggestions = [];
        for (const schedule of employee.weeklySchedules) {
            const availableEmployees = await this.prisma.employee.findMany({
                where: {
                    schoolId: employee.schoolId,
                    id: {
                        not: employee.id,
                    },
                    active: true,
                },
                include: {
                    weeklySchedules: {
                        where: {
                            weekday: schedule.weekday,
                            timeSlotId: schedule.timeSlotId,
                        },
                    },
                },
            });
            const ranked = availableEmployees.map((candidate) => {
                const slot = candidate.weeklySchedules[0];
                let priority = 99;
                let reason = 'Indisponível';
                if (!slot && candidate.roleType === 'PROFESSOR') {
                    priority = 2;
                    reason = 'Professor livre';
                }
                if (slot?.type === 'HORA_ATIVIDADE') {
                    priority = 1;
                    reason = 'Hora atividade';
                }
                if (!slot && candidate.roleType === 'AUXILIAR') {
                    priority = 3;
                    reason = 'Auxiliar disponível';
                }
                if (!slot && candidate.roleType === 'ORIENTADOR') {
                    priority = 4;
                    reason = 'Orientador fallback';
                }
                if (!slot && candidate.roleType === 'DIRETOR') {
                    priority = 5;
                    reason = 'Diretor fallback';
                }
                return {
                    employeeId: candidate.id,
                    name: candidate.name,
                    roleType: candidate.roleType,
                    priority,
                    reason,
                };
            });
            ranked.sort((a, b) => a.priority - b.priority);
            suggestions.push({
                weekday: schedule.weekday,
                timeSlot: schedule.timeSlot,
                replacements: ranked.slice(0, 5),
            });
        }
        return suggestions;
    }
};
exports.AbsencesService = AbsencesService;
exports.AbsencesService = AbsencesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AbsencesService);
//# sourceMappingURL=absences.service.js.map