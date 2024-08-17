import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NextFunction, Request, Response } from "express";

import * as CryptoJS from "crypto-js";
import { failResponse, returnError } from "../util/response.handler";
import {
  INVALID_BODY_TOKEN,
  INVALID_DATA,
} from "src/constants/message.constant";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  logger = new Logger("---Common Middlewarre---");
  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log("Request...", req.method);
    next();
  }
}

@Injectable()
export class DecryptMethodMiddleware implements NestMiddleware {
  logger = new Logger("---DecryptMethod---");
  constructor(private configService: ConfigService) {}
  /**
   * Encrypt Method
   * @param data
   * @returns
   */
  async encryptBody(data: any) {
    try {
      const PROJECT_NAME_ENCRYPTION_KEY = this.configService.get(
        "PROJECT_NAME_ENCRYPTION_KEY"
      );
      const encryption_key = `${PROJECT_NAME_ENCRYPTION_KEY}`;
      // Encrypt
      const cipherText: any = CryptoJS.AES.encrypt(
        data,
        encryption_key
      ).toString();
      return cipherText;
    } catch (error) {
      this.logger.log("error == ", error);
      return returnError(true, INVALID_BODY_TOKEN);
    }
  }
  /**
   * DecryptMethod with Middleware in NestJS
   * @param req
   * @param res
   * @param next
   * @returns
   */
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const ENCRYPTION = this.configService.get<string>("ENCRYPTION");
      // http methods for encryptions in the request
      const HTTP_METHODS = ["POST", "PUT", "PATCH"];
      if (
        ENCRYPTION === "true" &&
        HTTP_METHODS.indexOf(req.method.toUpperCase()) > -1
      ) {
        const PROJECT_NAME_ENCRYPTION_KEY = this.configService.get(
          "PROJECT_NAME_ENCRYPTION_KEY"
        );
        const encryption_key = `${PROJECT_NAME_ENCRYPTION_KEY}`;
        const token = req?.body?.reqData;
        if (token) {
          this.logger.log("IN TOKEN.....");
          // Decrypt
          const bytes = CryptoJS.AES.decrypt(token, encryption_key);
          const originalText = bytes.toString(CryptoJS.enc.Utf8);
          if (!originalText) {
            throw originalText;
          }
          this.logger.log("originalText == ", originalText); // 'my message'
          req.body = JSON.parse(originalText);
          next();
        } else {
          throw new Error("No request data found!");
        }
      } else {
        next();
      }
    } catch (error) {
      this.logger.log("error == ", error);
      const encData: any = await this.encryptBody(
        JSON.stringify(returnError(true, INVALID_BODY_TOKEN))
      );
      res.status(400).send({ resData: encData });
      return;
    }
  }
}

@Injectable()
export class EscapeXssMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const skipXssArray = ["profileImage", "passportFront"];

    try {
      const checkForXss = (data: any) => {
        if (data) {
          Object.keys(data).forEach((key) => {
            const value = data[key];
            if (typeof value === "string" && /[&<>"'=*']/.test(value)) {
              const skipKey = skipXssArray.find((e) => e === key);
              if (!skipKey) throw returnError(true, INVALID_DATA);
            }
            if (
              typeof value === "string" &&
              /\b(?:eval|setTimeout|setInterval|alert|console|log|Function)\b/.test(
                value
              )
            ) {
              const skipKey = skipXssArray.find((e) => e === key);
              if (!skipKey) throw returnError(true, INVALID_DATA);
            }
          });
        }
      };
      //checking the code
      checkForXss(req.body);
      checkForXss(req.query);
      checkForXss(req.params);

      next();
    } catch (error) {
      console.log("EscapeXssMiddleware error:::", error);
      return failResponse(true, error.message, res);
    }
  }
}
