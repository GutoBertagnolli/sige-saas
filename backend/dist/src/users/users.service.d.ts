import { PrismaService } from '../common/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByTenant(tenantId: string): import("@prisma/client").Prisma.PrismaPromise<({
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
