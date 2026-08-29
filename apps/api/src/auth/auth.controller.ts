import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { CredentialsDto } from "./auth.dto.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup")
  signup(@Body() credentials: CredentialsDto) {
    return this.auth.signup(credentials);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() credentials: CredentialsDto) {
    return this.auth.login(credentials);
  }
}
