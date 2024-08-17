import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { Response } from "express";
import { UNAUTHORIZED } from "../../constants/message.constant";
import { encryptBody } from "../util/utility";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();
    let errorMessage =
      (errorResponse as HttpExceptionResponse).message || exception.message;
    if (exception.message == "Unauthorized") {
      console.log("exception filter error")
      errorMessage = UNAUTHORIZED;
    }

    if (process.env.ENCRYPTION === "true") {
      const encData = await encryptBody(
        JSON.stringify({
          error: true,
          message: errorMessage,
          status,
          data: null,
        })
      );
      response.status(400).send({ resData: encData });
    } else {
      response.status(status).json({
        status: status,
        error: true,
        message: errorMessage,
        data: null,
      });
    }
  }
}

export interface HttpExceptionResponse {
  statusCode: number;
  message: any;
  error: string;
}
