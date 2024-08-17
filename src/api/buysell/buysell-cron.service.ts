import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Sequelize } from "sequelize-typescript";
import { Orders } from "src/common/base-model/entities/orders.entity";
import { RabbitMqService } from "src/common/rabbitMq/rabbit-mq/rabbit-mq.service";
import { WalletGatewayService } from "./wallet-gateway.service";
import {
  BUY_SELL_TYPE,
  IS_MARKET_MAKER,
  IS_YES_NO_ENUM,
  ORDER_STATUS,
} from "src/constants/enums";
import sequelize from "sequelize";
import { CurrencyMaster } from "src/common/base-model/entities/currency_master.entity";
import { RETRY_MAX_COUNTS, RETRY_MAX_COUNTS_MARKET_MAKER } from "src/constants";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class BuySellCronService {
  private logger = new Logger(BuySellCronService.name);
  constructor(
    @Inject("Orders") private orderRespository: typeof Orders,
    @Inject("CURRENCY_MASTER") private currencyMaster: typeof CurrencyMaster,
    // private readonly redisService: MyService,
    private readonly rabbitmqService: RabbitMqService,
    private readonly walletGatewayService: WalletGatewayService,
    private readonly configService: ConfigService
  ) {}
  /**
   * cron for last 5 minutes orders after buy sell service
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleLastFiveMintuesOrdersCron() {
    if (this.configService.get<string>("ENABLE_CRON") === IS_YES_NO_ENUM.NO) {
      return;
    }
    this.getOrders(2, 5);
    this.getOrdersMarketMaker(2, 5);
  }
  /**
   * cron for orders in buy sell liquidity pushed status
   * every 30 minute for market maker
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleLastThirtyMintuesOrdersCron() {
    if (this.configService.get<string>("ENABLE_CRON") === IS_YES_NO_ENUM.NO) {
      return;
    }
    this.getOrders(2, 30, true);
    this.getOrdersMarketMaker(2, 30, true);
  }
  /**
   * cron for orders in buy sell liquidity pushed status
   * every 24 hours
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  // @Cron(CronExpression.EVERY_10_SECONDS)
  async handleLast24HoursOrdersCron() {
    if (this.configService.get<string>("ENABLE_CRON") === IS_YES_NO_ENUM.NO) {
      return;
    }
    //get pending orders
    this.getPending24Orders(2, 1440);
  }
  /**
   * get orders from db
   * for last 5 minute or 30 minutes
   */
  async getOrders(limit: number, minutes: number, pending_check = false) {
    const query = {
      is_market_maker: IS_MARKET_MAKER.NO,
      order_status: {
        [sequelize.Op.in]: [
          ORDER_STATUS.Payment_Pending,
          ORDER_STATUS.Liquidity_Success,
          ORDER_STATUS.Liquidity_Fail,
        ],
      },
      retries: {
        [sequelize.Op.lt]: RETRY_MAX_COUNTS,
      },
      created_at: {
        [sequelize.Op.lte]: Sequelize.literal(
          `DATE_SUB(NOW(),INTERVAL ${minutes} DAY_MINUTE)`
        ),
      },
    };
    //checking for pending or liquditidy pushed orders
    if (pending_check) {
      query.order_status = {
        [sequelize.Op.in]: [ORDER_STATUS.Liquidity_Pushed],
      };
    }
    const orders: any = await this.orderRespository.findAll({
      attributes: [
        [sequelize.fn("BIN_TO_UUID", sequelize.col("Orders.id")), "orderId"],
        [sequelize.fn("BIN_TO_UUID", sequelize.col("member_id")), "member_id"],
        [sequelize.fn("BIN_TO_UUID", sequelize.col("client_id")), "client_id"],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("market_maker_client_id")),
          "market_maker_client_id",
        ],
        "primary_currency_id",
        "secondary_currency_id",
        `order_type`,
        `email`,
        `country`,
        `market_maker_id`,
        `order_status`,
        `retries`,
        `reason`,
        `is_processed`,
        `created_at`,
        `updated_at`,
        `type`,
        `is_swap`,
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
      where: query,
      limit,
    });
    for (const order of orders) {
      try {
        const res = await this.updateOrderStatus(order);
        this.logger.warn("after order id: ", order.dataValues.orderId, res);
      } catch (error) {
        this.logger.error(error);
      }
    }
  }
  /**
   * get orders market maker from db
   * for last 5 minute or 30 minutes
   */
  async getOrdersMarketMaker(
    limit: number,
    minutes: number,
    pending_check = false
  ) {
    const query = {
      is_market_maker: IS_MARKET_MAKER.YES,
      order_status: {
        [sequelize.Op.in]: [
          ORDER_STATUS.Liquidity_Success,
          ORDER_STATUS.Market_Maker_Liquidity_Success,
          ORDER_STATUS.Payment_Pending,
          ORDER_STATUS.Market_Maker_Payment_Pending,
          ORDER_STATUS.Liquidity_Fail,
        ],
      },
      retries: {
        [sequelize.Op.lt]: RETRY_MAX_COUNTS_MARKET_MAKER,
      },
      created_at: {
        [sequelize.Op.lte]: Sequelize.literal(
          `DATE_SUB(NOW(),INTERVAL ${minutes} DAY_MINUTE)`
        ),
      },
    };
    //checking for pending or liquditidy pushed orders
    if (pending_check) {
      query.order_status = {
        [sequelize.Op.in]: [ORDER_STATUS.Liquidity_Pushed],
      };
    }
    const orders: any = await this.orderRespository.findAll({
      attributes: [
        [sequelize.fn("BIN_TO_UUID", sequelize.col("Orders.id")), "orderId"],
        [sequelize.fn("BIN_TO_UUID", sequelize.col("member_id")), "member_id"],
        [sequelize.fn("BIN_TO_UUID", sequelize.col("client_id")), "client_id"],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("market_maker_client_id")),
          "market_maker_client_id",
        ],
        "primary_currency_id",
        "secondary_currency_id",
        `order_type`,
        `email`,
        `country`,
        `market_maker_id`,
        `order_status`,
        `retries`,
        `reason`,
        `is_processed`,
        `created_at`,
        `updated_at`,
        `type`,
        `is_swap`,
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
      where: query,
      limit,
    });
    for (const order of orders) {
      try {
        const res = await this.updateOrderMarketMakerStatus(order);
        this.logger.warn("after order id: ", order.dataValues.orderId, res);
      } catch (error) {
        this.logger.error(error);
      }
    }
  }
  /**
   * get pending orders to liquidity from db
   * for last 24 hours
   */
  async getPending24Orders(limit: number, minutes: number) {
    const orders: any = await this.orderRespository.findAll({
      where: {
        order_status: {
          [sequelize.Op.in]: [
            ORDER_STATUS.Pending,
            ORDER_STATUS.Liquidity_Pushed,
          ],
        },
        created_at: {
          [sequelize.Op.lte]: Sequelize.literal(
            `DATE_SUB(NOW(),INTERVAL ${minutes} DAY_MINUTE)`
          ),
        },
      },
      limit,
    });
    for (const order of orders) {
      order.order_status = ORDER_STATUS.Liquidity_Fail;
      order.reason = "Buy Sell: Revert pending order after 24 hours.";
      order.retries = 0;
      order.save();
    }
  }
  /**
   * update query for order status
   * @param update
   * @param id
   */
  async updateOrder(update: any, id: string): Promise<void> {
    update.updatedAt = new Date();
    await this.orderRespository.update(update, {
      where: {
        id: { [sequelize.Op.eq]: sequelize.fn("UUID_TO_BIN", id) },
      },
    });
  }
  /**
   * update Status of the order from liquidity service
   * @param data
   */
  async updateOrderStatus(order: any): Promise<boolean> {
    const {
      dataValues: { orderId },
      client_id,
      is_swap,
      primary_currency_id,
      secondary_currency_id,
      order_type,
      total_price,
      qty,
      order_qty,
      order_status,
      retries,
      email,
    } = order;
    //sql transactions
    try {
      const primary_currency = await this.currencyMaster.findOne({
        attributes: ["currency_symbol", "is_fiat_currency"],
        where: { id: primary_currency_id },
      });
      const secondary_currency = await this.currencyMaster.findOne({
        attributes: ["currency_symbol", "is_fiat_currency"],
        where: { id: secondary_currency_id },
      });
      let amount = 0,
        amount_received = 0;
      //for error from liquidity service
      let coin = "fiat",
        coinSymbol = "";
      let coin1 = "",
        coinSymbol1 = "",
        coin2 = "fiat",
        coinSymbol2 = "",
        wallet_gateway_type1 = "buy-out",
        wallet_gateway_type2 = "buy-in";
      //buy for relase lock or unlock
      if (order_type.toLowerCase() === BUY_SELL_TYPE.Buy) {
        //buy
        amount = total_price;
        amount_received = order_qty;
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
        //for error request
        coinSymbol = secondary_currency.currency_symbol;
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
        amount = qty;
        amount_received = total_price;
        wallet_gateway_type1 = "sell-out";
        wallet_gateway_type2 = "sell-in";
        //for error request
        coin = primary_currency.currency_symbol;
        coinSymbol = primary_currency.currency_symbol;
      }

      //for swapping
      if (is_swap) {
        wallet_gateway_type1 = "swap-out";
        wallet_gateway_type2 = "swap-in";
        //for error request
        if (order_type.toLowerCase() === BUY_SELL_TYPE.Buy) {
          coin = secondary_currency.currency_symbol;
        }
      }
      const clientId = client_id;
      //success from liquidity service
      switch (order_status) {
        case ORDER_STATUS.Liquidity_Pushed:
          {
            // updating the retries count
            await this.updateOrder(
              {
                retries: retries + 1,
              },
              orderId
            );
            const resData =
              await this.rabbitmqService.getOrderDetailsFromLiquidity({
                order_id: orderId,
              });
            if (resData.status === HttpStatus.OK) {
              if (resData.data) {
                const order = resData.data;
                switch (order.status) {
                  //exchange status
                  case "EXECUTED":
                  case "CLOSED":
                    await this.updateOrder(
                      {
                        order_status: ORDER_STATUS.Liquidity_Success,
                        reason: "Cron Bitfinex Status: FILLED",
                        retries: 0,
                      },
                      orderId
                    );
                    break;
                  case "ERROR":
                  case "CANCELED":
                    await this.updateOrder(
                      {
                        order_status: ORDER_STATUS.Liquidity_Fail,
                        reason: "Cron Bitfinex Status: ERROR",
                        retries: 0,
                      },
                      orderId
                    );
                    break;
                }
              }
            } else {
              throw new Error(resData.message);
            }
          }
          break;
        case ORDER_STATUS.Liquidity_Success:
          {
            await this.updateOrder(
              {
                retries: retries + 1,
              },
              orderId
            );
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
            this.logger.log(
              "grpc1  unlock",
              ORDER_STATUS.Payment_Pending,
              result
            );
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Payment_Pending,
                },
                orderId
              );
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
            this.logger.log("grpc2  unlock", ORDER_STATUS.Completed, result);
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Completed,
                },
                orderId
              );
              //sending email
              this.rabbitmqService.sendTransactionEmail({
                clientId,
                email,
                type: order_type.toLowerCase(),
                actionType: "success",
                amount:
                  order_type.toLowerCase() === BUY_SELL_TYPE.Buy
                    ? order_qty
                    : qty,
                pair: `${primary_currency.currency_symbol}-${secondary_currency.currency_symbol}`,
                primary_currency: primary_currency.currency_symbol,
                secondary_currency: secondary_currency.currency_symbol,
              });
            } else {
              throw new Error(result.message);
            }
          }
          break;
        case ORDER_STATUS.Payment_Pending:
          {
            await this.updateOrder(
              {
                retries: retries + 1,
              },
              orderId
            );
            //wallet 2 add tokens
            const result = await this.walletGatewayService.updateAccountBalance(
              {
                clientId,
                coin: coin1.toLowerCase(),
                coinSymbol: coinSymbol1.toLowerCase(),
                typeId: orderId,
                amount: amount_received,
                type: wallet_gateway_type2,
                status: "COMPLETED",
                fee: 0,
              }
            );
            this.logger.log("grpc2  unlock", ORDER_STATUS.Completed, result);
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Completed,
                },
                orderId
              );
              //sending email
              this.rabbitmqService.sendTransactionEmail({
                clientId,
                email,
                type: order_type.toLowerCase(),
                actionType: "success",
                amount:
                  order_type.toLowerCase() === BUY_SELL_TYPE.Buy
                    ? order_qty
                    : qty,
                pair: `${primary_currency.currency_symbol}-${secondary_currency.currency_symbol}`,
                primary_currency: primary_currency.currency_symbol,
                secondary_currency: secondary_currency.currency_symbol,
              });
            } else {
              throw new Error(result.message);
            }
          }
          break;
        case ORDER_STATUS.Liquidity_Fail:
          //error from liquidity service(external binance)
          {
            await this.updateOrder(
              {
                retries: retries + 1,
              },
              orderId
            );
            // unlock wallet balance on error with grpc
            const result = await this.walletGatewayService.updateAccountBalance(
              {
                clientId,
                coin,
                coinSymbol,
                typeId: orderId,
                amount,
                type: wallet_gateway_type1,
                status: "FAILED",
                fee: 0,
              }
            );
            this.logger.log("grpc3  unlock", ORDER_STATUS.Failed, result);
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Failed,
                },
                orderId
              );
              //sending email
              this.rabbitmqService.sendTransactionEmail({
                clientId,
                email,
                type: order_type.toLowerCase(),
                actionType: "failed",
                amount: qty,
                pair: `${primary_currency.currency_symbol}-${secondary_currency.currency_symbol}`,
                primary_currency: primary_currency.currency_symbol,
                secondary_currency: secondary_currency.currency_symbol,
              });
            } else {
              throw new Error(result.message);
            }
          }
          break;
      }
      this.logger.log("update order--> ", orderId);
    } catch (error) {
      this.logger.log("error in cron", error);
      return false;
    }
    return true;
  }
  /**
   * update order market maker status of the order from liquidity
   * service
   * @param data
   */
  async updateOrderMarketMakerStatus(order: any): Promise<boolean> {
    const {
      dataValues: { orderId },
      client_id,
      is_swap,
      primary_currency_id,
      secondary_currency_id,
      market_maker_client_id,
      order_type,
      total_price,
      qty,
      order_qty,
      order_status,
      retries,
      email,
    } = order;
    //sql transactions
    try {
      const primary_currency = await this.currencyMaster.findOne({
        attributes: ["currency_symbol", "is_fiat_currency"],
        where: { id: primary_currency_id },
      });
      const secondary_currency = await this.currencyMaster.findOne({
        attributes: ["currency_symbol", "is_fiat_currency"],
        where: { id: secondary_currency_id },
      });
      let amount = 0,
        amount_received = 0,
        //market maker amounts
        maker_maker_amount_send = 0,
        maker_maker_amount_received = 0,
        coin = "fiat",
        coinSymbol = secondary_currency.currency_symbol,
        coin1 = "",
        coinSymbol1 = "",
        coin2 = "fiat",
        coinSymbol2 = "",
        wallet_gateway_type1 = "buy-out",
        wallet_gateway_type2 = "buy-in",
        //for market maker types
        wallet_gateway_type3 = "buy-out",
        wallet_gateway_type4 = "buy-in";
      //buy for relase lock or unlock
      if (order_type.toLowerCase() === BUY_SELL_TYPE.Buy) {
        //buy
        amount = total_price;
        amount_received = order_qty;
        maker_maker_amount_send = order_qty;
        maker_maker_amount_received = total_price;
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
        amount = qty;
        amount_received = total_price;
        maker_maker_amount_send = total_price;
        maker_maker_amount_received = qty;
        coin2 = primary_currency.currency_symbol;
        coinSymbol2 = primary_currency.currency_symbol;
        coin1 = secondary_currency.currency_symbol;
        coinSymbol1 = secondary_currency.currency_symbol;

        coin = secondary_currency.currency_symbol;
        //check for fiat
        if (secondary_currency.is_fiat_currency) {
          coin1 = "fiat";
          coinSymbol1 = secondary_currency.currency_symbol;
          coin = "fiat";
        }
        wallet_gateway_type1 = "sell-out";
        wallet_gateway_type2 = "sell-in";
        wallet_gateway_type3 = "sell-out";
        wallet_gateway_type4 = "sell-in";
      }

      //for swapping
      if (is_swap) {
        wallet_gateway_type1 = "swap-out";
        wallet_gateway_type2 = "swap-in";
        wallet_gateway_type3 = "swap-out";
        wallet_gateway_type4 = "swap-in";
        //for error request
        if (order_type.toLowerCase() === BUY_SELL_TYPE.Sell) {
          coin = primary_currency.currency_symbol;
          coinSymbol = primary_currency.currency_symbol;
        }
      }
      const clientId = client_id;
      //success from liquidity service
      switch (order_status) {
        case ORDER_STATUS.Liquidity_Pushed:
          await this.updateOrder(
            {
              order_status: ORDER_STATUS.Liquidity_Success,
            },
            orderId
          );
          break;
        case ORDER_STATUS.Liquidity_Success:
          {
            await this.updateOrder(
              {
                retries: retries + 1,
              },
              orderId
            );
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
            console.log("grpc1  unlock1", order.order_type, result);
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Market_Maker_Liquidity_Success,
                },
                orderId
              );
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
            console.log("grpc2  unlock2", order.order_type, result);
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Payment_Pending,
                },
                orderId
              );
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
            console.log("grpc2  update1", order.order_type, result);
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Market_Maker_Payment_Pending,
                },
                orderId
              );
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
            console.log("grpc2  update2", order.order_type, result);
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Completed,
                },
                orderId
              );
              //sending email
              this.rabbitmqService.sendTransactionEmail({
                clientId,
                email,
                type: order_type.toLowerCase(),
                actionType: "success",
                amount:
                  order_type.toLowerCase() === BUY_SELL_TYPE.Buy
                    ? order_qty
                    : qty,
                pair: `${primary_currency.currency_symbol}-${secondary_currency.currency_symbol}`,
                primary_currency: primary_currency.currency_symbol,
                secondary_currency: secondary_currency.currency_symbol,
              });
            } else {
              throw new Error(result.message);
            }
            console.log("update order--> ", orderId);
          }
          break;
        case ORDER_STATUS.Market_Maker_Liquidity_Success:
          {
            await this.updateOrder(
              {
                retries: retries + 1,
              },
              orderId
            );
            //wallet 1 market maker release lock and payment pending
            let result = await this.walletGatewayService.updateAccountBalance({
              clientId: market_maker_client_id,
              coin: coin1.toLowerCase(),
              coinSymbol: coinSymbol1.toLowerCase(),
              typeId: orderId,
              amount: maker_maker_amount_send,
              type: wallet_gateway_type3,
              status: "COMPLETED",
              fee: 0,
            });
            console.log("grpc2  unlock2", order.order_type, result);
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Payment_Pending,
                },
                orderId
              );
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
            console.log("grpc2  update1", order.order_type, result);
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Market_Maker_Payment_Pending,
                },
                orderId
              );
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
            console.log("grpc2  update2", order.order_type, result);
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Completed,
                },
                orderId
              );
              //sending email
              this.rabbitmqService.sendTransactionEmail({
                clientId,
                email,
                type: order_type.toLowerCase(),
                actionType: "success",
                amount:
                  order_type.toLowerCase() === BUY_SELL_TYPE.Buy
                    ? order_qty
                    : qty,
                pair: `${primary_currency.currency_symbol}-${secondary_currency.currency_symbol}`,
                primary_currency: primary_currency.currency_symbol,
                secondary_currency: secondary_currency.currency_symbol,
              });
            } else {
              throw new Error(result.message);
            }
            console.log("update order--> ", orderId);
          }
          break;
        case ORDER_STATUS.Payment_Pending:
          {
            await this.updateOrder(
              {
                retries: retries + 1,
              },
              orderId
            );

            //wallet 2 user add tokens
            let result = await this.walletGatewayService.updateAccountBalance({
              clientId,
              coin: coin1.toLowerCase(),
              coinSymbol: coinSymbol1.toLowerCase(),
              typeId: orderId,
              amount: amount_received,
              type: wallet_gateway_type2,
              status: "COMPLETED",
              fee: 0,
            });
            console.log("grpc2  update1", order.order_type, result);
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Market_Maker_Payment_Pending,
                },
                orderId
              );
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
            console.log("grpc2  update2", order.order_type, result);
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Completed,
                },
                orderId
              );
              //sending email
              this.rabbitmqService.sendTransactionEmail({
                clientId,
                email,
                type: order_type.toLowerCase(),
                actionType: "success",
                amount:
                  order_type.toLowerCase() === BUY_SELL_TYPE.Buy
                    ? order_qty
                    : qty,
                pair: `${primary_currency.currency_symbol}-${secondary_currency.currency_symbol}`,
                primary_currency: primary_currency.currency_symbol,
                secondary_currency: secondary_currency.currency_symbol,
              });
            } else {
              throw new Error(result.message);
            }
            console.log("update order--> ", orderId);
          }
          break;
        case ORDER_STATUS.Market_Maker_Payment_Pending:
          {
            await this.updateOrder(
              {
                retries: retries + 1,
              },
              orderId
            );
            //wallet 2 market maker add tokens
            const result = await this.walletGatewayService.updateAccountBalance(
              {
                clientId: market_maker_client_id,
                coin: coin2.toLowerCase(),
                coinSymbol: coinSymbol2.toLowerCase(),
                typeId: orderId,
                amount: maker_maker_amount_received,
                type: wallet_gateway_type4,
                status: "COMPLETED",
                fee: 0,
              }
            );
            console.log("grpc2  update2", order.order_type, result);
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Completed,
                },
                orderId
              );
            } else {
              throw new Error(result.message);
            }
            console.log("update order--> ", orderId);
          }
          break;
        case ORDER_STATUS.Liquidity_Fail:
          //error from liquidity service(external exchange)
          {
            await this.updateOrder(
              {
                retries: retries + 1,
              },
              orderId
            );
            // unlock wallet balance on error with grpc
            const result = await this.walletGatewayService.updateAccountBalance(
              {
                clientId,
                coin,
                coinSymbol,
                typeId: orderId,
                amount,
                type: wallet_gateway_type1,
                status: "FAILED",
                fee: 0,
              }
            );
            this.logger.log("grpc3  unlock", ORDER_STATUS.Failed, result);
            if (result.status === HttpStatus.OK) {
              await this.updateOrder(
                {
                  order_status: ORDER_STATUS.Failed,
                },
                orderId
              );
              //sending email
              this.rabbitmqService.sendTransactionEmail({
                clientId,
                email,
                type: order_type.toLowerCase(),
                actionType: "failed",
                amount: qty,
                pair: `${primary_currency.currency_symbol}-${secondary_currency.currency_symbol}`,
                primary_currency: primary_currency.currency_symbol,
                secondary_currency: secondary_currency.currency_symbol,
              });
            } else {
              throw new Error(result.message);
            }
          }
          break;
      }
      this.logger.log("update order--> ", orderId);
    } catch (error) {
      console.log(error);
      this.logger.debug("error in cron", error);
      return false;
    }
    return true;
  }
}
