import { PROJECT_NAME } from "./index";
export const httpStatusCodes = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER: 500,
};
export const CONNECTION_NOT_FOUND =
  "Connection provider not found in application context";
export const TIMEOUT_EXCEEDED = (timeout: number) =>
  `timeout of ${timeout.toString()}ms exceeded`;
export const STORAGE_EXCEEDED = (keyword: string) =>
  `Used ${keyword} exceeded the set threshold`;
export const UNHEALTHY_RESPONSE_CODE = (responseCode: string | number) =>
  `The service returned an unhealthy response code: ${responseCode}`;

// NFT Messages create here
export const USER_CREATED = (title: string): string =>
  `User ${title} created successfully.`;
export const USER_NOT_CREATED = "Invalid user details.";
export const USER_NOT_FOUND = "User record not found.";
export const USER_NOT_VERIFIED =
  "Your email is not verified.Please check your email for verification";
export const USER_IS_SUSPENDED =
  "Your account is suspended.You no longer to access your account";
export const RECORD_NOT_FOUND = "Record not found.";
export const FORGOT_PASSWORD_RECORD_NOT_FOUND = (email) =>
  `Thank you, If your ${email} registered with us, we had sent OTP, Please check your ${email} for more information`;
export const NOT_FOUND = (id: number): string => `User  ${id}  not found.`;
export const USER_FOUND_MSG = (records: number): string =>
  `User  ${records}  records found successfully.`;
export const USER_UPDATED = (id: number): string =>
  `User  ${id}  records found successfully.`;
export const USER_DELETED = (records: number): string =>
  `User  ${records}  records found successfully.`;
export const otpSend = (type) => `OTP send to your ${type} successfully`;
export const USER_SIGNUP_SUCCESS = `Thank you for sign-up, you have received an email from ${PROJECT_NAME}. Please check your email for OTP`;
export const USER_EXIST = `Thank you for sign-up, you have received an email from ${PROJECT_NAME}. Please check your email for more information`;
export const USER_NOT_EXIST_FORGOT_PASSWORD = `You have received an email from ${PROJECT_NAME}. Please check your email for more information`;
export const USER_REGISTER = "User registered successfully";
export const SEND_FORGOT_PASSWORD_EMAIL_BODY = (message) => `${message}`;
export const SEND_FORGOT_PASSWORD_EMAIL = (email) =>
  `You have received an email from ${PROJECT_NAME} . Please check your email for OTP`;
export const INVALID_LOGIN = "Invalid email or password.";
export const LOGIN_SUCCESS = "Logged in successfully";
export const UNVERIFIED_EMAIL = `You have received an email from ${PROJECT_NAME}. Please check your email for more information.`;
export const ACCOUNT_DELETED = `You have received an email from ${PROJECT_NAME}. Please check your email for more information.`;
export const ACCOUNT_SUSPENDED = `You have received an email from ${PROJECT_NAME}. Please check your email for more information.`;
export const EMAIL_NOT_REGISTERED = `You have received an email from ${PROJECT_NAME}. Please check your email for more information.`;
export const EMAIL_ALREADY_VERIFIED = "Your email is already verified.";
export const OTP_SENT = "An OTP is sent to your email.";
export const OTP_SENT_PHONE = "An OTP is sent to your mobile.";
export const OTP_SENT_MULTIPLE_TIME =
  "You have reached maximum limit of sending a OTP in a hour.";
export const OTP_TRY_MULTIPLE_TIME =
  "You are try OTP multiple time, please try again after some time.";
export const INVALID_OTP = "Invalid OTP! Please try again.";
export const VERIFY_OTP = "OTP verify successfully.";
export const GOOGLE_2FA_GENERATE = "Your 2fa scan code generate successfully";
export const INVALID_2FA_CODE = "Invalid 2fa code, please try again!";
export const VALID_2FA_CODE = "2fa validate successfully";
export const USER_NAME_ALREADY_TAKEN =
  "Username already taken.Please try another";
export const USER_NAME_AVAILABLE = "Username available";
export const INVALID_OLD_PASSWORD = "Invalid old password.";
export const OLD_PASSWORD_SAME =
  "Old password and new password is same, please try another.";
export const UPDATE_PASSWORD = "Password updated successfully."; // Password will update
export const ACCOUNT_DELETED_SUCCESS = "Your account deleted successfully.";
export const UPDATE_EMAIL = "Your email update successfully.";
export const USER_PROFILE = "User profile fetched successfully";
export const USER_PROFILE_UPDATE = "User profile updated successfully";
export const USER_ACTIVATED = "User activated successfully";
export const USER_DEACTIVATED = "User deactivated successfully";
export const USER_SUSPEND = "User suspended successfully";
export const WRONG_RESULT = "Something went wrong!";
export const UPDATE_PASSWORD_USER = "Password updated successfully";
export const FORGOT_PASSWORD_MULTIPLE_TIME = `You have received an email from ${PROJECT_NAME}. Please check your email for more information.`;
export const LOGOUT_MSG = "Logout Successfully";
export const BLOCK_LOGIN_EMAIL = (email) =>
  `This email address ${email} is not registered/verified with the ${PROJECT_NAME}. Please Sign Up (register and verify) before Sign In.`;
export const REVERIFY_EMAIL_ERROR = (email) =>
  `You are already used ${email} for current account.`;
export const VERIFY_EMAIL_ERROR = "Provide your register email id.";
export const INVALID_BODY_TOKEN = "Invalid body data.";
export const ALREADY_SIGNUP_IN_DONOR = (email) =>
  `Your email ${email} already register with ${PROJECT_NAME} as Donor. Please login and upgrade your Donor account to Fundraiser account.`;
export const EMAIL_ALREADY_REGISTER = (email) =>
  `Your email ${email} is already registered with ${PROJECT_NAME}.`;
export const LIMIT_NUMBER = "limit must be a number";
export const LIMIT_MAX = "limit must be less than 100";
export const KYB_PENDING = "Your KYB is pending, Please complete your KYB.";
export const KYC_PENDING = "Your KYC is pending, Please complete your KYC.";
export const TOKEN_EXPIRE = "Your token is expired, please login again.";
export const UNAUTHORIZED = "You are not authorized to access this page.";
export const PHONE_NUMBER_NOT_REGISTER = `Your phone number is not registered with ${PROJECT_NAME}.`;
export const ACCOUNT_NOT_VERIFIED = "Your account is not verified.";
export const ACCOUNT_NOT_ACTIVE = `Your account is not active with ${PROJECT_NAME}.`;
export const ACCOUNT_NOT_APPROVED = `Your account is not approved by ${PROJECT_NAME} admin .`;

export const ACCOUNT_DELETED_MSG = "Your account is deleted.";
export const USER_FOUND_MESSAGE = "User found successfully.";
export const FOLDER_TYPE_NOT_EXIST = `This folder type is not developed yet. Choose other folder type.`;
export const FILE_NOT_NULL = `Please upload at least one image file`;
export const SUBJECT_OTP = `One Time Verification OTP!`;
export const SUBJECT_SIGNUP = `Email Registered!`;
export const SUBJECT_NOT_VERIFY = `Email not verify!`;
export const SUBJECT_ACCOUNT_DELETE = `Account deleted`;
export const SUBJECT_ACCOUNT_SUSPENDED = `Account Suspended`;
export const SUBJECT_EMAIL_REGISTERED = `Email Registered`;
export const SUBJECT_KYC_APPROVED = `Kyc approved`;
export const SUBJECT_KYC_REJECTED = `Kyc declined`;
export const OTP_INFO_NOT_CREATED = "Otp info not created.";
export const ACCOUNT_BLOCKED_MSG = "Your account is blocked.";
export const GOOGLE_LOGIN = "Google login successfully.";
export const GET_SOCIAL_TYPE = "Social type found successfully.";
export const SOCIAL_LOGIN_FAILED = "Social login failed";
export const INVALID_DATA = "Invalid data.";

export const RES_MSG = {
  COMMON: {
    LIST: "Records found successfully.",
    VIEW: "Record found successfully.",
    UPDATE: "Record updated successfully.",
    CREATE: "Record created successfully.",
    DELETE: "Record deleted successfully.",
    STATUS: "Status updated successfully.",
    NOT_FOUND: "Not found.",
    EXIST: "Record already exists!",
  },
  CURRENCY_MASTER: {
    EXISTS: "Currency already exits with same symbol!",
  },
  PAIRS: {
    EXISTS: "Pair already exits with same tokens!",
    PAIR_NOT_FOUND: "Pair not found!",
  },
  PAIRS_FEE: {
    EXISTS: "Specified pair already exists!",
    INCREASE_ERROR: (amount: number) =>
      `Please increase the value of the minimum order limit to equal or more than the (${amount}).`,
    DECREASE_ERROR: (amount: number) =>
      `Please decrease the value of the maximum order limit to equal or more than the (${amount}).`,
  },
  COIN: {
    COIN_FOUND: "Coin list found successfully.",
  },
  USERS: {
    NOT_FOUND: "User Not found!",
    USER_PROFILE_NOT_COMPLETED: "Please complete your profile first.",
  },
  ORDERS: {
    SUCCESS: "Order is placed successfully!",
  },
};
export const CSV_ERROR = "An error occurred while exporting the CSV.";
export const BUY_SELL_MSG = {
  ERRORS: {
    PAIR_NOT_FOUND: "Specified pair not found!",
    PRIMARY_CURRENCY_NOT_FOUND: "Primary currency not found!",
    SECONDARY_CURRENCY_NOT_FOUND: "Seconday currency not found!",
    EXCHANGE_PAIR_NOT_FOUND:
      "Pair is currently not available for trade on exchange!",
    EXCEED_LIMIT_DAILY_LEVEL_1: `Daily buy/sell Limit exceed! Please upgrade to KYC level 2 or wait till tomorrow.`,
    EXCEED_LIMIT_MONTHLY_LEVEL_1: (date: string) =>
      `Monthly buy/sell Limit exceed! Please upgrade to KYC level 2 or wait till (${date}).`,
    EXCEED_LIMIT_DAILY_LEVEL_2: `Daily buy/sell Limit exceed! Please wait till tomorrow.`,
    EXCEED_LIMIT_MONTHLY_LEVEL_2: (date: string) =>
      `Monthly buy/sell Limit exceed! Please wait till (${date}).`,
    INSUFFICIENT_BUY_BALANCE: "Insufficient balance in wallet to buy!",
    INSUFFICIENT_SELL_BALANCE: "Insufficient balance in wallet to sell!",
    ORDER_LIMITS: "Amount should be greater than to minimum order limit!",
    MAX_ORDER_LIMITS: "Amount should be lesser than to maximum order limit!",
    LIQUDITY_ERROR: (token: string) =>
      `Something went wrong while placing the order for the (${token}).`,
    MARKET_MAKER_ERROR: (token: string) =>
      `Something went wrong while placing the order for the {${token}}!`,
    ADMIN_ERROR: "Something went wrong! ",
    KYC_REJECTED_MSG: "Your proile KYC is rejected",
    EXCHANGE_UNDER_MAINTENANCE:
      "System is currently undergoing maintenance. You cannot buy this pair at the moment.",
    LIQUIDITY_BALANCE_NOT_RETRIVED:
      "System is currently unable to process your order. Please try again later.",
    MARKET_MAKER_NOT_FOUND: (token: string) =>
      `System is currently unable to process your order for (${token}). Please try again later!`,
    PLATFORM_TOTAL_BUY_AMOUNT_EXCEED: (token: string) =>
      `Total maximum buy limit for ${token} has been reached. Please try again later.`,
    USER_TOTAL_BUY_AMOUNT_EXCEED: (token: string) =>
      `Yours total maximum sell limit for ${token} has been reached. Please try again later.`,
    PLATFORM_TOTAL_SELL_AMOUNT_EXCEED: (token: string) =>
      `Total maximum sell limit for ${token} has been reached. Please try again later.`,
    USER_TOTAL_SELL_AMOUNT_EXCEED: (token: string) =>
      `Yours total maximum sell limit for ${token} has been reached. Please try again later.`,
    INCREASE_QTY_ERROR: "Increase the quantity to place order!",
    DECREASE_QTY_ERROR: "Decrease the quantity to place order!",
    ADMIN_TOKEN_LIQUIDITY_ERROR: (token: string) =>
      `System is currently unable to process your order for (${token}). Please try again later.`,
    DATE_RANGE_ERROR: (days: number) => `Date range should be ${days} days.`,
  },
};
