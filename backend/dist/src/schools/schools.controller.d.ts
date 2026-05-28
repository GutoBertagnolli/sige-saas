import { SchoolsService } from './schools.service';
export declare class SchoolsController {
    private readonly service;
    constructor(service: SchoolsService);
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
    create(body: any): import("@prisma/client").Prisma.Prisma__SchoolClient<{
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
    update(id: string, body: any): import("@prisma/client").Prisma.Prisma__SchoolClient<{
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
