import { Module } from "@nestjs/common";
import { BuysellService } from "./buysell.service";
import { BuysellController } from "./buysell.controller";

import { CommonEntityProviders } from "src/common/base-model/entities/common-entity.providers";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";

import { WalletGatewayService } from "./wallet-gateway.service";
import { GATEWAY_PACKAGE_NAME, GATEWAY_SERVICE_NAME } from "src/constants";
import { BuySellCronService } from "./buysell-cron.service";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: GATEWAY_SERVICE_NAME,
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: configService.get("WALLET_GATEWAY_GRPC"),
            package: GATEWAY_PACKAGE_NAME, // ['hero', 'hero2']
            protoPath: ["src/grpc-service/proto/gateway.proto"], // ['./hero/hero.proto', './hero/hero2.proto'],
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
  controllers: [BuysellController],
  providers: [
    BuysellService,
    WalletGatewayService,
    ...CommonEntityProviders,
    BuySellCronService,
  ],
  exports: [BuysellService, WalletGatewayService],
})
export class BuysellModule {}
