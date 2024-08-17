import { Request, Response, NextFunction } from "express";
import { INVALID_BODY_TOKEN } from "../../constants/message.constant";
import { returnError } from "./response.handler";
import * as CryptoJS from "crypto-js";
import BigNumber from "bignumber.js";

const PROJECT_NAME_ENCRYPTION_KEY = process.env.PROJECT_NAME_ENCRYPTION_KEY;
const encryption_key = `${PROJECT_NAME_ENCRYPTION_KEY}`;

export const isEmpty = (value: string | number | object): boolean => {
  if (value === null) {
    return true;
  } else if (typeof value !== "number" && value === "") {
    return true;
  } else if (typeof value === "undefined" || value === undefined) {
    return true;
  } else if (
    value !== null &&
    typeof value === "object" &&
    !Object.keys(value).length
  ) {
    return true;
  } else {
    return false;
  }
};

/** generate otp */
export const generateOtp = async () => {
  try {
    const otpCode: number = Math.floor(100000 + Math.random() * 900000);
    return otpCode;
  } catch (error: any) {
    return returnError(true, error.message);
  }
};

export const encryptBody = async (data: any) => {
  try {
    // Encrypt
    const cipherText: any = CryptoJS.AES.encrypt(
      data,
      encryption_key
    ).toString();
    return cipherText;
  } catch (error) {
    console.log("error == ", error);
    return returnError(true, INVALID_BODY_TOKEN);
  }
};

export const decryptBody = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (process.env.ENCRYPTION === "true") {
      const token = req?.body?.reqData;
      if (token != undefined) {
        console.log("IN TOKEN.....");
        // Decrypt
        const bytes = CryptoJS.AES.decrypt(token, encryption_key);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (!originalText) {
          throw originalText;
        }
        console.log("originalText == ", originalText); // 'my message'
        req.body = JSON.parse(originalText);
        next();
      } else {
        next();
      }
    } else {
      next();
    }
  } catch (error) {
    console.log("error == ", error);
    const encData: any = await encryptBody(
      JSON.stringify(returnError(true, INVALID_BODY_TOKEN))
    );
    res.status(400).send({ resData: encData });
  }
};
/**
 * round up to 8 decimals places
 * @param num
 * @returns
 */
export const convertTo8Decimals = (num: BigNumber): number => {
  return new BigNumber(num.toFixed(8)).toNumber();
};
/**
 * round down to 8 decimals places
 * @param num
 * @returns
 */
export const convertTo8DecimalsRoundDown = (num: number): BigNumber => {
  return new BigNumber(new BigNumber(num).toFixed(8, BigNumber.ROUND_DOWN));
};
