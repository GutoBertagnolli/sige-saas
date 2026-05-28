import { TenantsService } from './tenants.service';
export declare class TenantsController {
    private service;
    constructor(service: TenantsService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        slug: string;
        name: string;
        logoUrl: string | null;
        primaryColor: string;
        secondaryColor: string;
        domain: string | null;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
