"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const tenant = await prisma.tenant.upsert({ where: { slug: 'suportiva' }, update: {}, create: { name: 'SIGE by SUPORTIVA', slug: 'suportiva', primaryColor: '#1E3A8A', secondaryColor: '#DC2626', domain: 'sige.suportiva.org' } });
    const role = await prisma.role.upsert({ where: { tenantId_name: { tenantId: tenant.id, name: 'Administrador' } }, update: {}, create: { tenantId: tenant.id, name: 'Administrador', description: 'Acesso total ao sistema' } });
    await prisma.user.upsert({ where: { tenantId_email: { tenantId: tenant.id, email: 'admin@suportiva.org' } }, update: {}, create: { tenantId: tenant.id, name: 'Administrador SIGE', email: 'admin@suportiva.org', passwordHash: await bcrypt.hash('admin123', 10), roleId: role.id } });
    const school = await prisma.school.upsert({ where: { id: '00000000-0000-0000-0000-000000000001' }, update: {}, create: { id: '00000000-0000-0000-0000-000000000001', tenantId: tenant.id, name: 'Escola Modelo', type: 'ESCOLA' } });
    const subjects = ['Língua Portuguesa', 'Arte', 'Educação Física', 'Língua Inglesa', 'Língua Alemã', 'Matemática', 'Ciências', 'Geografia', 'História', 'Ensino Religioso'];
    for (const name of subjects)
        await prisma.subject.upsert({ where: { id: name }, update: {}, create: { id: name, tenantId: tenant.id, name } }).catch(async () => { });
    const funcs = [{ name: 'Diretor' }, { name: 'Orientador' }, { name: 'Professor', requiresSubject: true }, { name: 'Auxiliar de sala' }, { name: 'Auxiliar administrativo' }, { name: 'Auxiliar de manutenção' }, { name: 'Auxiliar de limpeza' }];
    for (const f of funcs)
        await prisma.employeeFunction.create({ data: { tenantId: tenant.id, name: f.name, requiresSubject: !!f.requiresSubject } }).catch(() => { });
    const templates = [
        { name: 'Matutino - Anos Iniciais', shift: client_1.Shift.MATUTINO, educationStage: client_1.EducationStage.ANOS_INICIAIS, slots: [['07:30', '08:15', client_1.SlotType.CLASS, true], ['08:15', '09:00', client_1.SlotType.CLASS, true], ['09:00', '09:15', client_1.SlotType.BREAK, false], ['09:15', '10:00', client_1.SlotType.CLASS, true], ['10:00', '10:45', client_1.SlotType.CLASS, true], ['10:45', '11:30', client_1.SlotType.CLASS, true]] },
        { name: 'Matutino - Anos Finais', shift: client_1.Shift.MATUTINO, educationStage: client_1.EducationStage.ANOS_FINAIS, slots: [['07:30', '08:15', client_1.SlotType.CLASS, true], ['08:15', '09:00', client_1.SlotType.CLASS, true], ['09:00', '09:45', client_1.SlotType.CLASS, true], ['09:45', '10:00', client_1.SlotType.BREAK, false], ['10:00', '10:45', client_1.SlotType.CLASS, true], ['10:45', '11:30', client_1.SlotType.CLASS, true]] },
        { name: 'Vespertino - Anos Iniciais', shift: client_1.Shift.VESPERTINO, educationStage: client_1.EducationStage.ANOS_INICIAIS, slots: [['13:00', '13:45', client_1.SlotType.CLASS, true], ['13:45', '14:30', client_1.SlotType.CLASS, true], ['14:30', '14:45', client_1.SlotType.BREAK, false], ['14:45', '15:30', client_1.SlotType.CLASS, true], ['15:30', '16:15', client_1.SlotType.CLASS, true], ['16:15', '17:00', client_1.SlotType.CLASS, true]] },
        { name: 'Vespertino - Anos Finais', shift: client_1.Shift.VESPERTINO, educationStage: client_1.EducationStage.ANOS_FINAIS, slots: [['13:00', '13:45', client_1.SlotType.CLASS, true], ['13:45', '14:30', client_1.SlotType.CLASS, true], ['14:30', '15:15', client_1.SlotType.CLASS, true], ['15:15', '15:30', client_1.SlotType.BREAK, false], ['15:30', '16:15', client_1.SlotType.CLASS, true], ['16:15', '17:00', client_1.SlotType.CLASS, true]] }
    ];
    for (const t of templates) {
        const existing = await prisma.schoolTimeTemplate.findFirst({ where: { schoolId: school.id, name: t.name } });
        if (!existing)
            await prisma.schoolTimeTemplate.create({ data: { tenantId: tenant.id, schoolId: school.id, name: t.name, shift: t.shift, educationStage: t.educationStage, slots: { create: t.slots.map((s, i) => ({ slotOrder: i + 1, startTime: s[0], endTime: s[1], slotType: s[2], isTeachingTime: s[3] })) } } });
    }
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map