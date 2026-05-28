import { SubstitutionsService } from './substitutions.service';
export declare class SubstitutionsController {
    private readonly service;
    constructor(service: SubstitutionsService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        absence: {
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
        };
    } & {
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
    })[]>;
    create(body: any): import("@prisma/client").Prisma.Prisma__SubstitutionClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
