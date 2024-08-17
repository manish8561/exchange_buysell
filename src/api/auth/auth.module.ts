import { Global, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./auth.guard";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        return {
          global: true,
          secret: configService.get("JWT_SECRET"),
          signOptions: { expiresIn: configService.get("TOKEN_EXPIRATION") },
        };
      },
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: "USER_PACKAGE",
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: configService.get("USER_GRPC_NEW_PORT"),
            package: "user", // ['hero', 'hero2']
            protoPath: ["src/grpc-service/proto/user/user.proto"], // ['./hero/hero.proto', './hero/hero2.proto'],
            loader: {
              enums: String,
              longs: String,
              keepCase: true,
              defaults: false,
              arrays: true,
              objects: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: "ADMIN_PACKAGE",
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: configService.get("NEW_ADMIN_GRPC_PORT"),
            package: "admin", // ['hero', 'hero2']
            protoPath: ["src/grpc-service/proto/admin/admin.proto"], // ['./hero/hero.proto', './hero/hero2.proto'],
            loader: {
              enums: String,
              longs: String,
              keepCase: true,
              defaults: false,
              arrays: true,
              objects: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [
    JwtService,
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
