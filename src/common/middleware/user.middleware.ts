import { returnError } from "../util/response.handler";
import { Response } from "express";
import { encryptBody } from "../util/utility";

const sendResponse = async (res: Response, data: any) => {
  res.status(406);
  if (process.env.ENCRYPTION === "true") {
    const enc = await encryptBody(
      JSON.stringify(returnError(true, `${data}`, 406))
    );
    return res.json({ resData: enc });
  } else {
    return res.json(returnError(true, `${data}`, 406));
  }
};
