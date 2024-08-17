export const SEQUELIZE = "SEQUELIZE";
export const DEVELOPMENT = "dev";
export const STAGE = "stage";
export const PRODUCTION = "prod";
export const PROJECT_NAME = "";
export const DEFAULT_CURRENCY = "NGN";
export const DEFAULT_EXCHANGE_CURRENCY = "USD";
export const DEFAULT_RMQ_TIMEOUT = 10 * 1000; //10 seconds
export const RETRY_MAX_COUNTS = 2;
export const RETRY_MAX_COUNTS_MARKET_MAKER = 6;
export const DECIMALS = 8; //decimal places
export const BUFFER_PERCENTAGE_PAIR_FEE = 10;
export const EXCHANGE_ORDER_STATUS = "EXECUTED";
export const DATE_RANGE_LIMIT = 60;

//rabbit mq service
export const RESPONSE_SERVICE = "RESPONSE_SERVICE";
export const LIQUIDITY_SERVICE = "LIQUIDITY_SERVICE";
export const ACTIVE_PAIRS_SERVICE = "ACTIVE_PAIRS_SERVICE";
export const LIQUIDITY_RESPONSE_SERVICE = "LIQUIDITY_RESPONSE_SERVICE";
export const PAIR_PRICE_SERVICE = "PAIR_PRICE_SERVICE";
export const ADMIN_COIN_BALANCE_SERVICE = "ADMIN_COIN_BALANCE_SERVICE";
export const EXCHANGE_PAIR_STATUS_SERVICE = "EXCHANGE_PAIR_STATUS_SERVICE";
export const GET_ORDER_LIQUIDITY_SERVICE = "GET_ORDER_LIQUDITY_SERVICE";
export const MARKET_MAKER_SERVICE = "MARKET_MAKER_SERVICE";
export const MARKET_MAKER_ORDER_SERVICE = "MARKET_MAKER_ORDER_SERVICE";
export const COIN_PRICE_ADMIN_SERVICE = "COIN_PRICE_ADMIN_SERVICE";
export const BUY_SELL_COIN_ACTIVE_SERVICE = "BUY_SELL_COIN_ACTIVE_SERVICE";
export const TRANSACTION_STATUS_USER_SERVICE =
  "TRANSACTION_STATUS_USER_SERVICE";

// rabbitmq queues
export const EXECUTION_QUEUE = "execution_queue";
export const RESPONSE_QUEUE = "response_queue";
export const LIQUIDITY_QUEUE = "liquidity_queue";
export const LIQUIDITY_RESPONSE_QUEUE = "liquidity_response_queue";
export const ACTIVE_PAIRS_QUEUE = "active_pairs_queue";
export const PAIR_PRICE_QUEUE = "pair_price_queue";
export const ADMIN_COIN_BALANCE_QUEUE = "admin_coin_balance_queue";
export const EXCHANGE_PAIR_STATUS_QUEUE = "exchange_pair_status_queue";
export const GET_PAIR_QUEUE = "get_pair_queue";
export const GET_ORDER_LIQUIDITY_QUEUE = "get_order_liquidity_queue";
export const MARKET_MAKER_QUEUE = "market_maker_queue";
export const MARKET_MAKER_ORDER_QUEUE = "market_maker_order_queue";
export const COIN_PRICE_ADMIN_QUEUE = "coin_price_admin_queue";
export const BUY_SELL_COIN_ACTIVE_QUEUE = "buy_sell_coin_active_queue";
export const TOTAL_FEE_EARNED_QUEUE = "total_fee_earned_queue";
export const TRANSACTION_STATUS_QUEUE = "transaction_status";
export const BUY_SELL_LIMITS = "buy_sell_limits";
export const RMQ_SERVER_QUEUES_ARRAY = [
  ACTIVE_PAIRS_QUEUE,
  BUY_SELL_COIN_ACTIVE_QUEUE,
  EXECUTION_QUEUE,
  GET_PAIR_QUEUE,
  LIQUIDITY_RESPONSE_QUEUE,
  MARKET_MAKER_ORDER_QUEUE,
  TOTAL_FEE_EARNED_QUEUE,
  BUY_SELL_LIMITS,
];

//grpc service name
export const GATEWAY_SERVICE_NAME = "GatewayService";
export const GATEWAY_PACKAGE_NAME = "gateway";

export const DURATION_CONVERSION_IN_DAYS = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30,
  YEARLY: 360,
};
