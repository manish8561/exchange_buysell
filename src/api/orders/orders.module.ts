import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { CommonEntityProviders } from "src/common/base-model/entities/common-entity.providers";

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, ...CommonEntityProviders],
})
export class OrdersModule {}
