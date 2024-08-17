import { Module } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { SettingsController } from "./settings.controller";
import { CommonEntityProviders } from "src/common/base-model/entities/common-entity.providers";
import { RedisModules } from "src/common/redis/redis.module";

@Module({
  imports: [RedisModules],
  controllers: [SettingsController],
  providers: [SettingsService, ...CommonEntityProviders],
})
export class SettingsModule {}
