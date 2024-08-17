import { LOGIN_SUCCESS, USER_REGISTER, VERIFY_OTP } from "./message.constant";

export const STATUS_ENUM = {
  active: "ACTIVE",
  not_verified: "NOT_VERIFIED",
  not_approved: "NOT_APPROVED",
  suspended: "SUSPENDED",
  blocked: "BLOCKED",
  deleted: "DELETED",
};
export const OTP_MODULE = {
  SignUp: 1,
  SignIn: 2,
  ForgotPassword: 3,
  TwoFa: 4,
  VerifyOldEmail: 5,
  VerifyNewEmail: 6,
};
export const OTP_MODULE_REV = {
  1: "SignUp",
  2: "SignIn",
  3: "ForgotPassword",
  4: "TwoFa",
  5: "VerifyOldEmail",
  7: "VerifyNewEmail",
};
export const VERIFY_OTP_MSG = {
  SignUp: USER_REGISTER,
  ForgotPassword: VERIFY_OTP,
  TwoFa: VERIFY_OTP,
  VerifyOldEmail: VERIFY_OTP,
  VerifyNewEmail: VERIFY_OTP,
  SignIn: LOGIN_SUCCESS,
};

export const SOCIAL_LOGIN_ENUM = {
  GOOGLE: "GOOGLE",
  FACEBOOK: "FACEBOOK",
  TWITTER: "TWITTER",
  APPLE: "APPLE",
};

export enum IS_YES_NO_ENUM {
  YES = "YES",
  NO = "NO",
}

export enum IS_ACTIVE_STATUS_PAIR {
  All_ACTIVE = 0,
  BUY_DISABLE = 1,
  SELL_DISABLE = 2,
  BOTH_DISABLE = 3,
}

export enum IS_FIAT_CURRENCY {
  NO = 0,
  YES = 1,
}

export enum IS_EXIST_MARKET {
  NO = 0,
  YES = 1,
}

export enum UserRole {
  Admin = "Admin",
  SubAdmin = "SubAdmin",
  User = "User",
}

export enum BUY_SELL_TYPE {
  Buy = "buy",
  Sell = "sell",
}

export enum ORDER_TYPE {
  Limit = "LIMIT",
  Market = "MARKET",
}

export enum FEE_TYPE {
  Percentage = "percentage",
  Flat = "flat",
}

export enum ORDER_STATUS {
  //custom status
  Pending = "PENDING",
  Queue = "QUEUE",
  Completed = "COMPLETED",
  Failed = "FAILED",
  Retry = "RETRY",
  Liquidity_Pushed = "LIQUIDITY_PUSHED",
  Liquidity_Success = "LIQUIDITY_SUCCESS",
  Market_Maker_Payment_Pending = "MARKET_MAKER_PAYMENT_PENDING",
  Market_Maker_Liquidity_Success = "MARKET_MAKER_LIQUIDITY_SUCCESS",
  Liquidity_Fail = "LIQUIDITY_FAIL",
  Payment_Pending = "PAYMENT_PENDING",
}

export enum BUYSELL_KYC_LEVEL_TYPE {
  PENDING = 1,
  ACTIVE = 2,
  KYC_VERIFIED = 3,
}

export enum NUMERIC_ACTIVE_INACTIVE {
  Inactive = 0,
  Active = 1,
}

export enum BUY_SELL_LIMIT_DURATION {
  DAILY = "DAILY", // 1 DAY
  WEEKLY = "WEEKLY", // 7 DAYS
  MONTHLY = "MONTHLY", //APPROX 30 DAYS
  YEARLY = "YEARLY", //APPROX 360 DAYS
}

export enum IS_SWAP {
  NO = 0,
  YES = 1,
}

export enum IS_MARKET_MAKER {
  NO = 0,
  YES = 1,
}

export enum FEE_REPORT_TRANSACTION_TYPE {
  BUY = "buy",
  SELL = "sell",
  SWAP = "swap",
  MARKUP = "markup",
  MARKDOWN = "markdown",
}

export enum EXCHANGE_STATUS {
  Maintenance = 0,
  Avialable = 1,
}

export enum USER_PROFILE_STATUS {
  Pending = 0,
  Completed = 1,
}
