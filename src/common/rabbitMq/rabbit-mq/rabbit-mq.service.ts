import { Injectable, Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { TimeoutError, catchError, lastValueFrom, timeout } from "rxjs";
import {
  ACTIVE_PAIRS_SERVICE,
  ADMIN_COIN_BALANCE_SERVICE,
  BUY_SELL_COIN_ACTIVE_SERVICE,
  COIN_PRICE_ADMIN_SERVICE,
  DEFAULT_RMQ_TIMEOUT,
  EXCHANGE_PAIR_STATUS_SERVICE,
  GET_ORDER_LIQUIDITY_SERVICE,
  LIQUIDITY_SERVICE,
  MARKET_MAKER_ORDER_SERVICE,
  MARKET_MAKER_SERVICE,
  PAIR_PRICE_SERVICE,
  RESPONSE_SERVICE,
  TRANSACTION_STATUS_USER_SERVICE,
} from "src/constants";

@Injectable()
export class RabbitMqService {
  constructor(
    @Inject(EXCHANGE_PAIR_STATUS_SERVICE)
    private readonly activePairsExchangeClient: ClientProxy,
    @Inject(ADMIN_COIN_BALANCE_SERVICE)
    private readonly adminCoinBalanceClient: ClientProxy,
    @Inject(PAIR_PRICE_SERVICE) private readonly pairPriceClient: ClientProxy,
    @Inject(LIQUIDITY_SERVICE) private readonly liqudityClient: ClientProxy,
    @Inject(GET_ORDER_LIQUIDITY_SERVICE)
    private readonly getOrderLiqudityClient: ClientProxy,
    @Inject(RESPONSE_SERVICE) private readonly responseClient: ClientProxy,
    @Inject(MARKET_MAKER_SERVICE)
    private readonly marketMakerClient: ClientProxy,
    @Inject(MARKET_MAKER_ORDER_SERVICE)
    private readonly marketMakerOrderClient: ClientProxy,
    @Inject(ACTIVE_PAIRS_SERVICE)
    private readonly activePairsClient: ClientProxy,
    @Inject(COIN_PRICE_ADMIN_SERVICE)
    private readonly coinPricAdminClient: ClientProxy,
    @Inject(TRANSACTION_STATUS_USER_SERVICE)
    private readonly transactionStatusClient: ClientProxy
  ) {
    this.init();
  }
  /**
   * initialize funct
   */
  private async init() {
    try {
      await this.responseClient.connect();
      await this.activePairsClient.connect();
      await this.activePairsExchangeClient.connect();
      await this.adminCoinBalanceClient.connect();
      await this.pairPriceClient.connect();
      await this.liqudityClient.connect();
      await this.getOrderLiqudityClient.connect();
      await this.marketMakerClient.connect();
      await this.marketMakerOrderClient.connect();
      await this.coinPricAdminClient.connect();
      await this.transactionStatusClient.connect();
    } catch (error) {
      console.log("Buy sell response: ", error);
    }
  }
  /**
   * connect active pairs client
   * @param pattern
   * @param data
   * @returns
   */
  public async send(pattern: string, data: any) {
    const result = this.activePairsClient.send(pattern, data).pipe(
      timeout(DEFAULT_RMQ_TIMEOUT), // Set the timeout in milliseconds
      catchError((error) => {
        if (error instanceof TimeoutError) {
          // Handle timeout error
          console.error("Request timed out");
        }
        throw error;
      })
    );
    return await lastValueFrom(result);
  }

  /**
   * push your message for message pattern to response queue
   * @param pattern
   * @param data
   */
  public async sendToResponse(pattern: any, data: any) {
    const str = JSON.stringify(data);

    switch (pattern) {
      case "order_response":
        this.responseClient.emit(pattern, str);
        break;
      case "liquidity_queue":
        this.liqudityClient.emit(pattern, str);
        break;
      case "market_maker_order":
        this.marketMakerOrderClient.emit(pattern, str);
        break;
    }
  }
  /**
   * order response queue publish
   * @param data
   */
  public async orderResponse(data: any) {
    console.log("publish to order response queue");
    console.table(data);
    console.table(data?.data);
    this.sendToResponse("order_response", data);
  }
  /**
   * liquidity queue publish
   * @param data
   */
  public async sendToLiqudity(data: any) {
    this.sendToResponse("liquidity_queue", data);
  }
  /**
   * market maker order queue publish
   * @param data
   */
  public async sendToMarketMakerOrderQueue(data: any) {
    this.sendToResponse("market_maker_order", data);
  }
  /**
   * push your message for message pattern to pair_price_queue
   * @param data
   */
  public async sendToPairPriceQueue(data: any): Promise<any> {
    const result = this.pairPriceClient
      .send("pair_price", JSON.stringify(data))
      .pipe(
        timeout(DEFAULT_RMQ_TIMEOUT), // Set the timeout in milliseconds
        catchError((error) => {
          if (error instanceof TimeoutError) {
            // Handle timeout error
            console.error("Request timed out");
          }
          throw error;
        })
      );
    return await lastValueFrom(result);
  }
  /**
   * push your message for message pattern to admin_coin_balance_queue
   * @param data
   */
  public async sendToAdminCoinBalanceQueue(data: any): Promise<any> {
    const result = this.adminCoinBalanceClient.send(
      "coin_admin_balance",
      JSON.stringify(data)
    );
    return await lastValueFrom(result);
  }
  /**
   * push your message for message pattern to active pair status queue to
   * get exchange status
   * @param data
   */
  public async sendToExchangeStatusQueue(data: any): Promise<any> {
    const result = this.activePairsExchangeClient
      .send("exchange_status", JSON.stringify(data))
      .pipe(
        timeout(DEFAULT_RMQ_TIMEOUT), // Set the timeout in milliseconds
        catchError((error) => {
          if (error instanceof TimeoutError) {
            // Handle timeout error
            console.error("Request timed out");
          }
          throw error;
        })
      );
    return await lastValueFrom(result);
  }
  /**
   * push your message for message pattern to active pair status queue to
   * get pair limit status
   * @param data
   */
  public async getPairOrderLimitQueue(data: string): Promise<any> {
    const result = this.activePairsExchangeClient
      .send("get_order_limits", data)
      .pipe(
        timeout(DEFAULT_RMQ_TIMEOUT), // Set the timeout in milliseconds
        catchError((error) => {
          if (error instanceof TimeoutError) {
            // Handle timeout error
            console.error("Request timed out");
          }
          throw error;
        })
      );
    return await lastValueFrom(result);
  }
  /**
   * push your message for message pattern to exchange_pair_status_queue
   * @param data
   */
  public async sendToActivePairsExchangeQueue(data: any): Promise<any> {
    const result = this.activePairsExchangeClient
      .send("exchange_pair_status", JSON.stringify(data))
      .pipe(
        timeout(DEFAULT_RMQ_TIMEOUT), // Set the timeout in milliseconds
        catchError((error) => {
          if (error instanceof TimeoutError) {
            // Handle timeout error
            console.error("Request timed out");
          }
          throw error;
        })
      );
    return await lastValueFrom(result);
  }
  /**
   * get response from liquidity service with order id
   * @param data
   */
  public async getOrderDetailsFromLiquidity(data: any): Promise<any> {
    const result = this.getOrderLiqudityClient
      .send("get_order", JSON.stringify(data))
      .pipe(
        timeout(DEFAULT_RMQ_TIMEOUT), // Set the timeout in milliseconds
        catchError((error) => {
          if (error instanceof TimeoutError) {
            // Handle timeout error
            console.error("Request timed out");
          }
          throw error;
        })
      );
    return await lastValueFrom(result);
  }
  /**
   * get market maker details
   * @param data
   * @returns
   */
  public async getMarketMakerDetails(data: any): Promise<any> {
    const result = this.marketMakerClient
      .send("market_maker_details", JSON.stringify(data))
      .pipe(
        timeout(DEFAULT_RMQ_TIMEOUT), // Set the timeout in milliseconds
        catchError((error) => {
          if (error instanceof TimeoutError) {
            // Handle timeout error
            console.error("Request timed out");
          }
          throw error;
        })
      );
    return await lastValueFrom(result);
  }
  /**
   * get coin price admin
   * @param data
   * @returns
   */
  public async getCoinPriceAdmin(data: any): Promise<any> {
    const result = this.coinPricAdminClient
      .send("coin_price_admin", JSON.stringify(data))
      .pipe(
        timeout(DEFAULT_RMQ_TIMEOUT), // Set the timeout in milliseconds
        catchError((error) => {
          if (error instanceof TimeoutError) {
            // Handle timeout error
            console.error("Request timed out");
          }
          throw error;
        })
      );
    return await lastValueFrom(result);
  }
  /**
   * message pattern for email
   * @param data
   * @returns
   */
  public async sendTransactionEmail(data: any): Promise<any> {
    const result = this.transactionStatusClient
      .send("transaction_status", JSON.stringify(data))
      .pipe(
        timeout(DEFAULT_RMQ_TIMEOUT), // Set the timeout in milliseconds
        catchError((error) => {
          if (error instanceof TimeoutError) {
            // Handle timeout error
            console.error("Request timed out");
          }
          throw error;
        })
      );
    return await lastValueFrom(result);
  }
}
