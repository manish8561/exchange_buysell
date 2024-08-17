import { Global, Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { CommonEntityProviders } from "./entities/common-entity.providers";

@Global()
@Module({
  imports: [SequelizeModule.forFeature()],
  exports: [SequelizeModule, BaseModelModule, ...CommonEntityProviders],
  providers: [...CommonEntityProviders],
})
export class BaseModelModule {}
