import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
// import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { IS_ADMIN_KEY, IS_PUBLIC_KEY } from "./decorators/public.decorator";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { lastValueFrom } from "rxjs";
import { RES_MSG } from "src/constants/message.constant";
import { USER_PROFILE_STATUS } from "src/constants/enums";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const isAdmin = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // 💡 See this condition
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.authService.verify(token);
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request["user"] = payload;

      let user: any;
      //checkding for the admin
      if (isAdmin) {
        //checking with grpc admin

        user = await lastValueFrom(this.authService.getAdminById(payload.id));
        if (user && user.token !== token) {
          throw new UnauthorizedException();
        }

        if (!user.id) {
          throw new UnauthorizedException();
        }
        if (user.role !== "ADMIN") {
          console.log("=============Admin Access==================");
          throw new UnauthorizedException();
        }
      } else {
        //checking with grpc user
        user = await lastValueFrom(this.authService.getById(payload.id));
        if (user && user.token !== token) {
          throw new UnauthorizedException();
        }
        // check user profile completed or not
        if (user.isCompleted === USER_PROFILE_STATUS.Pending) {
          throw new Error(RES_MSG.USERS.USER_PROFILE_NOT_COMPLETED);
        }
      }

      if (!user.id) {
        throw new UnauthorizedException();
      }
      request["user"] = user;
    } catch (error) {
      console.log("BuySell: Authgaurd Error: ", error);
      if (error.message === RES_MSG.USERS.USER_PROFILE_NOT_COMPLETED) {
        throw new BadRequestException(error.message);
      }
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
