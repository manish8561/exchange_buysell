import { Module } from "@nestjs/common";
import { PairsFeeService } from "./pairs_fee.service";
import { PairsFeeController } from "./pairs_fee.controller";
import { CommonEntityProviders } from "src/common/base-model/entities/common-entity.providers";

@Module({
  controllers: [PairsFeeController],
  providers: [PairsFeeService, ...CommonEntityProviders],
})
export class PairsFeeModule {}
