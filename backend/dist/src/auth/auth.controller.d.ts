import { AuthService } from './auth.service';
declare class LoginDto {
    email: string;
    password: string;
    tenantSlug: string;
}
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    login(dto: LoginDto): Promise<{
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
export {};
