import { Body, Controller, Get, Headers, Post, Put, Req } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsString() tenantSlug: string;
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  photoUrl?: string | null;
}

class UpdatePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(6) newPassword: string;
}

function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeIpAddress(value?: string | null) {
  if (!value) return null;

  const ip = value.split(',')[0].trim();
  return ip.replace(/^::ffff:/, '') || null;
}

function getClientIp(request: any) {
  return normalizeIpAddress(
    firstHeaderValue(request.headers?.['cf-connecting-ip']) ||
      firstHeaderValue(request.headers?.['x-real-ip']) ||
      firstHeaderValue(request.headers?.['x-forwarded-for']) ||
      request.ip ||
      request.socket?.remoteAddress,
  );
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Req() request: any) {
    return this.auth.login(dto.email, dto.password, dto.tenantSlug, getClientIp(request) || undefined);
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return this.auth.me(authorization);
  }

  @Put('profile')
  updateProfile(@Headers('authorization') authorization: string | undefined, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(authorization, dto);
  }

  @Put('password')
  updatePassword(@Headers('authorization') authorization: string | undefined, @Body() dto: UpdatePasswordDto) {
    return this.auth.updatePassword(authorization, dto);
  }
}
