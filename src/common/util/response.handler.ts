import { encryptBody } from "./utility";

export const returnSuccess = (
  errorBit: boolean,
  msg: any,
  data: any,
  status: any = 200
) => {
  return { error: errorBit, message: msg, data, status };
};
export const returnError = (errorBit: boolean, msg: any, status: any = 400) => {
  return { error: errorBit, message: msg, status, data: null };
};
export const failResponse = async (
  errorBit: boolean,
  msg: any,
  response?: any,
  status: any = 400
) => {
  if (process.env.ENCRYPTION === "true") {
    const encData = await encryptBody(
      JSON.stringify({ error: errorBit, message: msg, status, data: null })
    );
    response.status(400).send({ resData: encData });
  } else {
    response
      .status(400)
      .send({ error: errorBit, message: msg, status, data: null });
  }
};
export const successResponse = async (
  message: string,
  data?: any,
  response?: any,
  status: any = 200
) => {
  if (process.env.ENCRYPTION === "true") {
    const encData = await encryptBody(
      JSON.stringify({ status, error: false, message, data })
    );
    response.status(200).send({ resData: encData });
  } else {
    response.status(status).send({
      status,
      error: false,
      message,
      data,
    });
  }
};

export const socketReturnSuccess = async (
  key: string,
  server: any,
  errorBit: boolean,
  msg: any,
  data: any,
  status: any = 200
) => {
  if (process.env.ENCRYPTION === "true") {
    const encData = await encryptBody(
      JSON.stringify({ status, error: false, msg, data })
    );
    server.emit(key, { resData: encData });
  } else {
    server.emit(key, {
      error: errorBit,
      status: status,
      message: msg,
      res: data,
    });
  }
};

export const socketFailResponse = async (
  key: string,
  server: any,
  errorBit: boolean,
  msg: any,
  status: any = 400
) => {
  if (process.env.ENCRYPTION === "true") {
    const encData = await encryptBody(
      JSON.stringify({ error: errorBit, message: msg, status, data: null })
    );
    server.emit(key, { resData: encData });
  } else {
    server.emit(key, {
      error: errorBit,
      status: status,
      message: msg,
      data: null,
    });
  }
};
