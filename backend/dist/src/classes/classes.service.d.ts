import { PrismaService } from '../common/prisma.service';
export declare class ClassesService {
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
        template: {
            id: string;
            name: string;
            active: boolean;
            tenantId: string;
            schoolId: string;
            shift: import("@prisma/client").$Enums.Shift;
            educationStage: import("@prisma/client").$Enums.EducationStage;
        };
    } & {
        id: string;
        name: string;
        active: boolean;
        tenantId: string;
        schoolId: string;
        shift: import("@prisma/client").$Enums.Shift;
        educationStage: import("@prisma/client").$Enums.EducationStage;
        templateId: string;
        academicYear: number;
    })[]>;
    create(data: {
        tenantId: string;
        schoolId: string;
        academicYear: number;
        name: string;
        shift: any;
        educationStage: any;
        templateId: string;
    }): import("@prisma/client").Prisma.Prisma__ClassClient<{
        id: string;
        name: string;
        active: boolean;
        tenantId: string;
        schoolId: string;
        shift: import("@prisma/client").$Enums.Shift;
        educationStage: import("@prisma/client").$Enums.EducationStage;
        templateId: string;
        academicYear: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, data: any): import("@prisma/client").Prisma.Prisma__ClassClient<{
        id: string;
        name: string;
        active: boolean;
        tenantId: string;
        schoolId: string;
        shift: import("@prisma/client").$Enums.Shift;
        educationStage: import("@prisma/client").$Enums.EducationStage;
        templateId: string;
        academicYear: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__ClassClient<{
        id: string;
        name: string;
        active: boolean;
        tenantId: string;
        schoolId: string;
        shift: import("@prisma/client").$Enums.Shift;
        educationStage: import("@prisma/client").$Enums.EducationStage;
        templateId: string;
        academicYear: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
