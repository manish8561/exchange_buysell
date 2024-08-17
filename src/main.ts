import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/error-handler/http-exception.filter";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { RMQ_SERVER_QUEUES_ARRAY } from "./constants";
import helmet from "helmet";
import { IS_YES_NO_ENUM } from "./constants/enums";

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  const configService = app.get<ConfigService>(ConfigService);

  const port = configService.get("PORT");
  const service_name = configService.get("SERVICE_NANE");
  //custom logger
  const logger = new Logger(`---${service_name}---`);

  //connecting the rabbitmq execution queue
  const RABBIT_MQ_URL = configService.get("RABBITMQ_URL");
  //rmq servers queues for consumers
  for (const queue of RMQ_SERVER_QUEUES_ARRAY) {
    //server for execution queue
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [RABBIT_MQ_URL],
        queue,
        noAck: false,
        queueOptions: { durable: true },
        prefetchCount: 1,
      },
    });
  }

  //start micro services
  await app.startAllMicroservices();
  // get values from env file for cors security
  const origin: any = configService.get<any>("FRONTENDS")?.split(",") || "*";
  app.enableCors({
    origin, // Replace with your frontend's URL
    methods: ["HEAD", "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Specify the allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify the allowed headers
  });

  app.use(helmet({}));
  app.setGlobalPrefix("api/v1");
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  let allowedOrigins: any = [];
  if (configService.get("ALLOWED_ORIGINS")) {
    try {
      allowedOrigins = JSON.parse(
        configService.get("ALLOWED_ORIGINS").replace(/'/g, '"')
      );
    } catch (error) {
      console.error(
        "Error parsing ALLOWED_ORIGINS environment variable:",
        error
      );
    }
  }

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE,PATCH"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transformOptions: { enableImplicitConversion: true },
      transform: true,
      whitelist: true,
    })
  );
  /*Swagger start Integration*/
  const enableSwagger = configService.get<string>("ENABLE_SWAGGER");
  if (enableSwagger === IS_YES_NO_ENUM.YES) {
    const config = new DocumentBuilder()
      .addBearerAuth()
      .setTitle(configService.get("PROJECT_NAME"))
      .setDescription(configService.get("PROJECT_DESCRIPTION"))
      .setVersion(configService.get("VERSION"))
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("swagger", app, document);
  }
  /*Swagger end Integration*/

  await app.listen(port);

  logger.debug(`${service_name} running on port ${port}`);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
