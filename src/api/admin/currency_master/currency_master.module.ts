import { Module } from "@nestjs/common";
import { CurrencyMasterService } from "./currency_master.service";
import { CurrencyMasterController } from "./currency_master.controller";
import { CommonEntityProviders } from "src/common/base-model/entities/common-entity.providers";

@Module({
  controllers: [CurrencyMasterController],
  providers: [CurrencyMasterService, ...CommonEntityProviders],
})
export class CurrencyMasterModule {}
