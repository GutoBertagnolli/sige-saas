import { PrismaService } from '../common/prisma.service';
export declare class SchoolsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
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
    }[]>;
    findByTenant(tenantId: string): import("@prisma/client").Prisma.PrismaPromise<{
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
    }[]>;
    create(data: {
        tenantId: string;
        name: string;
        type?: string;
        address?: string;
        phone?: string;
        email?: string;
    }): import("@prisma/client").Prisma.Prisma__SchoolClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, data: {
        name?: string;
        type?: string;
        address?: string;
        phone?: string;
        email?: string;
        active?: boolean;
    }): import("@prisma/client").Prisma.Prisma__SchoolClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__SchoolClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
