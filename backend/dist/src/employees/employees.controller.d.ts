import { EmployeesService } from './employees.service';
export declare class EmployeesController {
    private readonly service;
    constructor(service: EmployeesService);
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
        assignments: ({
            function: {
                id: string;
                name: string;
                active: boolean;
                tenantId: string;
                requiresSubject: boolean;
            };
        } & {
            id: string;
            active: boolean;
            schoolId: string;
            employeeId: string;
            subjectId: string | null;
            functionId: string;
            weeklyMinutes: number;
        })[];
    } & {
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
    })[]>;
    create(body: any): import("@prisma/client").Prisma.Prisma__EmployeeClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, body: any): import("@prisma/client").Prisma.Prisma__EmployeeClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__EmployeeClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
