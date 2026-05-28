import { AvailabilityService } from './availability.service';
export declare class AvailabilityController {
    private readonly service;
    constructor(service: AvailabilityService);
    find(schoolId: string, weekday: string, timeSlotId: string): Promise<{
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
