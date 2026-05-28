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
exports.AvailabilityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
let AvailabilityService = class AvailabilityService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findBySchoolAndSlot(params) {
        const { schoolId, weekday, timeSlotId } = params;
        const employees = await this.prisma.employee.findMany({
            where: {
                schoolId,
                active: true,
            },
            include: {
                school: true,
                weeklySchedules: {
                    where: {
                        weekday,
                        timeSlotId,
                        active: true,
                    },
                    include: {
                        timeSlot: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });
        const result = employees.map((employee) => {
            const schedule = employee.weeklySchedules[0];
            let status = 'LIVRE';
            let canSubstitute = false;
            let priority = 99;
            let reason = 'Servidor não possui jornada cadastrada neste horário.';
            if (schedule) {
                status = schedule.type;
                if (schedule.type === 'HORA_ATIVIDADE') {
                    canSubstitute = true;
                    priority = 1;
                    reason = 'Professor em hora atividade na própria unidade.';
                }
                else {
                    canSubstitute = false;
                    priority = 90;
                    reason = 'Servidor já está ocupado neste horário.';
                }
            }
            if (!schedule && employee.roleType === 'PROFESSOR') {
                canSubstitute = true;
                priority = 2;
                reason = 'Professor livre na própria unidade.';
            }
            if (!schedule && employee.roleType === 'AUXILIAR') {
                canSubstitute = true;
                priority = 3;
                reason = 'Auxiliar disponível na própria unidade.';
            }
            if (!schedule && employee.roleType === 'ORIENTADOR') {
                canSubstitute = true;
                priority = 4;
                reason = 'Orientador sugerido como fallback.';
            }
            if (!schedule && employee.roleType === 'DIRETOR') {
                canSubstitute = true;
                priority = 5;
                reason = 'Diretor sugerido como último fallback.';
            }
            return {
                employeeId: employee.id,
                name: employee.name,
                roleType: employee.roleType,
                school: employee.school?.name,
                status,
                canSubstitute,
                priority,
                reason,
            };
        });
        return result.sort((a, b) => a.priority - b.priority);
    }
};
exports.AvailabilityService = AvailabilityService;
exports.AvailabilityService = AvailabilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AvailabilityService);
//# sourceMappingURL=availability.service.js.map