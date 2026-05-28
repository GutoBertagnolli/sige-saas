import { PrismaService } from '../common/prisma.service';
export declare class EmployeeWeeklySchedulesService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmployee(employeeId: string): import("@prisma/client").Prisma.PrismaPromise<({
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
        timeSlot: {
            id: string;
            slotOrder: number;
            startTime: string;
            endTime: string;
            slotType: import("@prisma/client").$Enums.SlotType;
            requiresSubstitution: boolean;
            isTeachingTime: boolean;
            templateId: string;
        };
        class: {
            id: string;
            name: string;
            active: boolean;
            tenantId: string;
            schoolId: string;
            shift: import("@prisma/client").$Enums.Shift;
            educationStage: import("@prisma/client").$Enums.EducationStage;
            templateId: string;
            academicYear: number;
        };
    } & {
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        type: string;
        subject: string | null;
        schoolId: string;
        requiresSubstitution: boolean;
        weekday: import("@prisma/client").$Enums.Weekday;
        timeSlotId: string;
        functionName: string | null;
        employeeId: string;
        classId: string | null;
    })[]>;
    create(data: any): import("@prisma/client").Prisma.Prisma__EmployeeWeeklyScheduleClient<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        type: string;
        subject: string | null;
        schoolId: string;
        requiresSubstitution: boolean;
        weekday: import("@prisma/client").$Enums.Weekday;
        timeSlotId: string;
        functionName: string | null;
        employeeId: string;
        classId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    bulkReplace(employeeId: string, items: any[]): Promise<any[] | import("@prisma/client").Prisma.BatchPayload>;
    update(id: string, data: any): import("@prisma/client").Prisma.Prisma__EmployeeWeeklyScheduleClient<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        type: string;
        subject: string | null;
        schoolId: string;
        requiresSubstitution: boolean;
        weekday: import("@prisma/client").$Enums.Weekday;
        timeSlotId: string;
        functionName: string | null;
        employeeId: string;
        classId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__EmployeeWeeklyScheduleClient<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        type: string;
        subject: string | null;
        schoolId: string;
        requiresSubstitution: boolean;
        weekday: import("@prisma/client").$Enums.Weekday;
        timeSlotId: string;
        functionName: string | null;
        employeeId: string;
        classId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
