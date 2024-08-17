import { Module } from "@nestjs/common";
import { PairsService } from "./pairs.service";
import { PairsController } from "./pairs.controller";
import { CommonEntityProviders } from "src/common/base-model/entities/common-entity.providers";
import { PairsCronService } from "./pairs-cron.service";

@Module({
  controllers: [PairsController],
  providers: [PairsService, ...CommonEntityProviders, PairsCronService],
})
export class PairsModule {}
