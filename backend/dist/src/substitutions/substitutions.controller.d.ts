import { SubstitutionsService } from './substitutions.service';
export declare class SubstitutionsController {
    private readonly service;
    constructor(service: SubstitutionsService);
    findAll(): Promise<{
        originalTeacher: {
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
        substituteTeacher: {
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
        absence: {
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
        };
        classSchedule: {
            class: {
                id: string;
                name: string;
                tenantId: string;
                schoolId: string;
                active: boolean;
                templateId: string;
                academicYear: number;
                shift: import("@prisma/client").$Enums.Shift;
                educationStage: import("@prisma/client").$Enums.EducationStage;
            };
        } & {
            id: string;
            timeSlotId: string;
            weekday: import("@prisma/client").$Enums.Weekday;
            tenantId: string;
            classId: string;
            subjectId: string | null;
            teacherId: string | null;
            room: string | null;
            notes: string | null;
            isActive: boolean;
        };
        timeSlot: {
            id: string;
            templateId: string;
            slotOrder: number;
            startTime: string;
            endTime: string;
            slotType: import("@prisma/client").$Enums.SlotType;
            requiresSubstitution: boolean;
            isTeachingTime: boolean;
        };
        scoreDetails: {
            id: string;
            substitutionId: string;
            rule: string;
            points: number;
            description: string | null;
        }[];
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
    }[]>;
    create(body: any): Promise<any>;
    remove(id: string): Promise<{
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
    }>;
}
