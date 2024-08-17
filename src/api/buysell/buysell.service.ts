import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { returnError, returnSuccess } from "src/common/util/response.handler";
import { ApiResponse } from "src/common/global/interface";
import { BUY_SELL_MSG, RES_MSG } from "src/constants/message.constant";
import sequelize from "sequelize";
import { Pairs } from "src/common/base-model/entities/pairs.entity";
import { CurrencyMaster } from "src/common/base-model/entities/currency_master.entity";
import {
  BUYSELL_KYC_LEVEL_TYPE,
  BUY_SELL_TYPE,
  EXCHANGE_STATUS,
  FEE_TYPE,
  IS_EXIST_MARKET,
  IS_FIAT_CURRENCY,
  IS_MARKET_MAKER,
  IS_SWAP,
  IS_YES_NO_ENUM,
  NUMERIC_ACTIVE_INACTIVE,
  ORDER_STATUS,
} from "src/constants/enums";
import { Orders } from "src/common/base-model/entities/orders.entity";
import { RabbitMqService } from "src/common/rabbitMq/rabbit-mq/rabbit-mq.service";
import { Settings } from "src/common/base-model/entities/settings.entity";
import {
  DEFAULT_CURRENCY,
  DEFAULT_EXCHANGE_CURRENCY,
  DECIMALS,
  EXCHANGE_ORDER_STATUS,
} from "src/constants";
import { MyService } from "src/common/redis/redis.service";
import { PairsFee } from "src/common/base-model/entities/pairs_fee.entity";
import BigNumber from "bignumber.js";
import { WalletGatewayService } from "./wallet-gateway.service";
import { FilterActivePairDto } from "./dto/filter-active-pair.dto";
import {
  convertTo8Decimals,
  convertTo8DecimalsRoundDown,
} from "src/common/util/utility";
import { MarketMakerWallets } from "src/common/base-model/entities/market_maker_wallets.entity";
import * as moment from "moment";

@Injectable()
export class BuysellService {
  constructor(
    @Inject("CURRENCY_MASTER") private currencyMaster: typeof CurrencyMaster,
    @Inject("PAIRS") private pairsRepository: typeof Pairs,
    @Inject("Orders") private orderRespository: typeof Orders,
    @Inject("Settings") private settingsRespository: typeof Settings,
    @Inject("MarketMakerWallets")
    private marketMakerWalletsRespository: typeof MarketMakerWallets,
    private readonly redisService: MyService,
    private readonly rabbitmqService: RabbitMqService,
    private readonly walletGatewayService: WalletGatewayService
  ) {}
  /**
   * test function
   * @returns
   */
  async test(): Promise<any> {
    const res = await this.rabbitmqService.sendTransactionEmail({
      clientId: "927e76bc-b509-11ee-9c50-0254faaea362",
      type: "sell",
      actionType: "failed",
      amount: 1,
      pair: "BTC-USDT2",
      primary_currency: "BTC",
      secondary_currency: "USDT2",
    });
    // const res = await this.checkUserKycStatus({
    //   userId: "ed957101-ff1d-40f3-a18e-025131ffa185",
    //   kycStatus: "ACTIVE",
    //   orderValue: 0,
    // });
    return res;
  }

  /**
   * get pair and pair fees
   * @param param0
   * @returns
   */
  async getPair({
    primary_currency_id,
    secondary_currency_id,
  }: any): Promise<any> {
    let res: any = { order_type: "sell" };
    try {
      const query: any = {
        attributes: [
          [sequelize.fn("BIN_TO_UUID", sequelize.col("Pairs.id")), "id"],
          [
            sequelize.fn("BIN_TO_UUID", sequelize.col("Pairs.currency_id")),
            "currency_id",
          ],
          [
            sequelize.fn(
              "BIN_TO_UUID",
              sequelize.col("Pairs.other_currency_id")
            ),
            "other_currency_id",
          ],
          [sequelize.col("currency.currency_symbol"), "buyTo"],
          [
            sequelize.literal(
              `(SELECT currency_symbol FROM currency_master WHERE id = Pairs.other_currency_id)`
            ),
            "buyFrom",
          ],
          [
            sequelize.literal(
              `(SELECT TRUNCATE(fee,2) FROM pairs_fee WHERE pair_id = Pairs.id AND type='buy' LIMIT 1)`
            ),
            "buyFee",
          ],
          [
            sequelize.literal(
              `(SELECT TRUNCATE(fee,2) FROM pairs_fee WHERE pair_id = Pairs.id AND type='sell' LIMIT 1)`
            ),
            "sellFee",
          ],
          [
            sequelize.literal(
              `(SELECT fee_type FROM pairs_fee WHERE pair_id = Pairs.id AND type='buy' LIMIT 1)`
            ),
            "buyFeeType",
          ],
          [
            sequelize.literal(
              `(SELECT fee_type FROM pairs_fee WHERE pair_id = Pairs.id AND type='sell' LIMIT 1)`
            ),
            "sellFeeType",
          ],
          [
            sequelize.literal(
              `(SELECT order_limit FROM pairs_fee WHERE pair_id = Pairs.id AND type='buy' LIMIT 1)`
            ),
            "buyOrderLimit",
          ],
          [
            sequelize.literal(
              `(SELECT order_limit FROM pairs_fee WHERE pair_id = Pairs.id AND type='sell' LIMIT 1)`
            ),
            "sellOrderLimit",
          ],
          [
            sequelize.literal(
              `(SELECT max_order_limit FROM pairs_fee WHERE pair_id = Pairs.id AND type='buy' LIMIT 1)`
            ),
            "buyMaxOrderLimit",
          ],
          [
            sequelize.literal(
              `(SELECT max_order_limit FROM pairs_fee WHERE pair_id = Pairs.id AND type='sell' LIMIT 1)`
            ),
            "sellMaxOrderLimit",
          ],
          "pair_name",
          // "markup_percentage",
          // "markdown_percentage",
          "markup",
          "markdown",
          // "exist_in_market",
          // "chain_id",
        ],
        where: {
          is_enable: IS_YES_NO_ENUM.YES,
          is_swap: IS_SWAP.YES,
          currency_id: sequelize.fn("UUID_TO_BIN", primary_currency_id),
          other_currency_id: sequelize.fn("UUID_TO_BIN", secondary_currency_id),
        },
        include: [
          {
            model: CurrencyMaster,
            as: "currency",
            attributes: {
              //excludeing all columns from the currency master table
              exclude: [
                `id`,
                `currency_name`,
                `currency_symbol`,
                `is_erc20token`,
                `is_fiat_currency`,
                `token_abi`,
                `token_address`,
                `smallest_unit`,
                `exchange_price_per_usd`,
                `fixer_symbol`,
                `is_active`,
                `decimals`,
                `logo`,
                `createdAt`,
                `updatedAt`,
                `market_cap`,
                `chain_id`,
              ],
            },
          },
        ],
      };
      // sell pair
      let pair = await this.pairsRepository.findOne(query);
      // buy pair
      if (!pair) {
        query.where = {
          is_enable: IS_YES_NO_ENUM.YES,
          is_swap: IS_SWAP.YES,
          currency_id: sequelize.fn("UUID_TO_BIN", secondary_currency_id),
          other_currency_id: sequelize.fn("UUID_TO_BIN", primary_currency_id),
        };
        pair = await this.pairsRepository.findOne(query);
        if (!pair) {
          return returnError(true, RES_MSG.PAIRS.PAIR_NOT_FOUND);
        }
        res = {
          order_type: "buy",
          pair: pair,
        };
      } else {
        res.pair = pair;
      }
      return returnSuccess(false, "success", res);
    } catch (error) {
      console.log("error in getPair function in service file::::", error);
      return returnError(true, error.message);
    }
  }

  /**
   * call active pairs from queue
   * @returns
   */
  public async getActivePairs(): Promise<any> {
    return await this.rabbitmqService.send("active_pairs", {});
  }

  /**
   * Function to get active buysell pairs.
   * @returns
   */
  public async getBuySellPairsList({
    is_swap,
    coin,
  }: FilterActivePairDto): Promise<ApiResponse> {
    let query: any = {
      is_swap,
      is_enable: IS_YES_NO_ENUM.YES,
      "$currency.is_active$": IS_YES_NO_ENUM.YES,
      "$other_currency.is_active$": IS_YES_NO_ENUM.YES,
    };
    if (coin) {
      const coinData = await this.currencyMaster.findOne({
        where: {
          currency_symbol: {
            [sequelize.Op.like]: `%${coin}%`,
          },
        },
      });
      // for disable pair id applicable on currency_id
      query = {
        ...query,
        currency_id: coinData.id,
      };
    }
    const records = await this.pairsRepository.findAll<any>({
      attributes: [
        [sequelize.fn("BIN_TO_UUID", sequelize.col("Pairs.id")), "pair_id"],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("Pairs.currency_id")),
          "currency_id",
        ],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("Pairs.other_currency_id")),
          "other_currency_id",
        ],
        [sequelize.col("currency.currency_symbol"), "buyTo"],
        [
          sequelize.literal(
            `(SELECT currency_symbol FROM currency_master WHERE id = Pairs.other_currency_id)`
          ),
          "buyFrom",
        ],
        [
          sequelize.literal(
            `(SELECT TRUNCATE(fee,2) FROM pairs_fee WHERE pair_id = Pairs.id AND type='buy' LIMIT 1)`
          ),
          "buyFee",
        ],
        [
          sequelize.literal(
            `(SELECT TRUNCATE(fee,2) FROM pairs_fee WHERE pair_id = Pairs.id AND type='sell' LIMIT 1)`
          ),
          "sellFee",
        ],
        [
          sequelize.literal(
            `(SELECT fee_type FROM pairs_fee WHERE pair_id = Pairs.id AND type='buy' LIMIT 1)`
          ),
          "buyFeeType",
        ],
        [
          sequelize.literal(
            `(SELECT fee_type FROM pairs_fee WHERE pair_id = Pairs.id AND type='sell' LIMIT 1)`
          ),
          "sellFeeType",
        ],
        [
          sequelize.literal(
            `(SELECT order_limit FROM pairs_fee WHERE pair_id = Pairs.id AND type='buy' LIMIT 1)`
          ),
          "buyOrderLimit",
        ],
        [
          sequelize.literal(
            `(SELECT order_limit FROM pairs_fee WHERE pair_id = Pairs.id AND type='sell' LIMIT 1)`
          ),
          "sellOrderLimit",
        ],
        [
          sequelize.literal(
            `(SELECT max_order_limit FROM pairs_fee WHERE pair_id = Pairs.id AND type='buy' LIMIT 1)`
          ),
          "buyMaxOrderLimit",
        ],
        [
          sequelize.literal(
            `(SELECT max_order_limit FROM pairs_fee WHERE pair_id = Pairs.id AND type='sell' LIMIT 1)`
          ),
          "sellMaxOrderLimit",
        ],
        "pair_name",
        // "markup_percentage",
        // "markdown_percentage",
        "markup",
        "markdown",
      ],
      where: query,
      include: [
        {
          model: CurrencyMaster,
          as: "currency",
          attributes: [],
        },
        {
          model: CurrencyMaster,
          as: "other_currency",
          attributes: [],
        },
      ],
    });

    return returnSuccess(null, RES_MSG?.COMMON.LIST, records);
  }
  /**
   * find all from pairs table
   * @returns
   */
  async findAll(): Promise<ApiResponse> {
    const records = await this.pairsRepository.findAll<Pairs>();

    return returnSuccess(null, RES_MSG?.COMMON.LIST, records);
  }

  /**
   * get buy sell settings[]
   * @returns
   */
  async getBuySellLimitsSettings(type: number): Promise<Settings> {
    return await this.settingsRespository.findOne({
      where: { is_active: NUMERIC_ACTIVE_INACTIVE.Active, type },
    });
  }
  /**
   * get user order usd total value
   * @param data
   */
  async getUserOrderValueInUSD(userId: string): Promise<any> {
    const userkey = `user_usd_total_${userId}`;
    //implement redis for this total
    let total = await this.redisService.get(userkey);
    if (total) {
      return Number(total);
    }
    const result = await this.orderRespository.findOne({
      attributes: [
        [sequelize.fn("sum", sequelize.col("total_price_usd")), "total"],
      ],
      where: {
        member_id: sequelize.fn("UUID_TO_BIN", userId),
        // created_at: {
        //   [sequelize.Op.gte]: sequelize.literal(
        //     `DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`
        //   ),
        // },
        created_at: {
          [sequelize.Op.gte]: sequelize.literal(
            `DATE_FORMAT(NOW(), '%Y-%m-01')`
          ),
          [sequelize.Op.lte]: sequelize.literal(`LAST_DAY(NOW())`),
        },
        order_status: { [sequelize.Op.ne]: ORDER_STATUS.Failed },
      },
      order: [["created_at", "DESC"]],
    });
    // calculate next date for buy sell
    total = result?.dataValues?.total || 0;
    this.redisService.set(userkey, total, 60);
    return total;
  }

  /**
   * get active pair and paris_fee from pair_id
   * @param pair_id
   * @param order_type
   * @returns
   */
  async getActivePairFromDB(
    pair_id: string,
    order_type: string
  ): Promise<Pairs> {
    return await this.pairsRepository.findOne({
      attributes: [
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col(`currency_id`)),
          `currency_id`,
        ],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col(`other_currency_id`)),
          `other_currency_id`,
        ],
        `pair_name`,
        `created_at`,
        `updated_at`,
        `exist_in_market`,
        `is_swap`,
        `is_enable`,
        `reference_price`,
        `markup_percentage`,
        `markdown_percentage`,
        `markup`,
        `markdown`,
        `exchange_pair`,
        `exchange_pair_name`,
        `active_status`,
        `chain_id`,
      ],
      where: {
        is_enable: IS_YES_NO_ENUM.YES,
        id: sequelize.fn("UUID_TO_BIN", pair_id),
      },
      include: [
        {
          model: PairsFee,
          as: "pairs_fee",
          where: {
            type: order_type,
            is_enable: IS_YES_NO_ENUM.YES,
          },
        },
      ],
    });
  }
  /**
   * get active currency
   * @param id
   * @returns
   */
  async getCurrency(id: string): Promise<CurrencyMaster> {
    return await this.currencyMaster.findOne({
      where: { id: sequelize.fn("UUID_TO_BIN", id) },
    });
  }

  /**
   * liqudity from bitfinex account
   */
  async checkExchangeAccountLiquidity({
    primary_currency_symbol,
    secondary_currency_symbol,
    actual_price,
    order_qty,
    order_type,
  }: any): Promise<void> {
    console.table({
      primary_currency_symbol,
      secondary_currency_symbol,
      actual_price,
      order_qty,
      order_type,
    });
    /** 
        after markup or markdown and fees deduction on order qty
        forumla for buy
        quote = order_qty * actual_price 
        formula for sell
        quote = order_qty
      */
    let token = secondary_currency_symbol;
    let quotes = convertTo8Decimals(actual_price.multipliedBy(order_qty));
    if (order_type === BUY_SELL_TYPE.Sell) {
      token = primary_currency_symbol;
      quotes = convertTo8Decimals(order_qty);
    }
    //changes due to bitfinex
    if (token === DEFAULT_CURRENCY) {
      token = DEFAULT_EXCHANGE_CURRENCY;
    }
    let balance: any = await this.redisService.getValue(
      "admin_coin_balance",
      token
    );
    if (!balance) {
      const res = await this.rabbitmqService.sendToAdminCoinBalanceQueue({
        coin: token,
      });
      console.log({
        from: "from liquidity service",
        token,
        res,
      });
      if (res.error) {
        throw new Error(res.message);
      }
      balance = res.data;
      if (!res.data) {
        throw new Error(BUY_SELL_MSG.ERRORS.LIQUIDITY_BALANCE_NOT_RETRIVED);
      }
    }

    // check balance
    console.log(balance, quotes, "---------------------------");
    if (Number(balance) < quotes) {
      throw new Error(BUY_SELL_MSG.ERRORS.ADMIN_TOKEN_LIQUIDITY_ERROR(token));
    }
  }
  /**
   * get price from liquidity service
   * @param pair
   * @returns
   */
  async getPriceFromLiquidity(pair: string): Promise<number> {
    // from redis
    const prices = await this.redisService.getValue("pair_price", pair);
    if (prices) {
      return new BigNumber(prices).toNumber();
    }
    //from liquidity queue for price
    const res = await this.rabbitmqService.sendToPairPriceQueue({
      pair,
    });
    if (res.error) {
      throw new Error(res.message);
    }
    return new BigNumber(res.data).toNumber();
  }
  /**
   * liqudity from market maker account
   */
  async marketMakerBalance({
    primary_currency_symbol,
    secondary_currency_symbol,
    actual_price,
    order_qty,
    order_type,
    market_maker_client_id,
  }: any): Promise<void> {
    let token = primary_currency_symbol;
    let quotes = convertTo8Decimals(order_qty);

    if (order_type === BUY_SELL_TYPE.Sell) {
      token = secondary_currency_symbol;
      quotes = convertTo8Decimals(actual_price.multipliedBy(order_qty));
    }
    //check user balance for buy/sell
    //lock wallet balance with grpc
    const resultBalance = await this.walletGatewayService.getBalance({
      clientId: market_maker_client_id,
      coin: token.toLowerCase(),
      coinSymbol: token.toLowerCase(),
    });

    //error check
    if (resultBalance.error) {
      throw new Error(resultBalance.message);
    }
    //check user wallet balance from wallet service
    // convert balance to decimal value
    const balance = new BigNumber(resultBalance.data.balance)
      .dividedBy(10 ** DECIMALS)
      .toNumber();

    // check balance
    if (balance < quotes) {
      throw new Error(BUY_SELL_MSG.ERRORS.ADMIN_TOKEN_LIQUIDITY_ERROR(token));
    }
  }
  /**
   * get market maker id, client id and withdraw limit, per user withdraw limit
   * @param coin
   * @returns
   */
  async getMarketMaker(coin: string): Promise<any> {
    coin = coin.toLowerCase();
    let res: any = await this.redisService.getValue(
      "market_maker_details",
      coin
    );
    if (res) {
      return JSON.parse(res);
    }
    res = await this.rabbitmqService.getMarketMakerDetails({
      coin,
    });
    if (res.status === HttpStatus.OK) {
      return res.data;
    }
    if (res.error) {
      throw new Error(res.message);
    }
    if (!res.data) {
      throw new Error(BUY_SELL_MSG.ERRORS.MARKET_MAKER_NOT_FOUND(coin));
    }
  }
  /**
   * get users order market maker limit
   * for all users and single user according to buy/sell
   * @param param0
   * @returns
   */
  async getUserOrderMarketMakerLimit({
    primary_currency_id,
    order_type,
    userId,
  }: any): Promise<number> {
    const query: any = {
      is_market_maker: IS_MARKET_MAKER.YES,
      order_status: ORDER_STATUS.Completed,
      order_type,
    };
    if (primary_currency_id) {
      query.member_id = sequelize.fn("UUID_TO_BIN", primary_currency_id);
    }
    if (userId) {
      query.member_id = sequelize.fn("UUID_TO_BIN", userId);
    }
    const res: any = await this.orderRespository.findOne({
      attributes: [
        [sequelize.fn("sum", sequelize.col("order_qty")), "total_amount"],
      ],
      where: query,
    });
    if (!res.dataValues.total_amount) return 0;
    return res?.dataValues?.total_amount;
  }
  /**
   * check limits for order
   * @param param0
   * @returns
   */
  async checkMarketMakerLimits({
    marketMakerObj,
    order_type,
    currency_id,
    order_qty,
    userId,
    token,
  }: any): Promise<void> {
    switch (order_type) {
      case BUY_SELL_TYPE.Buy:
        {
          const totalAmountMarketMaker =
            await this.getUserOrderMarketMakerLimit({
              primary_currency_id: currency_id,
              order_type: BUY_SELL_TYPE.Buy.toUpperCase(),
            });
          if (
            totalAmountMarketMaker >
            marketMakerObj.totalBuyLimit + order_qty
          ) {
            throw new Error(
              BUY_SELL_MSG.ERRORS.PLATFORM_TOTAL_BUY_AMOUNT_EXCEED(token)
            );
          }
          const totalUserAmountMarketMaker =
            await this.getUserOrderMarketMakerLimit({
              primary_currency_id: currency_id,
              userId: userId,
              order_type: BUY_SELL_TYPE.Buy.toUpperCase(),
            });
          if (
            totalUserAmountMarketMaker >
            marketMakerObj.buyLimitPerUser + order_qty
          ) {
            throw new Error(
              BUY_SELL_MSG.ERRORS.USER_TOTAL_BUY_AMOUNT_EXCEED(token)
            );
          }
        }
        break;
      case BUY_SELL_TYPE.Sell: {
        const totalAmountMarketMaker = await this.getUserOrderMarketMakerLimit({
          primary_currency_id: currency_id,
          order_type: BUY_SELL_TYPE.Sell.toUpperCase(),
        });
        if (
          totalAmountMarketMaker >
          marketMakerObj.totalSellLimit + order_qty
        ) {
          throw new Error(
            BUY_SELL_MSG.ERRORS.PLATFORM_TOTAL_SELL_AMOUNT_EXCEED(token)
          );
        }
        const totalUserAmountMarketMaker =
          await this.getUserOrderMarketMakerLimit({
            primary_currency_id: currency_id,
            userId: userId,
            order_type: BUY_SELL_TYPE.Sell.toUpperCase(),
          });
        if (
          totalUserAmountMarketMaker >
          marketMakerObj.sellLimitPerUser + order_qty
        ) {
          throw new Error(
            BUY_SELL_MSG.ERRORS.USER_TOTAL_SELL_AMOUNT_EXCEED(token)
          );
        }
      }
    }
  }
  /**
   * get admin pair for conversion
   * @param pair
   * @returns
   */
  async getAdminPairConversionPrice(
    pair: string,
    order_type: string
  ): Promise<number> {
    let result = await this.redisService.get(pair);
    let amount = new BigNumber(0);
    if (result) {
      result = JSON.parse(result);
    } else {
      result = await this.rabbitmqService.getCoinPriceAdmin({
        pair,
      });
      if (result.status === HttpStatus.OK) {
        result = result.data;
      } else {
        throw new Error(result.message);
      }
    }
    amount = new BigNumber(result.amount);
    if (order_type === BUY_SELL_TYPE.Buy) {
      //buy
      amount = amount.plus(amount.multipliedBy(result.markup).dividedBy(100));
    } else {
      //sell
      amount = amount.minus(
        amount.multipliedBy(result.markdown).dividedBy(100)
      );
    }
    return convertTo8Decimals(amount);
  }
  /**
   * check exchange status
   * @returns
   */
  async checkExchangeStatus(): Promise<boolean> {
    let res = await this.redisService.get("exchange_status");
    if (Number(res) === EXCHANGE_STATUS.Avialable) {
      return true;
    }
    res = await this.rabbitmqService.sendToExchangeStatusQueue({});
    if (res.error) {
      // error code
      throw new Error(res.message);
    }
    // maintenance mode error
    if (res.data.status === EXCHANGE_STATUS.Maintenance) {
      throw new Error(BUY_SELL_MSG.ERRORS.EXCHANGE_UNDER_MAINTENANCE);
    }
    return true;
  }
  /**
   * check user kyc and buy/sell limit before placing the order
   * @param param0
   */
  async checkUserKycStatus({
    userId,
    kycStatus,
    orderValue,
  }: any): Promise<void> {
    //next month first date
    const nextDate = moment().add(1, "M").format("01-MM-YYYY");
    let errorMsg = BUY_SELL_MSG.ERRORS.EXCEED_LIMIT_MONTHLY_LEVEL_1(nextDate);
    // duration,
    let limit: any = "",
      checkLimit = false,
      totals = new BigNumber(orderValue);

    //if kyc verfied for buy sell limit
    //return the respone for rejected kyc
    // if (request.kycStatus === "REJECTED") {
    //   this.rabbitmqService.orderResponse({
    //     status: "error",
    //     message: BUY_SELL_MSG.ERRORS.KYC_REJECTED_MSG,
    //     socketClientId,
    //   });
    //   return;
    // }
    // for active user for level 1 kyc
    const settings = await this.getBuySellLimitsSettings(
      BUYSELL_KYC_LEVEL_TYPE.ACTIVE
    );
    limit = settings.bs_limit;
    // duration = settings.duration;

    //--start here -- for level 2
    if (kycStatus === "APPROVED") {
      errorMsg = BUY_SELL_MSG.ERRORS.EXCEED_LIMIT_MONTHLY_LEVEL_2(nextDate);
      const settings = await this.getBuySellLimitsSettings(
        BUYSELL_KYC_LEVEL_TYPE.KYC_VERIFIED
      );
      limit = settings.bs_limit;
      // duration = settings.duration;
    }
    if (limit !== "unlimited") {
      checkLimit = true;
    }
    // check the buy sell limit
    if (checkLimit && Number(limit) > 0) {
      limit = new BigNumber(limit);
      const total = await this.getUserOrderValueInUSD(userId);
      totals = totals.plus(new BigNumber(total));
      //return the respone
      if (totals.isGreaterThanOrEqualTo(limit)) {
        throw new Error(errorMsg);
      }
    }
  }
  /**
   * validate order with buy sell limit and send to response queue or liquidity queue
   * @param request
   */
  async validateOrderBuySell(request: any): Promise<void> {
    let pair: any;
    let marketMaker = false;
    let is_swap = 0,
      chain_id = 0,
      amount = 0, //in wallet for buy/sell
      coin = "fiat",
      coinSymbol = "ngn",
      wallet_gateway_type = "buy-out",
      order_qty = new BigNumber(request.qty);
    let primary_currency_symbol = "",
      secondary_currency_symbol = "",
      market_maker_id = "",
      market_maker_client_id = "";
    const { socketClientId } = request;
    // checking for pair on exchange and db
    try {
      pair = await this.getActivePairFromDB(
        request.pair_id,
        request.order_type
      );
      if (!pair) {
        //return to order response queue
        this.rabbitmqService.orderResponse({
          status: "error",
          message: BUY_SELL_MSG.ERRORS.PAIR_NOT_FOUND,
          socketClientId,
        });
        return;
      }
    } catch (error) {
      this.rabbitmqService.orderResponse({
        status: "error",
        message: error.message,
        socketClientId,
      });
      return;
    }
    //check for currency active or not
    const primary_currency = await this.getCurrency(pair.currency_id);
    if (!primary_currency || primary_currency.is_active === IS_YES_NO_ENUM.NO) {
      //return to order response queue
      this.rabbitmqService.orderResponse({
        status: "error",
        message: BUY_SELL_MSG.ERRORS.PRIMARY_CURRENCY_NOT_FOUND,
        socketClientId,
      });
      return;
    }
    primary_currency_symbol = primary_currency.currency_symbol;
    //check for secondary currency
    const secondary_currency = await this.getCurrency(pair.other_currency_id);
    if (
      !secondary_currency ||
      secondary_currency.is_active === IS_YES_NO_ENUM.NO
    ) {
      //return to order response queue
      this.rabbitmqService.orderResponse({
        status: "error",
        message: BUY_SELL_MSG.ERRORS.SECONDARY_CURRENCY_NOT_FOUND,
        socketClientId,
      });
      return;
    }
    secondary_currency_symbol = secondary_currency.currency_symbol;
    console.log("----------------0-----------------");

    chain_id = pair.chain_id;
    // check for exist in exchange or not
    if (pair.exist_in_market === IS_EXIST_MARKET.NO) {
      //market maker order
      marketMaker = true;
    }
    if (!marketMaker) {
      //check exchange
      try {
        const res = await this.checkExchangeStatus();
        if (!res) {
          this.rabbitmqService.orderResponse({
            status: "error",
            message: BUY_SELL_MSG.ERRORS.EXCHANGE_UNDER_MAINTENANCE,
            socketClientId,
          });
          return;
        }
      } catch (error) {
        this.rabbitmqService.orderResponse({
          status: "error",
          message: error.message,
          socketClientId,
        });
        return;
      }
      //check pair on exchange with queue from liquidity service
      const exchangeSymbol = pair.exchange_pair_name;
      try {
        const res = await this.rabbitmqService.sendToActivePairsExchangeQueue({
          pair: exchangeSymbol,
        });
        console.log("----------------0.0-----------------");
        //check error
        if (res.error) {
          this.rabbitmqService.orderResponse({
            status: "error",
            message: res.message,
            socketClientId,
          });
          return;
        }
        if (!res.data) {
          this.rabbitmqService.orderResponse({
            status: "error",
            message: BUY_SELL_MSG.ERRORS.EXCHANGE_PAIR_NOT_FOUND,
            socketClientId,
          });
          return;
        }
      } catch (error) {
        this.rabbitmqService.orderResponse({
          status: "error",
          message: error.message,
          socketClientId,
        });
        return;
      }
    }
    console.log("----------------0.1----------------");
    //is_swap
    if (secondary_currency.is_fiat_currency === IS_FIAT_CURRENCY.NO) {
      is_swap = IS_SWAP.YES;
    }
    //buy sell amount, coin and coinsymbol for grpc request
    if (request.order_type === BUY_SELL_TYPE.Buy) {
      if (is_swap === IS_SWAP.YES) coin = secondary_currency_symbol;
      coinSymbol = secondary_currency_symbol;
    } else {
      //sell
      amount = request.qty;
      coin = primary_currency_symbol;
      coinSymbol = primary_currency_symbol;
      wallet_gateway_type = "sell-out";
    }
    //for swap
    if (is_swap) {
      wallet_gateway_type = "swap-out";
    }

    //conversion rate according default currency
    let rate = 0;
    // getting pair from admin service like USD-NGN
    let currency_pair = `${DEFAULT_EXCHANGE_CURRENCY}-${DEFAULT_CURRENCY}`;
    if (is_swap) {
      currency_pair = `${secondary_currency_symbol}-${DEFAULT_CURRENCY}`;
    }
    let defaultCurrencyRate = 0;
    try {
      defaultCurrencyRate = await this.getAdminPairConversionPrice(
        currency_pair,
        request.order_type
      );
    } catch (error) {
      this.rabbitmqService.orderResponse({
        status: "error",
        message: `${BUY_SELL_MSG.ERRORS.ADMIN_ERROR}${error.message}`,
        socketClientId,
      });
      return;
    }
    if (secondary_currency.currency_symbol.toUpperCase() === DEFAULT_CURRENCY) {
      rate = 1;
    } else if (is_swap) {
      console.log("----------------1-----------------");
      rate = defaultCurrencyRate;
    } else {
      // for other fiat currency
    }
    console.table({ rate });
    console.log("----------------2-----------------");

    // kyc status buy sell limit
    // --start here--
    try {
      await this.checkUserKycStatus({
        userId: request.userId,
        kycStatus: request.kycStatus,
        orderValue: 0,
      });
    } catch (error) {
      this.rabbitmqService.orderResponse({
        status: "error",
        message: error.message,
        socketClientId,
      });
      return;
    }
    // kyc status buy sell limit
    // --end here--
    console.log("----------------3-----------------");

    //fetch unit price for the pair
    let price: any = new BigNumber(0),
      actual_price_org = new BigNumber(0);
    let exchangeSymbol = "";
    // check for exist in exchange or not
    if (pair.exist_in_market === IS_EXIST_MARKET.YES) {
      exchangeSymbol = pair.exchange_pair_name;
    }
    //if external exchange symbol found
    if (exchangeSymbol) {
      //check price on exchange
      try {
        const res = await this.getPriceFromLiquidity(exchangeSymbol);
        console.log(res, "from liqudity service");
        price = new BigNumber(res);
        actual_price_org = price;
        console.table({
          price: price.toNumber(),
          defaultCurrencyRate,
        });
        //convert to default currency
        if (secondary_currency_symbol === DEFAULT_CURRENCY) {
          price = price.multipliedBy(defaultCurrencyRate);
        }
        console.log("----------------3.0-----------------");
      } catch (error) {
        this.rabbitmqService.orderResponse({
          status: "error",
          message: `${BUY_SELL_MSG.ERRORS.LIQUDITY_ERROR(exchangeSymbol)} ${
            error.message
          }`,
          socketClientId,
        });
        return;
      }
    } else {
      // market maker
      price = new BigNumber(pair.reference_price);
    }
    console.log("----------------4-----------------");
    console.table({
      price: price.toNumber(),
    });

    let orderId: string;
    try {
      console.log("----------------5-----------------");
      const actual_price: BigNumber = price;
      let markupdown_price = new BigNumber(0),
        markupdown_qty = new BigNumber(0),
        markupdown_fee = new BigNumber(0),
        markupdown_fee_in_qty = new BigNumber(0),
        actual_total_price = new BigNumber(0);
      // add fees here and get pair fee
      const pairsFee = pair.pairs_fee[0];
      const request_price = convertTo8DecimalsRoundDown(request.price);
      // total price equal to request price
      let total_price: BigNumber = request_price;
      //markup and markdown price
      /** formula
        markupdown_price = actual_price + (pair.markdown_percentage * actual_price) / 100;
      */
      //markupdown price for platform
      //plus in case of buy
      markupdown_price = actual_price
        .multipliedBy(pair.markup_percentage)
        .dividedBy(100);
      markupdown_price = actual_price.plus(markupdown_price);

      //recalculate for sell order qty
      if (request.order_type === BUY_SELL_TYPE.Sell) {
        /** formula
          markupdown_price = actual_price - (pair.markdown_percentage * actual_price) / 100;
        */
        //minus in case of sell
        markupdown_price = actual_price
          .multipliedBy(pair.markdown_percentage)
          .dividedBy(100);
        markupdown_price = actual_price.minus(markupdown_price);
      }
      console.log("----------------5.2-----------------");
      // changing qty according to user price
      let qty_from_price: any = request_price.dividedBy(markupdown_price);
      qty_from_price = convertTo8Decimals(qty_from_price);
      // changing the user request qty from order
      request.qty = qty_from_price;
      order_qty = new BigNumber(qty_from_price);

      //checking qty for market maker order limits after calculating qty from price
      if (marketMaker) {
        //get market makers from admin service
        try {
          console.log("----------------5.2.1-----------------");

          const marketMakerObj = await this.getMarketMaker(
            primary_currency_symbol
          );
          console.log("----------------5.2.2-----------------");

          console.table(marketMakerObj);
          market_maker_id = marketMakerObj.mmUserId;
          market_maker_client_id = marketMakerObj.mmClientId;
          console.log("----------------5.2.3-----------------");
          await this.checkMarketMakerLimits({
            userId: request.userId,
            currency_id: pair.currency_id,
            marketMakerObj,
            order_type: request.order_type.toUpperCase(),
            order_qty: convertTo8Decimals(order_qty),
            token: primary_currency_symbol,
          });
          console.log("----------------5.2.4-----------------");
        } catch (error) {
          this.rabbitmqService.orderResponse({
            status: "error",
            message: `${BUY_SELL_MSG.ERRORS.MARKET_MAKER_ERROR(
              primary_currency_symbol
            )} ${error.message}`,
            socketClientId,
          });
          return;
        }
      }
      console.log("----------------5.3-----------------");

      //order id before inserting the record to add in liqudity queue
      const idData: any = await this.orderRespository.sequelize.query(
        "SELECT UUID() as id;",
        { type: sequelize.QueryTypes.SELECT }
      );
      orderId = idData[0].id;
      //insert in orders table
      const orderObj: any = {
        id: sequelize.fn("UUID_TO_BIN", orderId),
        pair_id: sequelize.fn("UUID_TO_BIN", request.pair_id),
        primary_currency_id: sequelize.fn("UUID_TO_BIN", pair.currency_id),
        secondary_currency_id: sequelize.fn(
          "UUID_TO_BIN",
          pair.other_currency_id
        ),
        member_id: sequelize.fn("UUID_TO_BIN", request.userId),
        client_id: sequelize.fn("UUID_TO_BIN", request.clientId),
        email: request.email,
        country: request.country,
        qty: request.qty,
        actual_price: convertTo8Decimals(actual_price),
        order_type: request.order_type.toUpperCase(),
        order_status: ORDER_STATUS.Pending,
        is_swap,
        chain_id,
        created_at: new Date(),
        updated_at: new Date(),
        type: request.type,
      };
      // get market maker values
      if (marketMaker) {
        orderObj.is_market_maker = IS_MARKET_MAKER.YES;
        orderObj.market_maker_id = sequelize.fn("UUID_TO_BIN", market_maker_id);
        orderObj.market_maker_client_id = sequelize.fn(
          "UUID_TO_BIN",
          market_maker_client_id
        );
      }
      console.log("----------------5.4-----------------");

      //markup and markdown quantity
      //calculating markupdown_fee
      markupdown_fee = markupdown_price.multipliedBy(order_qty).dividedBy(100);
      // markupdown qty for the order buy
      // markupdown fee in qty
      markupdown_fee_in_qty = order_qty
        .multipliedBy(pair.markup_percentage)
        .dividedBy(100);
      // minus for buy
      markupdown_qty = order_qty.minus(markupdown_fee_in_qty);

      //recalculate for sell order qty
      if (request.order_type === BUY_SELL_TYPE.Sell) {
        //calculating markupdown_fee
        markupdown_fee = markupdown_price
          .multipliedBy(order_qty)
          .dividedBy(100);

        markupdown_fee_in_qty = order_qty
          .multipliedBy(pair.markdown_percentage)
          .dividedBy(100);
        //minus for sell also
        markupdown_qty = order_qty.minus(markupdown_fee_in_qty);
      }
      orderObj.markupdown_qty = convertTo8Decimals(markupdown_qty);
      orderObj.markupdown_price = convertTo8Decimals(markupdown_price);
      orderObj.markupdown_price_in_usd = convertTo8Decimals(
        markupdown_price.multipliedBy(rate)
      );
      orderObj.markupdown_fee = convertTo8Decimals(markupdown_fee);
      orderObj.markupdown_fee_in_qty = convertTo8Decimals(
        markupdown_fee_in_qty
      );
      orderObj.markupdown_fee_in_usd = convertTo8Decimals(
        markupdown_fee.multipliedBy(rate)
      );

      //calculating fees in price as well qty
      let fees: BigNumber = new BigNumber(0),
        fee_in_qty = new BigNumber(0), //for qty of USDT(crypto)
        minLimit = new BigNumber(pairsFee.order_limit),
        maxLimit = new BigNumber(pairsFee.maxorder_limit);
      console.log("----------------5.5-----------------");

      if (pairsFee.fee > 0) {
        switch (pairsFee.fee_type) {
          case FEE_TYPE.Percentage:
            fee_in_qty = order_qty.multipliedBy(pairsFee.fee).dividedBy(100);
            console.log(
              "fee_in_qty",
              order_qty.toNumber(),
              fee_in_qty.toNumber()
            );
            order_qty = order_qty.minus(fee_in_qty);
            actual_total_price = markupdown_price.multipliedBy(order_qty);
            fees = total_price.multipliedBy(pairsFee.fee).dividedBy(100);
            minLimit = minLimit.minus(
              minLimit.multipliedBy(pairsFee.fee).dividedBy(100)
            );
            maxLimit = maxLimit.minus(
              maxLimit.multipliedBy(pairsFee.fee).dividedBy(100)
            );
            break;
          case FEE_TYPE.Flat:
            {
              fees = new BigNumber(pairsFee.fee);
              const percentage =
                (pairsFee.fee / markupdown_price.toNumber()) * 100;
              fee_in_qty = order_qty.multipliedBy(percentage).dividedBy(100);
              order_qty = order_qty.minus(fee_in_qty);
              actual_total_price = markupdown_price.multipliedBy(order_qty);
              minLimit = minLimit.minus(pairsFee.fee);
              maxLimit = maxLimit.minus(pairsFee.fee);
            }
            break;
        }
      }

      console.log("----------------5.6-----------------");
      order_qty = new BigNumber(convertTo8Decimals(order_qty));
      // check for exchange pair only
      if (!marketMaker) {
        const orderLimitResp =
          await this.rabbitmqService.getPairOrderLimitQueue(exchangeSymbol);
        if (orderLimitResp.error) {
          throw new Error(orderLimitResp.message);
        }
        //not for market maker
        console.table({ order_qty: order_qty.toNumber() });
        console.table(orderLimitResp.data);
        let { minimumOrderSize, maximumOrderSize } = orderLimitResp.data;
        minimumOrderSize = new BigNumber(minimumOrderSize);
        maximumOrderSize = new BigNumber(maximumOrderSize);

        if (order_qty.isLessThan(minimumOrderSize)) {
          this.rabbitmqService.orderResponse({
            status: "error",
            message: BUY_SELL_MSG.ERRORS.INCREASE_QTY_ERROR,
            socketClientId,
          });
          return;
        }
        if (order_qty.isGreaterThan(maximumOrderSize)) {
          this.rabbitmqService.orderResponse({
            status: "error",
            message: BUY_SELL_MSG.ERRORS.DECREASE_QTY_ERROR,
            socketClientId,
          });
          return;
        }
      }
      //buy sell fee
      orderObj.fee = convertTo8Decimals(fees);
      orderObj.fee_in_qty = convertTo8Decimals(fee_in_qty);
      orderObj.fee_in_usd = convertTo8Decimals(fees.multipliedBy(rate));
      //reduce total price for sell
      if (request.order_type === BUY_SELL_TYPE.Sell) {
        total_price = total_price.minus(fees);
      }

      console.table({
        pair_fee: pairsFee.fee,
        markupdown_price: convertTo8Decimals(markupdown_price),
        total_price: convertTo8Decimals(total_price),
        actual_total_price: convertTo8Decimals(actual_total_price),
        orderLimit: pairsFee.order_limit,
      });
      console.log("----------------6-----------------");

      // amount for grpc in buy case
      amount = convertTo8Decimals(total_price);
      console.log(request.clientId, coin, coinSymbol);

      //check user balance for buy/sell
      //lock wallet balance with grpc
      let resultBalance;
      try {
        resultBalance = await this.walletGatewayService.getBalance({
          clientId: request.clientId,
          coin: coin.toLowerCase(),
          coinSymbol: coinSymbol.toLowerCase(),
        });
        console.log("----------------7-----------------");

        //error check
        if (resultBalance.error) {
          console.log("----------------7.1-----------------");

          this.rabbitmqService.orderResponse({
            status: "error",
            message: resultBalance.message,
            socketClientId,
          });
          return;
        }
      } catch (error) {
        console.log("----------------7.2-----------------");

        this.rabbitmqService.orderResponse({
          status: "error",
          message: error.message,
          socketClientId,
        });
        return;
      }
      console.log("----------------7.3-----------------");
      //check user wallet balance from wallet service
      // convert balance to decimal value
      const balance = new BigNumber(resultBalance.data.balance).dividedBy(
        10 ** DECIMALS
      );
      console.table({
        balance: balance.toNumber(),
        amount,
        order_type: request.order_type,
      });

      //get user wallet balance for buy
      //buy
      //secondary token balance
      if (
        request.order_type === BUY_SELL_TYPE.Buy &&
        amount > balance.toNumber()
      ) {
        this.rabbitmqService.orderResponse({
          status: "error",
          message: BUY_SELL_MSG.ERRORS.INSUFFICIENT_BUY_BALANCE,
          socketClientId,
        });
        return;
      }
      //sell
      //pimary token balance
      if (
        request.order_type === BUY_SELL_TYPE.Sell &&
        request.qty > balance.toNumber()
      ) {
        this.rabbitmqService.orderResponse({
          status: "error",
          message: BUY_SELL_MSG.ERRORS.INSUFFICIENT_SELL_BALANCE,
          socketClientId,
        });
        return;
      }

      /**
       * convert total price to usd or ngn(default currency)
       */
      const total_price_usd = convertTo8Decimals(
        total_price.multipliedBy(rate)
      ); // for NGN

      console.log("--------------------7.4-----------------------");
      console.log(pairsFee.order_limit);
      //order limit for buysell order in usd without fees
      if (minLimit.isGreaterThan(total_price)) {
        //in NGN
        this.rabbitmqService.orderResponse({
          status: "error",
          message: BUY_SELL_MSG.ERRORS.ORDER_LIMITS,
          socketClientId,
        });
        return;
      }
      console.log("--------------------7.5-----------------------");
      //max order limit for buysell order in usd without fees
      if (maxLimit.isLessThan(total_price)) {
        //in NGN
        this.rabbitmqService.orderResponse({
          status: "error",
          message: BUY_SELL_MSG.ERRORS.MAX_ORDER_LIMITS,
          socketClientId,
        });
        return;
      }
      orderObj.actual_total_price = convertTo8Decimals(actual_total_price);
      orderObj.total_price = convertTo8Decimals(total_price);
      orderObj.total_price_usd = total_price_usd;
      //check again for total usd value before order with buy/sell limit
      // kyc status buy sell limit
      // --start here--
      try {
        await this.checkUserKycStatus({
          userId: request.userId,
          kycStatus: request.kycStatus,
          orderValue: total_price_usd,
        });
      } catch (error) {
        this.rabbitmqService.orderResponse({
          status: "error",
          message: error.message,
          socketClientId,
        });
        return;
      }
      // kyc status buy sell limit
      // --end here--
      //calculate order_qty for market order
      orderObj.order_qty = convertTo8Decimals(order_qty);

      console.log("----------------8-----------------");

      //fetch exchange account or liqudity on exchange account
      try {
        if (marketMaker) {
          //check market maker wallet balance
          await this.marketMakerBalance({
            primary_currency_symbol,
            secondary_currency_symbol,
            order_qty,
            actual_price,
            order_type: request.order_type,
            market_maker_client_id,
          });
        } else {
          await this.checkExchangeAccountLiquidity({
            primary_currency_symbol,
            secondary_currency_symbol,
            order_qty,
            actual_price: actual_price_org,
            order_type: request.order_type,
          });
        }
      } catch (error) {
        this.rabbitmqService.orderResponse({
          status: "error",
          message: error.message,
          socketClientId,
        });
        return;
      }
      console.log("----------------9-----------------");
      let buy_sell_amount = amount; //for buy to lock
      let market_maker_buy_sell_amount = convertTo8Decimals(order_qty);
      let market_maker_coin = primary_currency_symbol;

      if (request.order_type === BUY_SELL_TYPE.Sell) {
        //for sell to lock
        buy_sell_amount = request.qty;
        market_maker_buy_sell_amount = amount;
        market_maker_coin = secondary_currency_symbol;
      }
      //lock wallet balance with grpc
      const result = await this.walletGatewayService.updateAccountBalance({
        clientId: request.clientId,
        coin: coin.toLowerCase(),
        coinSymbol: coinSymbol.toLocaleLowerCase(),
        typeId: orderId,
        amount: buy_sell_amount,
        type: wallet_gateway_type,
        status: "PENDING",
        fee: 0,
      });
      console.log("grpc lock the balance ", result);

      //error check
      if (result.error) {
        this.rabbitmqService.orderResponse({
          status: "error",
          message: result.message,
          socketClientId,
        });
        return;
      }
      console.log("----------------10-----------------");
      console.log(orderObj);

      // lock market maker token request
      if (marketMaker) {
        //lock wallet balance with grpc of market maker
        const result = await this.walletGatewayService.updateAccountBalance({
          clientId: market_maker_client_id,
          coin: market_maker_coin.toLowerCase(),
          coinSymbol: market_maker_coin.toLocaleLowerCase(),
          typeId: orderId,
          amount: market_maker_buy_sell_amount,
          type: wallet_gateway_type,
          status: "PENDING",
          fee: 0,
        });
        console.log("grpc lock the balance ", result);

        //error check
        if (result.error) {
          // unlock wallet balance on error with grpc for user
          const result = await this.walletGatewayService.updateAccountBalance({
            clientId: request.clientId,
            coin: coin.toLowerCase(),
            coinSymbol: coinSymbol.toLocaleLowerCase(),
            typeId: orderId,
            amount: buy_sell_amount,
            type: wallet_gateway_type,
            status: "FAILED",
            fee: 0,
          });
          this.rabbitmqService.orderResponse({
            status: "error",
            message: result.message,
            socketClientId,
          });
          return;
        }
      }

      console.log("----------------10.1----------------");
      console.log("-----order before insert-----");

      const res = await this.orderRespository.create<Orders>(orderObj);
      console.log(res, "res");

      const orderInserted: any = {
        socketClientId,
        orderId,
        email: request.email,
        userId: request.userId,
        userStatus: request.status,
        kycStatus: request.kycStatus,
        is_swap,
        binanceSymbol: exchangeSymbol,
        primary_currency_symbol,
        secondary_currency_symbol,
        type: request.type,
        order_type: request.order_type,
        order_qty: orderObj.order_qty,
        coin,
        coinSymbol,
        amount,
        marketMaker,
      };

      console.table(orderInserted);
      console.log("----------------11-----------------");
      if (marketMaker) {
        //market maker order
        console.log("----------------12-----------------");
        //send status for frontend with Market Maker
        orderInserted.exchangeStatus = EXCHANGE_ORDER_STATUS;
        this.rabbitmqService.sendToMarketMakerOrderQueue(orderInserted);
      } else {
        console.log("----------------13-----------------");

        //add to liquidity queue
        this.rabbitmqService.sendToLiqudity(orderInserted);
      }
      this.orderRespository.update(
        {
          order_status: ORDER_STATUS.Liquidity_Pushed,
        },
        {
          where: {
            id: { [sequelize.Op.eq]: sequelize.fn("UUID_TO_BIN", orderId) },
          },
        }
      );
      console.log("----------------14-----------------");
      //send email queue or to notifications service
    } catch (error) {
      console.log(error, "in buy sell request");
      console.log("----------------15-----------------");
      this.rabbitmqService.orderResponse({
        status: "error",
        message: error.message,
        socketClientId,
      });
      return;
    }
  }
  /**
   * update Status of the order from liquidity service
   * @param data
   */
  async updateOrderStatus(data: any): Promise<void> {
    const { orderId, exchangeStatus, coin, coinSymbol, socketClientId } =
      data.data;
    //changes for bitfinex open status
    if (exchangeStatus === "PENDING") {
      this.rabbitmqService.orderResponse(data);
      return;
    }
    try {
      const row = await this.orderRespository.findOne<Orders>({
        attributes: [
          "id",
          [
            sequelize.fn("BIN_TO_UUID", sequelize.col("member_id")),
            "member_id",
          ],
          [
            sequelize.fn("BIN_TO_UUID", sequelize.col("client_id")),
            "client_id",
          ],
          [
            sequelize.fn("BIN_TO_UUID", sequelize.col("market_maker_id")),
            "market_maker_id",
          ],
          [
            sequelize.fn(
              "BIN_TO_UUID",
              sequelize.col("market_maker_client_id")
            ),
            "market_maker_client_id",
          ],
          `order_type`,
          `pair_id`,
          `primary_currency_id`,
          `secondary_currency_id`,
          `email`,
          `country`,
          `order_status`,
          `retries`,
          `reason`,
          `is_processed`,
          `created_at`,
          `updated_at`,
          `type`,
          `is_swap`,
          `is_market_maker`,
          `chain_id`,
          `order_qty`,
          `qty`,
          `markupdown_qty`,
          `fee_in_qty`,
          `total_price`,
          `actual_total_price`,
          `actual_price`,
          `markupdown_price`,
          `fee`,
          `markupdown_fee`,
          `markupdown_fee_in_qty`,
          `per_price_usd`,
          `qty_in_usd`,
          `fee_in_usd`,
          `markupdown_price_in_usd`,
          `markupdown_fee_in_usd`,
          `total_price_usd`,
        ],
        where: { id: sequelize.fn("UUID_TO_BIN", orderId) },
      });
      if (row) {
        const primary_currency = await this.currencyMaster.findOne({
          attributes: ["currency_symbol", "is_fiat_currency"],
          where: { id: row.primary_currency_id },
        });
        const secondary_currency = await this.currencyMaster.findOne({
          attributes: ["currency_symbol", "is_fiat_currency"],
          where: { id: row.secondary_currency_id },
        });
        let amount = 0,
          amount_received = 0;
        let coin1 = "",
          coinSymbol1 = "",
          coin2 = "fiat",
          coinSymbol2 = "",
          wallet_gateway_type1 = "buy-out",
          wallet_gateway_type2 = "buy-in";
        //buy for relase lock or unlock
        if (row.order_type.toLowerCase() === BUY_SELL_TYPE.Buy) {
          //buy
          amount = row.total_price;
          amount_received = row.order_qty;
          //calculating symbols
          coin1 = primary_currency.currency_symbol;
          coinSymbol1 = primary_currency.currency_symbol;
          coin2 = secondary_currency.currency_symbol;
          coinSymbol2 = secondary_currency.currency_symbol;
          //check for fiat
          if (secondary_currency.is_fiat_currency) {
            coin2 = "fiat";
            coinSymbol2 = secondary_currency.currency_symbol;
          }
        } else {
          //sell
          coin2 = primary_currency.currency_symbol;
          coinSymbol2 = primary_currency.currency_symbol;
          coin1 = secondary_currency.currency_symbol;
          coinSymbol1 = secondary_currency.currency_symbol;
          //check for fiat
          if (secondary_currency.is_fiat_currency) {
            coin1 = "fiat";
            coinSymbol1 = secondary_currency.currency_symbol;
          }
          amount = row.qty;
          amount_received = row.total_price;
          wallet_gateway_type1 = "sell-out";
          wallet_gateway_type2 = "sell-in";
        }
        //for swapping
        if (row.is_swap) {
          wallet_gateway_type1 = "swap-out";
          wallet_gateway_type2 = "swap-in";
        }
        const clientId = row.client_id;
        //success from liquidity service
        if (data.status === "ok" && exchangeStatus === "EXECUTED") {
          row.order_status = ORDER_STATUS.Liquidity_Success;
          row.updatedAt = new Date();
          row.reason = `Bitfinex Status: ${exchangeStatus}`;
          await row.save();
          //wallet 1 release lock and payment pending
          let result = await this.walletGatewayService.updateAccountBalance({
            clientId,
            coin: coin2.toLowerCase(),
            coinSymbol: coinSymbol2.toLowerCase(),
            typeId: orderId,
            amount,
            type: wallet_gateway_type1,
            status: "COMPLETED",
            fee: 0,
          });
          console.log(
            "grpc1  unlock",
            row.order_type,
            ORDER_STATUS.Payment_Pending,
            result
          );
          if (result.status === HttpStatus.OK) {
            row.order_status = ORDER_STATUS.Payment_Pending;
            row.updatedAt = new Date();
            await row.save();
          } else {
            throw new Error(result.message);
          }
          //wallet 2 add tokens
          result = await this.walletGatewayService.updateAccountBalance({
            clientId,
            coin: coin1.toLowerCase(),
            coinSymbol: coinSymbol1.toLowerCase(),
            typeId: orderId,
            amount: amount_received,
            type: wallet_gateway_type2,
            status: "COMPLETED",
            fee: 0,
          });
          console.log(
            "grpc2  unlock",
            row.order_type,
            ORDER_STATUS.Completed,
            result
          );
          if (result.status === HttpStatus.OK) {
            row.order_status = ORDER_STATUS.Completed;
            row.updatedAt = new Date();
            await row.save();
            //sending email
            this.rabbitmqService.sendTransactionEmail({
              clientId,
              email: row.email,
              type: row.order_type.toLowerCase(),
              actionType: "success",
              amount:
                row.order_type.toLowerCase() === BUY_SELL_TYPE.Buy
                  ? row.order_qty
                  : row?.qty,
              pair: `${primary_currency.currency_symbol}-${secondary_currency.currency_symbol}`,
              primary_currency: primary_currency.currency_symbol,
              secondary_currency: secondary_currency.currency_symbol,
            });
          } else {
            throw new Error(result.message);
          }
        }
        //error from liquidity service
        if (data.status === "error") {
          row.reason = data.message;
          row.order_status = ORDER_STATUS.Liquidity_Fail;
          row.updatedAt = new Date();
          await row.save();
          // unlock wallet balance on error with grpc
          const result = await this.walletGatewayService.updateAccountBalance({
            clientId,
            coin,
            coinSymbol,
            typeId: orderId,
            amount,
            type: wallet_gateway_type1,
            status: "FAILED",
            fee: 0,
          });
          console.log("grpc3  unlock", ORDER_STATUS.Failed, result);
          if (result.status === HttpStatus.OK) {
            row.order_status = ORDER_STATUS.Failed;
            row.updatedAt = new Date();
            await row.save();
            //sending email
            this.rabbitmqService.sendTransactionEmail({
              clientId,
              email: row.email,
              type: row.order_type.toLowerCase(),
              actionType: "failed",
              amount: row.qty,
              pair: `${primary_currency.currency_symbol}-${secondary_currency.currency_symbol}`,
              primary_currency: primary_currency.currency_symbol,
              secondary_currency: secondary_currency.currency_symbol,
            });
          } else {
            throw new Error(result.message);
          }
        }
        console.log("update order--> ", orderId);
      }
    } catch (error) {
      this.rabbitmqService.orderResponse({
        status: "error",
        message: error.message,
        socketClientId,
      });
      return;
    }

    this.rabbitmqService.orderResponse(data);
  }
  /**
   * add admin balance in market maker table w.r.t. to ngn
   * @param data
   */
  async addAdminBalanceMarketMaker({
    orderId,
    market_maker_client_id,
    primary_currency,
    secondary_currency,
    actual_price,
    is_swap,
    order_type,
  }: any): Promise<void> {
    let balance = new BigNumber(0),
      balance_in_usd = new BigNumber(0);
    try {
      console.log("--------------16-------------------------");
      const resultBalance = await this.walletGatewayService.getBalance({
        clientId: market_maker_client_id,
        coin: primary_currency.toLowerCase(),
        coinSymbol: primary_currency.toLowerCase(),
      });

      //error check
      if (resultBalance.error) {
        throw new Error(resultBalance.message);
      }
      //check user wallet balance from wallet service
      // convert balance to decimal value
      balance = new BigNumber(resultBalance.data.balance).dividedBy(
        10 ** DECIMALS
      );
      console.table({ balance: balance.toNumber() });
    } catch (error) {
      console.log("--------------17------------------------");
      console.log(error);
    }
    if (is_swap) {
      console.log("--------------18------------------------");

      //if pair is swap like USDT-NGN
      const currency_pair = `${secondary_currency}-${DEFAULT_CURRENCY}`;
      try {
        const defaultCurrencyRate = await this.getAdminPairConversionPrice(
          currency_pair,
          order_type
        );
        console.table({ currency_pair, defaultCurrencyRate });
        balance_in_usd = balance
          .multipliedBy(actual_price)
          .multipliedBy(defaultCurrencyRate);
      } catch (error) {
        console.log(error);
        console.log("----------------19-----------------------");
      }
    } else if (secondary_currency === DEFAULT_CURRENCY) {
      // if pair is directly with ngn(default currency)
      balance_in_usd = balance.multipliedBy(actual_price);
    } else {
      // other fiat currency
    }

    const obj = {
      id: sequelize.fn("UUID_TO_BIN", sequelize.fn("UUID")),
      order_id: sequelize.fn("UUID_TO_BIN", orderId),
      balance: balance.toNumber(),
      balance_in_usd: balance_in_usd.toNumber(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    await this.marketMakerWalletsRespository.create(obj);
    console.log("--------------21------------------------");
  }
  /**
   * update status of market maker order status
   * @param data
   */
  async updateMarketMakerOrderStatus(data: any): Promise<void> {
    const { orderId, socketClientId } = data;

    //sql transactions
    try {
      const row = await this.orderRespository.findOne<Orders>({
        attributes: [
          "id",
          [
            sequelize.fn("BIN_TO_UUID", sequelize.col("member_id")),
            "member_id",
          ],
          [
            sequelize.fn("BIN_TO_UUID", sequelize.col("client_id")),
            "client_id",
          ],
          [
            sequelize.fn("BIN_TO_UUID", sequelize.col("market_maker_id")),
            "market_maker_id",
          ],
          [
            sequelize.fn(
              "BIN_TO_UUID",
              sequelize.col("market_maker_client_id")
            ),
            "market_maker_client_id",
          ],
          `order_type`,
          `pair_id`,
          `primary_currency_id`,
          `secondary_currency_id`,
          `email`,
          `country`,
          `order_status`,
          `retries`,
          `reason`,
          `is_processed`,
          `created_at`,
          `updated_at`,
          `type`,
          `is_swap`,
          `is_market_maker`,
          `chain_id`,
          `order_qty`,
          `qty`,
          `markupdown_qty`,
          `fee_in_qty`,
          `total_price`,
          `actual_total_price`,
          `actual_price`,
          `markupdown_price`,
          `fee`,
          `markupdown_fee`,
          `markupdown_fee_in_qty`,
          `per_price_usd`,
          `qty_in_usd`,
          `fee_in_usd`,
          `markupdown_price_in_usd`,
          `markupdown_fee_in_usd`,
          `total_price_usd`,
        ],
        where: { id: sequelize.fn("UUID_TO_BIN", orderId) },
      });
      if (row) {
        const primary_currency = await this.currencyMaster.findOne({
          attributes: ["currency_symbol", "is_fiat_currency"],
          where: { id: row.primary_currency_id },
        });
        const secondary_currency = await this.currencyMaster.findOne({
          attributes: ["currency_symbol", "is_fiat_currency"],
          where: { id: row.secondary_currency_id },
        });
        let amount = 0,
          amount_received = 0,
          //market maker amounts
          maker_maker_amount_send = 0,
          maker_maker_amount_received = 0,
          coin1 = "",
          coinSymbol1 = "",
          coin2 = "fiat",
          coinSymbol2 = "",
          wallet_gateway_type1 = "buy-out",
          wallet_gateway_type2 = "buy-in",
          //for market maker types
          wallet_gateway_type3 = "buy-out",
          wallet_gateway_type4 = "buy-in";
        const { is_swap, actual_price, order_type } = row;
        //buy for relase lock or unlock
        if (order_type.toLowerCase() === BUY_SELL_TYPE.Buy) {
          //buy
          amount = row.total_price;
          amount_received = row.order_qty;
          maker_maker_amount_send = row.order_qty;
          maker_maker_amount_received = row.total_price;
          //calculating symbols
          coin1 = primary_currency.currency_symbol;
          coinSymbol1 = primary_currency.currency_symbol;
          coin2 = secondary_currency.currency_symbol;
          coinSymbol2 = secondary_currency.currency_symbol;

          //check for fiat
          if (secondary_currency.is_fiat_currency) {
            coin2 = "fiat";
            coinSymbol2 = secondary_currency.currency_symbol;
          }
          //calculating symbols for market
        } else {
          //sell
          amount = row.qty;
          amount_received = row.total_price;
          maker_maker_amount_send = row.total_price;
          maker_maker_amount_received = row.qty;
          coin2 = primary_currency.currency_symbol;
          coinSymbol2 = primary_currency.currency_symbol;
          coin1 = secondary_currency.currency_symbol;
          coinSymbol1 = secondary_currency.currency_symbol;
          //check for fiat
          if (secondary_currency.is_fiat_currency) {
            coin1 = "fiat";
            coinSymbol1 = secondary_currency.currency_symbol;
          }
          wallet_gateway_type1 = "sell-out";
          wallet_gateway_type2 = "sell-in";
          wallet_gateway_type3 = "sell-out";
          wallet_gateway_type4 = "sell-in";
        }
        //for swapping
        if (row.is_swap) {
          wallet_gateway_type1 = "swap-out";
          wallet_gateway_type2 = "swap-in";
          wallet_gateway_type3 = "swap-out";
          wallet_gateway_type4 = "swap-in";
        }
        const clientId = row.client_id;
        const market_maker_client_id = row.market_maker_client_id;
        //success from liquidity service
        row.order_status = ORDER_STATUS.Liquidity_Success;
        row.updatedAt = new Date();
        row.reason = `Market Maker Status: Success`;
        await row.save();
        //wallet 1 user release lock and payment pending
        let result = await this.walletGatewayService.updateAccountBalance({
          clientId,
          coin: coin2.toLowerCase(),
          coinSymbol: coinSymbol2.toLowerCase(),
          typeId: orderId,
          amount,
          type: wallet_gateway_type1,
          status: "COMPLETED",
          fee: 0,
        });
        console.log("grpc1  unlock1", row.order_type, result);
        if (result.status === HttpStatus.OK) {
          row.order_status = ORDER_STATUS.Market_Maker_Liquidity_Success;
          row.updatedAt = new Date();
          await row.save();
        } else {
          throw new Error(result.message);
        }
        //wallet 1 market maker release lock and payment pending
        result = await this.walletGatewayService.updateAccountBalance({
          clientId: market_maker_client_id,
          coin: coin1.toLowerCase(),
          coinSymbol: coinSymbol1.toLowerCase(),
          typeId: orderId,
          amount: maker_maker_amount_send,
          type: wallet_gateway_type3,
          status: "COMPLETED",
          fee: 0,
        });
        console.log(
          "grpc2  unlock2",
          row.order_type,
          ORDER_STATUS.Payment_Pending,
          result
        );
        if (result.status === HttpStatus.OK) {
          row.order_status = ORDER_STATUS.Payment_Pending;
          row.updatedAt = new Date();
          await row.save();
        } else {
          throw new Error(result.message);
        }
        //wallet 2 user add tokens
        result = await this.walletGatewayService.updateAccountBalance({
          clientId,
          coin: coin1.toLowerCase(),
          coinSymbol: coinSymbol1.toLowerCase(),
          typeId: orderId,
          amount: amount_received,
          type: wallet_gateway_type2,
          status: "COMPLETED",
          fee: 0,
        });
        console.log(
          "grpc2  update1",
          row.order_type,
          ORDER_STATUS.Market_Maker_Payment_Pending,
          result
        );
        if (result.status === HttpStatus.OK) {
          row.order_status = ORDER_STATUS.Market_Maker_Payment_Pending;
          row.updatedAt = new Date();
          await row.save();
        } else {
          throw new Error(result.message);
        }
        //wallet 2 market maker add tokens
        result = await this.walletGatewayService.updateAccountBalance({
          clientId: market_maker_client_id,
          coin: coin2.toLowerCase(),
          coinSymbol: coinSymbol2.toLowerCase(),
          typeId: orderId,
          amount: maker_maker_amount_received,
          type: wallet_gateway_type4,
          status: "COMPLETED",
          fee: 0,
        });
        console.log(
          "grpc2  update2",
          row.order_type,
          ORDER_STATUS.Completed,
          result
        );
        if (result.status === HttpStatus.OK) {
          row.order_status = ORDER_STATUS.Completed;
          row.updatedAt = new Date();
          await row.save();
          //sending email
          this.rabbitmqService.sendTransactionEmail({
            clientId,
            email: row.email,
            type: row.order_type.toLowerCase(),
            actionType: "success",
            amount:
              row.order_type.toLowerCase() === BUY_SELL_TYPE.Buy
                ? row.order_qty
                : row?.qty,
            pair: `${primary_currency.currency_symbol}-${secondary_currency.currency_symbol}`,
            primary_currency: primary_currency.currency_symbol,
            secondary_currency: secondary_currency.currency_symbol,
          });
        } else {
          throw new Error(result.message);
        }
        console.log("update order--> ", orderId);
        //add data to market maker balance
        this.addAdminBalanceMarketMaker({
          orderId,
          market_maker_client_id,
          primary_currency: primary_currency.currency_symbol,
          secondary_currency: secondary_currency.currency_symbol,
          actual_price,
          is_swap,
          order_type,
        });
      }
    } catch (error) {
      this.rabbitmqService.orderResponse({
        status: "error",
        message: error.message,
        socketClientId,
      });
      return;
    }
    const ob = {
      status: "ok",
      message: RES_MSG.ORDERS.SUCCESS,
      data: data,
    };

    this.rabbitmqService.orderResponse(ob);
  }
}
