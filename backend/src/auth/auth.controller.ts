import { Body, Controller, Get, Headers, Post, Put } from '@nestjs/common';
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

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password, dto.tenantSlug);
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
