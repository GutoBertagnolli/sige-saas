import { PrismaService } from '../common/prisma.service';
export declare class AbsencesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        employee: {
            id: string;
            name: string;
            active: boolean;
            tenantId: string;
            email: string | null;
            phone: string | null;
            schoolId: string | null;
            roleType: import("@prisma/client").$Enums.EmployeeRoleType;
            cpf: string | null;
            birthDate: Date | null;
            photoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        type: string;
        status: import("@prisma/client").$Enums.AbsenceStatus;
        employeeId: string;
        startDate: Date;
        endDate: Date;
        reason: string | null;
        documentUrl: string | null;
        createdBy: string | null;
    })[]>;
    create(data: any): import("@prisma/client").Prisma.Prisma__AbsenceClient<{
        employee: {
            id: string;
            name: string;
            active: boolean;
            tenantId: string;
            email: string | null;
            phone: string | null;
            schoolId: string | null;
            roleType: import("@prisma/client").$Enums.EmployeeRoleType;
            cpf: string | null;
            birthDate: Date | null;
            photoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        type: string;
        status: import("@prisma/client").$Enums.AbsenceStatus;
        employeeId: string;
        startDate: Date;
        endDate: Date;
        reason: string | null;
        documentUrl: string | null;
        createdBy: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, data: any): import("@prisma/client").Prisma.Prisma__AbsenceClient<{
        employee: {
            id: string;
            name: string;
            active: boolean;
            tenantId: string;
            email: string | null;
            phone: string | null;
            schoolId: string | null;
            roleType: import("@prisma/client").$Enums.EmployeeRoleType;
            cpf: string | null;
            birthDate: Date | null;
            photoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        type: string;
        status: import("@prisma/client").$Enums.AbsenceStatus;
        employeeId: string;
        startDate: Date;
        endDate: Date;
        reason: string | null;
        documentUrl: string | null;
        createdBy: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__AbsenceClient<{
        id: string;
        createdAt: Date;
        type: string;
        status: import("@prisma/client").$Enums.AbsenceStatus;
        employeeId: string;
        startDate: Date;
        endDate: Date;
        reason: string | null;
        documentUrl: string | null;
        createdBy: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    getReplacementSuggestions(absenceId: string): Promise<any[]>;
}
