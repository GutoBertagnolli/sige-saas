import { ClassesService } from './classes.service';
export declare class ClassesController {
    private readonly service;
    constructor(service: ClassesService);
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
    create(body: any): import("@prisma/client").Prisma.Prisma__ClassClient<{
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
    update(id: string, body: any): import("@prisma/client").Prisma.Prisma__ClassClient<{
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
