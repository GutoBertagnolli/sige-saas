import { UsersService } from './users.service';
export declare class UsersController {
    private service;
    constructor(service: UsersService);
    find(tenantId: string): import("@prisma/client").Prisma.PrismaPromise<({
        role: {
            id: string;
            name: string;
            active: boolean;
            tenantId: string;
            description: string | null;
        };
    } & {
        id: string;
        name: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string;
        phone: string | null;
        passwordHash: string;
        roleId: string | null;
        lastLogin: Date | null;
    })[]>;
}
