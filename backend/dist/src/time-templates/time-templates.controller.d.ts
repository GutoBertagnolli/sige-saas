import { TimeTemplatesService } from './time-templates.service';
export declare class TimeTemplatesController {
    private readonly service;
    constructor(service: TimeTemplatesService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        school: {
            id: string;
            name: string;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            email: string | null;
            phone: string | null;
            type: string;
            address: string | null;
        };
        slots: {
            id: string;
            slotOrder: number;
            startTime: string;
            endTime: string;
            slotType: import("@prisma/client").$Enums.SlotType;
            requiresSubstitution: boolean;
            isTeachingTime: boolean;
            templateId: string;
        }[];
    } & {
        id: string;
        name: string;
        active: boolean;
        tenantId: string;
        schoolId: string;
        shift: import("@prisma/client").$Enums.Shift;
        educationStage: import("@prisma/client").$Enums.EducationStage;
    })[]>;
    create(body: any): import("@prisma/client").Prisma.Prisma__SchoolTimeTemplateClient<{
        school: {
            id: string;
            name: string;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            email: string | null;
            phone: string | null;
            type: string;
            address: string | null;
        };
        slots: {
            id: string;
            slotOrder: number;
            startTime: string;
            endTime: string;
            slotType: import("@prisma/client").$Enums.SlotType;
            requiresSubstitution: boolean;
            isTeachingTime: boolean;
            templateId: string;
        }[];
    } & {
        id: string;
        name: string;
        active: boolean;
        tenantId: string;
        schoolId: string;
        shift: import("@prisma/client").$Enums.Shift;
        educationStage: import("@prisma/client").$Enums.EducationStage;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, body: any): import("@prisma/client").Prisma.Prisma__SchoolTimeTemplateClient<{
        school: {
            id: string;
            name: string;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            email: string | null;
            phone: string | null;
            type: string;
            address: string | null;
        };
        slots: {
            id: string;
            slotOrder: number;
            startTime: string;
            endTime: string;
            slotType: import("@prisma/client").$Enums.SlotType;
            requiresSubstitution: boolean;
            isTeachingTime: boolean;
            templateId: string;
        }[];
    } & {
        id: string;
        name: string;
        active: boolean;
        tenantId: string;
        schoolId: string;
        shift: import("@prisma/client").$Enums.Shift;
        educationStage: import("@prisma/client").$Enums.EducationStage;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__SchoolTimeTemplateClient<{
        id: string;
        name: string;
        active: boolean;
        tenantId: string;
        schoolId: string;
        shift: import("@prisma/client").$Enums.Shift;
        educationStage: import("@prisma/client").$Enums.EducationStage;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
