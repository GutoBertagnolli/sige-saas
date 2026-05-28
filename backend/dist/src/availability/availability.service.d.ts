import { PrismaService } from '../common/prisma.service';
export declare class AvailabilityService {
    private prisma;
    constructor(prisma: PrismaService);
    findBySchoolAndSlot(params: {
        schoolId: string;
        weekday: any;
        timeSlotId: string;
    }): Promise<{
        employeeId: string;
        name: string;
        roleType: import("@prisma/client").$Enums.EmployeeRoleType;
        school: string;
        status: string;
        canSubstitute: boolean;
        priority: number;
        reason: string;
    }[]>;
}
