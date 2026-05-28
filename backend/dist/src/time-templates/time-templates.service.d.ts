import { PrismaService } from '../common/prisma.service';
export declare class TimeTemplatesService {
    private prisma;
    constructor(prisma: PrismaService);
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
    create(data: any): import("@prisma/client").Prisma.Prisma__SchoolTimeTemplateClient<{
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
    update(id: string, data: any): import("@prisma/client").Prisma.Prisma__SchoolTimeTemplateClient<{
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
