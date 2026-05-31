import { PrismaService } from '../common/prisma.service';
export declare class AbsencesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        employee: {
            school: {
                id: string;
                createdAt: Date;
                name: string;
                tenantId: string;
                email: string | null;
                phone: string | null;
                active: boolean;
                type: string;
                address: string | null;
                updatedAt: Date;
            };
        } & {
            id: string;
            name: string;
            tenantId: string;
            schoolId: string | null;
            roleType: import("@prisma/client").$Enums.EmployeeRoleType;
            cpf: string | null;
            birthDate: Date | null;
            email: string | null;
            phone: string | null;
            photoUrl: string | null;
            active: boolean;
        };
        substitutions: {
            id: string;
            absenceId: string;
            classScheduleId: string | null;
            timeSlotId: string | null;
            weekday: import("@prisma/client").$Enums.Weekday | null;
            originalTeacherId: string;
            substituteTeacherId: string | null;
            score: number;
            status: import("@prisma/client").$Enums.SubstitutionStatus;
            approvedBy: string | null;
            acceptedAt: Date | null;
            createdAt: Date;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.AbsenceStatus;
        createdAt: Date;
        employeeId: string;
        type: string;
        startDate: Date;
        endDate: Date;
        reason: string | null;
        documentUrl: string | null;
        createdBy: string | null;
    })[]>;
    create(data: any): import("@prisma/client").Prisma.Prisma__AbsenceClient<{
        employee: {
            school: {
                id: string;
                createdAt: Date;
                name: string;
                tenantId: string;
                email: string | null;
                phone: string | null;
                active: boolean;
                type: string;
                address: string | null;
                updatedAt: Date;
            };
        } & {
            id: string;
            name: string;
            tenantId: string;
            schoolId: string | null;
            roleType: import("@prisma/client").$Enums.EmployeeRoleType;
            cpf: string | null;
            birthDate: Date | null;
            email: string | null;
            phone: string | null;
            photoUrl: string | null;
            active: boolean;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.AbsenceStatus;
        createdAt: Date;
        employeeId: string;
        type: string;
        startDate: Date;
        endDate: Date;
        reason: string | null;
        documentUrl: string | null;
        createdBy: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, data: any): import("@prisma/client").Prisma.Prisma__AbsenceClient<{
        employee: {
            school: {
                id: string;
                createdAt: Date;
                name: string;
                tenantId: string;
                email: string | null;
                phone: string | null;
                active: boolean;
                type: string;
                address: string | null;
                updatedAt: Date;
            };
        } & {
            id: string;
            name: string;
            tenantId: string;
            schoolId: string | null;
            roleType: import("@prisma/client").$Enums.EmployeeRoleType;
            cpf: string | null;
            birthDate: Date | null;
            email: string | null;
            phone: string | null;
            photoUrl: string | null;
            active: boolean;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.AbsenceStatus;
        createdAt: Date;
        employeeId: string;
        type: string;
        startDate: Date;
        endDate: Date;
        reason: string | null;
        documentUrl: string | null;
        createdBy: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.AbsenceStatus;
        createdAt: Date;
        employeeId: string;
        type: string;
        startDate: Date;
        endDate: Date;
        reason: string | null;
        documentUrl: string | null;
        createdBy: string | null;
    }>;
    getReplacementSuggestions(absenceId: string): Promise<any[]>;
}
