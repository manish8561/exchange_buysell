import { Global, Module } from "@nestjs/common";
import { MyService } from "./redis.service";
import { RedisModule } from "@liaoliaots/nestjs-redis";
import { ConfigService } from "@nestjs/config";
@Global()
@Module({
  imports: [
    RedisModule.forRootAsync(
      {
        useFactory: (configService: ConfigService) => {
          return {
            config: {
              url: configService.get("REDIS_URL"),
            },
          };
        },
        inject: [ConfigService],
      },
      true
    ),
  ],
  providers: [MyService],
  exports: [MyService],
})
export class RedisModules {}
