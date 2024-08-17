import { Global, Module } from "@nestjs/common";
import { RabbitMqService } from "./rabbit-mq.service";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {
  LIQUIDITY_QUEUE,
  LIQUIDITY_SERVICE,
  ACTIVE_PAIRS_SERVICE,
  RESPONSE_QUEUE,
  RESPONSE_SERVICE,
  ACTIVE_PAIRS_QUEUE,
  PAIR_PRICE_SERVICE,
  PAIR_PRICE_QUEUE,
  ADMIN_COIN_BALANCE_SERVICE,
  ADMIN_COIN_BALANCE_QUEUE,
  EXCHANGE_PAIR_STATUS_SERVICE,
  EXCHANGE_PAIR_STATUS_QUEUE,
  GET_ORDER_LIQUIDITY_QUEUE,
  GET_ORDER_LIQUIDITY_SERVICE,
  MARKET_MAKER_ORDER_SERVICE,
  MARKET_MAKER_SERVICE,
  MARKET_MAKER_QUEUE,
  MARKET_MAKER_ORDER_QUEUE,
  COIN_PRICE_ADMIN_SERVICE,
  COIN_PRICE_ADMIN_QUEUE,
  BUY_SELL_COIN_ACTIVE_SERVICE,
  BUY_SELL_COIN_ACTIVE_QUEUE,
  TRANSACTION_STATUS_USER_SERVICE,
  TRANSACTION_STATUS_QUEUE,
} from "src/constants";

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        //client for liquidity queue
        name: LIQUIDITY_SERVICE,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            queue: LIQUIDITY_QUEUE,
            urls: [configService.get<string>("RABBITMQ_URL")],
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        //client for response queue
        name: RESPONSE_SERVICE,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            queue: RESPONSE_QUEUE,
            urls: [configService.get<string>("RABBITMQ_URL")],
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        //client for active pair queue
        name: ACTIVE_PAIRS_SERVICE,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            queue: ACTIVE_PAIRS_QUEUE,
            urls: [configService.get<string>("RABBITMQ_URL")],
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        //client for pair price queue
        name: PAIR_PRICE_SERVICE,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            queue: PAIR_PRICE_QUEUE,
            urls: [configService.get<string>("RABBITMQ_URL")],
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        //client for admin coin balance queue
        name: ADMIN_COIN_BALANCE_SERVICE,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            queue: ADMIN_COIN_BALANCE_QUEUE,
            urls: [configService.get<string>("RABBITMQ_URL")],
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        //client for exchange pair status queue
        name: EXCHANGE_PAIR_STATUS_SERVICE,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            queue: EXCHANGE_PAIR_STATUS_QUEUE,
            urls: [configService.get<string>("RABBITMQ_URL")],
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        //client for exchange pair status queue
        name: GET_ORDER_LIQUIDITY_SERVICE,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            queue: GET_ORDER_LIQUIDITY_QUEUE,
            urls: [configService.get<string>("RABBITMQ_URL")],
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        //client for market maker queue
        name: MARKET_MAKER_SERVICE,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            queue: MARKET_MAKER_QUEUE,
            urls: [configService.get<string>("RABBITMQ_URL")],
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        //client for market maker order queue
        name: MARKET_MAKER_ORDER_SERVICE,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            queue: MARKET_MAKER_ORDER_QUEUE,
            urls: [configService.get<string>("RABBITMQ_URL")],
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        //client for market maker order queue
        name: COIN_PRICE_ADMIN_SERVICE,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            queue: COIN_PRICE_ADMIN_QUEUE,
            urls: [configService.get<string>("RABBITMQ_URL")],
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        //client for buy sell coin active queue
        name: BUY_SELL_COIN_ACTIVE_SERVICE,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            queue: BUY_SELL_COIN_ACTIVE_QUEUE,
            urls: [configService.get<string>("RABBITMQ_URL")],
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        //client for user service transaction_status queue
        name: TRANSACTION_STATUS_USER_SERVICE,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            queue: TRANSACTION_STATUS_QUEUE,
            urls: [configService.get<string>("RABBITMQ_URL")],
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [],
  exports: [RabbitMqService],
  providers: [RabbitMqService],
})
export class RabbitMqModule {}
