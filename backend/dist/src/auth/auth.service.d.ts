import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    login(email: string, password: string, tenantSlug: string): Promise<{
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
        };
        tenant: {
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
        };
    }>;
}
