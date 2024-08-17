import { ConfigModule, ConfigService } from "@nestjs/config";
import { MiddlewareConsumer, Module } from "@nestjs/common";
// import { ScheduleModule } from "@nestjs/schedule";
// import { WinstonModule } from "nest-winston";
// import * as winston from "winston";
import { RabbitMqModule } from "./common/rabbitMq/rabbit-mq/rabbit-mq.module";
import { RedisModules } from "./common/redis/redis.module";
import { BuysellModule } from "./api/buysell/buysell.module";
import { SequelizeModule } from "@nestjs/sequelize";

import { BaseModelModule } from "./common/base-model/base-model.module";
import {
  DecryptMethodMiddleware,
  EscapeXssMiddleware,
} from "./common/middleware/common.middleware";
import { AdminModule } from "./api/admin/admin.module";
import { AllModels } from "./common/base-model/entities/common-entity.providers";
import { AuthModule } from "./api/auth/auth.module";
import { OrdersModule } from "./api/orders/orders.module";
import { ScheduleModule } from "@nestjs/schedule";
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: "./.env",
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,

    //db connection
    SequelizeModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        return {
          dialect: configService.get("DB_DIALECT"),
          host: configService.get("DB_HOST"),
          port: +configService.get("DB_PORT"),
          username: configService.get("DB_USER"),
          password: configService.get("DB_PASS"),
          database: configService.get("DB_NAME"),
          autoLoadModels: true,
          pool: {
            max: 20,
            min: 0,
            acquire: 30000,
            idle: 10000,
          },
          // synchronize: true,
          // force: true, //this option will drop all tables
          models: [...AllModels],
          define: {
            timestamps: false,
          },
          logging: false,
        };
      },
      inject: [ConfigService],
    }),
    RedisModules,
    BaseModelModule,
    RabbitMqModule,
    BuysellModule,
    AdminModule,
    OrdersModule,
  ],
  providers: [ConfigService],
  controllers: [],
})
export class AppModule {
  // apply middleware to throughout the app
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DecryptMethodMiddleware, EscapeXssMiddleware).forRoutes("*");
  }
}
