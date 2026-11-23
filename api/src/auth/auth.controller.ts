import {
  UseGuards,
  Body,
  Req,
  Controller,
  Post,
  Version,
  HttpCode,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { IAuthenticate } from './interfaces/role.interface';

import { AdminSignUpDto } from './dtos/admin-signup.dto';
import { ResidentSignUpDto } from './dtos/resident-signup.dto';
import { LoginDto } from './dtos/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('/admin/signup')
  @Version('1')
  adminSignUp(@Body() adminSignUpDto: AdminSignUpDto): Promise<IAuthenticate> {
    return this.authService.adminSignUp(adminSignUpDto);
  }

  @Post('/resident/signup')
  @Version('1')
  residentSignUp(
    @Body() residentSignUpDto: ResidentSignUpDto): Promise<IAuthenticate> {
    return this.authService.residentSignUp(residentSignUpDto);
  }

  @Post('/login')
  @Version('1')
  @HttpCode(200)
  login(
    @Body(new ValidationPipe()) loginDto: LoginDto,
  ): Promise<IAuthenticate> {
    return this.authService.login(loginDto);
  }
  @Post('logout')
  @Version('1')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req) {
    const userId = req.user.id;
    const token = req.headers.authorization.split(' ')[1];

    return this.authService.logout(userId, token);
  }
}
