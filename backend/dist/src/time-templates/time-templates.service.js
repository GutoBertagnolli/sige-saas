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
exports.TimeTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
let TimeTemplatesService = class TimeTemplatesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.schoolTimeTemplate.findMany({
            where: { active: true },
            include: {
                school: true,
                slots: {
                    orderBy: { slotOrder: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    create(data) {
        return this.prisma.schoolTimeTemplate.create({
            data: {
                tenantId: data.tenantId,
                schoolId: data.schoolId,
                name: data.name,
                shift: data.shift,
                educationStage: data.educationStage,
                slots: {
                    create: data.slots || [],
                },
            },
            include: {
                school: true,
                slots: true,
            },
        });
    }
    update(id, data) {
        return this.prisma.schoolTimeTemplate.update({
            where: { id },
            data: {
                name: data.name,
                shift: data.shift,
                educationStage: data.educationStage,
            },
            include: {
                school: true,
                slots: true,
            },
        });
    }
    remove(id) {
        return this.prisma.schoolTimeTemplate.update({
            where: { id },
            data: { active: false },
        });
    }
};
exports.TimeTemplatesService = TimeTemplatesService;
exports.TimeTemplatesService = TimeTemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TimeTemplatesService);
//# sourceMappingURL=time-templates.service.js.map