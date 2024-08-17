import { Inject, Injectable } from "@nestjs/common";
import sequelize from "sequelize";
import { Orders } from "src/common/base-model/entities/orders.entity";
import { returnSuccess } from "src/common/util/response.handler";
import { BUY_SELL_MSG, RES_MSG } from "src/constants/message.constant";
import { AdminFiltersOrdersDto } from "./dto/admin-filters-orders.dto";
import { Pairs } from "src/common/base-model/entities/pairs.entity";
import * as moment from "moment";
import { FeeReportFiltersDto } from "./dto/fee-reports-filters.dto";
import {
  BUY_SELL_TYPE,
  FEE_REPORT_TRANSACTION_TYPE,
  IS_SWAP,
  ORDER_STATUS,
} from "src/constants/enums";
import { CurrencyMaster } from "src/common/base-model/entities/currency_master.entity";
import { MarketMakerWallets } from "src/common/base-model/entities/market_maker_wallets.entity";
import { StatsFiltersOrdersDto } from "./dto/stats-filters-orders";
import { DATE_RANGE_LIMIT, DEFAULT_CURRENCY } from "src/constants";
import { DailyStatsFiltersOrdersDto } from "./dto/dailystats-filters-orders";
import { OrderStats } from "src/common/base-model/entities/orders_stats.entity";
@Injectable()
export class OrdersService {
  constructor(
    @Inject("Orders") private readonly ordersResp: typeof Orders,
    @Inject("MarketMakerWallets")
    private readonly marketMakerWalletsResp: typeof MarketMakerWallets,
    @Inject("CURRENCY_MASTER")
    private currencyMasterResp: typeof CurrencyMaster,
    @Inject("OrderStats") private orderStatsView: typeof OrderStats
  ) {}
  /**
   * list
   * @returns
   */
  async findAll({
    filter,
    pair_id,
    order_type,
    type,
    limit,
    page,
    direction,
    column,
    is_swap,
    from,
    to,
    chain_id,
    is_market_maker,
  }: AdminFiltersOrdersDto) {
    const query: any = {
      attributes: [
        [sequelize.fn("BIN_TO_UUID", sequelize.col("Orders.id")), "id"],
        [sequelize.fn("BIN_TO_UUID", sequelize.col("member_id")), "member_id"],
        [sequelize.fn("BIN_TO_UUID", sequelize.col("pair_id")), "pair_id"],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("market_maker_id")),
          "market_maker_id",
        ],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("primary_currency_id")),
          "primary_currency_id",
        ],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("secondary_currency_id")),
          "secondary_currency_id",
        ],
        [
          sequelize.literal(
            `(SELECT currency_symbol FROM currency_master WHERE id = Orders.primary_currency_id)`
          ),
          "primary",
        ],
        [
          sequelize.literal(
            `(SELECT currency_symbol FROM currency_master WHERE id = Orders.secondary_currency_id)`
          ),
          "secondary",
        ],
        `order_type`,
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
        [sequelize.literal("`pair`.`pair_name`"), "pair_name"],
      ],
    };
    //filters
    let filterObj: any;
    if (filter) {
      filterObj = {
        [sequelize.Op.or]: [
          {
            email: {
              [sequelize.Op.like]: `%${filter}%`,
            },
          },
          {
            country: {
              [sequelize.Op.like]: `%${filter}%`,
            },
          },
        ],
      };
      query.where = filterObj;
    }
    if (is_swap !== undefined) {
      query.where = { ...query.where, is_swap };
    }
    if (order_type) {
      query.where = { ...query.where, order_type, is_swap: IS_SWAP.NO };
    }
    if (chain_id !== undefined) {
      query.where = { ...query.where, chain_id };
    }
    if (is_market_maker !== undefined) {
      query.where = { ...query.where, is_market_maker };
    }
    if (pair_id) {
      query.where = {
        ...query.where,
        pair_id: sequelize.fn("UUID_TO_BIN", pair_id),
      };
    }

    if (type) {
      query.where = { ...query.where, type };
    }

    let fromDate: string = moment(new Date()).format("YYYY-MM-DD 00:00:00");
    let toDate: string = moment(new Date()).format("YYYY-MM-DD 23:59:59");

    // date filters
    if (from) {
      fromDate = moment(from).format("YYYY-MM-DD 00:00:00");
    }
    if (to) {
      toDate = moment(to).format("YYYY-MM-DD 23:59:59");
    }
    if (from || to) {
      query.where = {
        ...query.where,
        created_at: {
          [sequelize.Op.between]: [fromDate, toDate],
        },
      };
    }
    // pagination
    if (!limit || limit <= 0) {
      limit = 10;
    }
    if (!page || page <= 0) {
      page = 1;
    }
    query.offset = (page - 1) * limit;
    query.limit = limit;

    // sorting
    if (direction && column) {
      query.order = [[column, direction]];
    } else {
      query.order = [["created_at", "DESC"]];
    }
    const count = await this.ordersResp.count({ where: query.where });
    const rows = await this.ordersResp.findAll<Orders>({
      raw: true,
      ...query,
      include: [{ model: Pairs, as: "pair", attributes: [] }],
    });
    if (!rows) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, {
        count: 0,
        rows: [],
      });
    }
    return returnSuccess(null, RES_MSG?.COMMON.LIST, { count, rows });
  }
  async changeDateMoment(value: any): Promise<any> {
    try {
      const transformedValue = moment(value).format("DD-MM-YYYY, hh:mm a");
      // Do something with the transformed value, for example, return it
      return transformedValue;
    } catch (error) {
      // Handle the error, log it, or provide a default value
      console.error("Error formatting date:", error);
      // You might want to throw the error or return a default value
      return "";
    }
  }
  /**
   * order csv export
   * @param filters
   * @returns
   */
  async generate_csvFor(filters: any): Promise<any> {
    const res: any = await this.findAll(filters);
    let records = [];

    if (res?.error) throw res;
    if (res?.data?.rows.length) {
      records = await this.getFilterPairsList(res?.data?.rows);
    }
    const hColumns = [
      { id: "S-no", title: "S-no" },
      { id: "OrderID", title: "OrderID" },
      { id: "Order Type", title: "Order" },
      { id: "Email", title: "Email" },
      { id: "Country", title: "Country" },
      { id: "Pair", title: "Pair" },
      { id: "Amount", title: "Amount/Qty" },
      { id: "Fee", title: "Fee" },
      { id: "User Spend", title: "User Spend" },
      { id: "User Received", title: "User Received" },
      { id: "Type", title: "Type" },
      { id: "Date", title: "Date" },
      { id: "Order status", title: "Order status" },
    ];
    return { hColumns, records };
  }

  /**
   * get filter pairs list
   * @param data
   * @returns
   */
  async getFilterPairsList(data: any): Promise<any> {
    let resp: any = [];
    let i = 0;
    for (const row of data) {
      resp = [
        ...resp,
        {
          "S-no": ++i,
          OrderID: row?.id,
          "Order Type": row.is_swap === IS_SWAP.YES ? "SWAP" : row?.order_type,
          Email: row?.email,
          Country: row?.country,
          Pair: row?.primary + "-" + row?.secondary,
          Amount: `${row?.qty} ${row?.primary}`,
          Fee:
            row?.order_type === BUY_SELL_TYPE.Buy.toUpperCase()
              ? `${row?.fee_in_qty} ${row?.primary}`
              : `${row?.fee} ${row?.secondary}`,
          "User Spend":
            row?.order_type === BUY_SELL_TYPE.Buy.toUpperCase()
              ? `${row?.total_price} ${row?.secondary}`
              : `${row?.qty} ${row?.primary}`,
          "User Received":
            row?.order_type === BUY_SELL_TYPE.Buy.toUpperCase()
              ? `${row?.order_qty} ${row?.primary}`
              : `${row?.total_price} ${row?.secondary}`,
          Type: row?.type,
          Date: await this.changeDateMoment(row.created_at),
          "Order status": row.order_status,
        },
      ];
    }
    return resp;
  }

  /**
   * fee reports for admin
   * @param param0
   * @returns
   */
  async feeReports({
    filter,
    country,
    limit,
    page,
    direction,
    column,
    from,
    to,
    transaction_type,
    coin,
  }: FeeReportFiltersDto) {
    const query: any = {
      attributes: [
        [sequelize.fn("BIN_TO_UUID", sequelize.col("Orders.id")), "id"],
        [sequelize.fn("BIN_TO_UUID", sequelize.col("member_id")), "member_id"],
        [sequelize.fn("BIN_TO_UUID", sequelize.col("pair_id")), "pair_id"],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("market_maker_id")),
          "market_maker_id",
        ],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("primary_currency_id")),
          "primary_currency_id",
        ],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("secondary_currency_id")),
          "secondary_currency_id",
        ],
        [
          sequelize.literal(
            `(SELECT currency_symbol FROM currency_master WHERE id = Orders.primary_currency_id)`
          ),
          "primary",
        ],
        [
          sequelize.literal(
            `(SELECT currency_symbol FROM currency_master WHERE id = Orders.secondary_currency_id)`
          ),
          "secondary",
        ],
        `order_type`,
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
        [sequelize.literal("`pair`.`pair_name`"), "pair_name"],
      ],
    };
    //filters
    let coinObj: any;
    if (filter) {
      query.where = {
        email: {
          [sequelize.Op.like]: `%${filter}%`,
        },
      };
    }
    if (country) {
      query.where = {
        country: {
          [sequelize.Op.like]: `%${country}%`,
        },
      };
    }
    switch (transaction_type) {
      case FEE_REPORT_TRANSACTION_TYPE.BUY:
      case FEE_REPORT_TRANSACTION_TYPE.MARKUP:
        query.where = {
          ...query.where,
          order_type: "BUY",
          is_swap: IS_SWAP.NO,
        };
        break;
      case FEE_REPORT_TRANSACTION_TYPE.SELL:
      case FEE_REPORT_TRANSACTION_TYPE.MARKDOWN:
        query.where = {
          ...query.where,
          order_type: "SELL",
          is_swap: IS_SWAP.NO,
        };
        break;
      case FEE_REPORT_TRANSACTION_TYPE.SWAP:
        query.where = { ...query.where, is_swap: IS_SWAP.YES };
        break;
    }

    if (coin) {
      coinObj = await this.currencyMasterResp.findOne({
        attributes: [`id`],
        where: {
          currency_symbol: {
            [sequelize.Op.like]: `%${coin}%`,
          },
        },
      });
      if (coinObj?.id) {
        query.where = {
          ...query.where,
          [sequelize.Op.or]: [
            {
              primary_currency_id: {
                [sequelize.Op.eq]: coinObj.id,
              },
            },
            {
              secondary_currency_id: {
                [sequelize.Op.eq]: coinObj.id,
              },
            },
          ],
        };
      }
    }

    let fromDate: string = moment(new Date()).format("YYYY-MM-DD 00:00:00");
    let toDate: string = moment(new Date()).format("YYYY-MM-DD 23:59:59");

    // date filters
    if (from) {
      fromDate = moment(from).format("YYYY-MM-DD 00:00:00");
    }
    if (to) {
      toDate = moment(to).format("YYYY-MM-DD 23:59:59");
    }
    if (from || to) {
      query.where = {
        ...query.where,
        created_at: { [sequelize.Op.between]: [fromDate, toDate] },
      };
    }
    // pagination
    if (!limit || limit <= 0) {
      limit = 10;
    }
    if (limit > 1000000) {
      limit = 1000000;
    }
    if (!page || page <= 0) {
      page = 1;
    }
    query.offset = (page - 1) * limit;
    query.limit = limit;

    // sorting
    if (direction && column) {
      query.order = [[column, direction]];
    } else {
      query.order = [["created_at", "DESC"]];
    }
    const count = await this.ordersResp.count({ where: query.where });

    const rows = await this.ordersResp.findAll<Orders>({
      raw: true,
      ...query,
      include: [{ model: Pairs, as: "pair", attributes: [] }],
      logging: console.log,
    });
    if (!rows) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, {
        count: 0,
        rows: [],
      });
    }
    return returnSuccess(null, RES_MSG?.COMMON.LIST, { count, rows });
  }

  /**
   * marketMakerOrders
   * @returns
   */
  async marketMakerOrders({
    filter,
    pair_id,
    order_type,
    type,
    limit,
    page,
    direction,
    column,
    is_swap,
    from,
    to,
    chain_id,
  }: AdminFiltersOrdersDto): Promise<any> {
    const query: any = {
      attributes: [
        `balance`,
        `balance_in_usd`,
        [sequelize.literal("`order->pair`.`pair_name`"), "pair_name"],
        [sequelize.fn("BIN_TO_UUID", sequelize.col("order.id")), "id"],
        [sequelize.fn("BIN_TO_UUID", sequelize.col("member_id")), "member_id"],
        [sequelize.fn("BIN_TO_UUID", sequelize.col("pair_id")), "pair_id"],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("market_maker_id")),
          "market_maker_id",
        ],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("primary_currency_id")),
          "primary_currency_id",
        ],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("secondary_currency_id")),
          "secondary_currency_id",
        ],
        [
          sequelize.literal(
            `(SELECT currency_symbol FROM currency_master WHERE id = order.primary_currency_id)`
          ),
          "primary",
        ],
        [
          sequelize.literal(
            `(SELECT currency_symbol FROM currency_master WHERE id = order.secondary_currency_id)`
          ),
          "secondary",
        ],
        `order.order_type`,
        `order.email`,
        `order.country`,
        `order.order_status`,
        `order.retries`,
        `order.reason`,
        `order.is_processed`,
        `order.created_at`,
        `order.updated_at`,
        `order.type`,
        `order.is_swap`,
        `order.is_market_maker`,
        `order.chain_id`,
        `order.order_qty`,
        `order.qty`,
        `order.markupdown_qty`,
        `order.fee_in_qty`,
        `order.total_price`,
        `order.actual_total_price`,
        `order.actual_price`,
        `order.markupdown_price`,
        `order.fee`,
        `order.markupdown_fee`,
        `order.markupdown_fee_in_qty`,
        `order.per_price_usd`,
        `order.qty_in_usd`,
        `order.fee_in_usd`,
        `order.markupdown_price_in_usd`,
        `order.markupdown_fee_in_usd`,
        `order.total_price_usd`,
      ],
    };
    //filters
    let filterObj: any;
    if (filter) {
      filterObj = {
        [sequelize.Op.or]: [
          {
            "$order.email$": {
              [sequelize.Op.like]: `%${filter}%`,
            },
          },
          {
            "$order.country$": {
              [sequelize.Op.like]: `%${filter}%`,
            },
          },
        ],
      };
      query.where = filterObj;
    }
    if (is_swap !== undefined) {
      query.where = { ...query.where, "$order.is_swap$": is_swap };
    }
    if (chain_id !== undefined) {
      query.where = { ...query.where, "$order.chain_id$": chain_id };
    }

    if (pair_id) {
      query.where = {
        ...query.where,
        "$order.pair_id$": sequelize.fn("UUID_TO_BIN", pair_id),
      };
    }
    if (order_type) {
      query.where = {
        ...query.where,
        "$order.order_type$": order_type,
        is_swap: IS_SWAP.NO,
      };
    }
    if (type) {
      query.where = { ...query.where, "$order.type$": type };
    }
    let fromDate: string = moment(new Date()).format("YYYY-MM-DD 00:00:00");
    let toDate: string = moment(new Date()).format("YYYY-MM-DD 23:59:59");

    // date filters
    if (from) {
      fromDate = moment(from).format("YYYY-MM-DD 00:00:00");
    }
    if (to) {
      toDate = moment(to).format("YYYY-MM-DD 23:59:59");
    }
    if (from || to) {
      query.where = {
        ...query.where,
        created_at: { [sequelize.Op.between]: [fromDate, toDate] },
      };
    }

    // pagination
    if (!limit || limit <= 0) {
      limit = 10;
    }
    if (limit > 1000000) {
      limit = 1000000;
    }
    if (!page || page <= 0) {
      page = 1;
    }
    query.offset = (page - 1) * limit;
    query.limit = limit;

    // sorting
    if (direction && column) {
      query.order = [[column, direction]];
    } else {
      query.order = [["created_at", "DESC"]];
    }
    const count = await this.marketMakerWalletsResp.count({
      where: query.where,
      include: [
        {
          model: Orders,
          as: "order",
          attributes: [],
        },
      ],
    });

    const rows = await this.marketMakerWalletsResp.findAll<any>({
      raw: true,
      ...query,
      include: [
        {
          model: Orders,
          as: "order",
          attributes: [],
          include: [
            {
              model: Pairs,
              as: "pair",
              attributes: [],
            },
          ],
        },
      ],
    });
    if (!rows) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, {
        count: 0,
        rows: [],
      });
    }
    return returnSuccess(null, RES_MSG?.COMMON.LIST, { count, rows });
  }
  /**
   * total fee earned for completed orders
   * @returns
   */
  async getTotalFeeEarned(data: any): Promise<number> {
    const res = await this.ordersResp.findAll({
      attributes: [[sequelize.fn("SUM", sequelize.col(`fee_in_usd`)), `total`]],
      where: {
        order_status: ORDER_STATUS.Completed,
      },
    });
    if (res.length > 0) return res[0]?.dataValues?.total;
    else return 0;
  }

  async marketMakerOrders_csvFor(data: any): Promise<any> {
    const res = await this.marketMakerOrders(data);
    let records = [];

    if (res?.error) throw res;
    if (res?.data?.rows.length) {
      records = await this.getFiltermarketMakerOrdersList(res?.data?.rows);
    }

    const hColumns = [
      { id: "S-no", title: "S-no" },
      { id: "Pair", title: "Pair" },
      { id: "Type", title: "Type" },
      { id: "Amount", title: "Amount" },
      { id: "Fee", title: "Fee" },
      { id: "User Spend", title: "User Spend" },
      { id: "User Received", title: "User Received" },
      { id: "Email", title: "User Email ID" },
      { id: "Order ID", title: "Order ID" },
      { id: "Date", title: "Date" },
      { id: "XIV Total Balance", title: "XIV Total Balance" },
      { id: "NGN Total Balance", title: "NGN Total Balance" },
      { id: "Status", title: "Status" },
    ];
    return { hColumns, records };
  }
  /**
   * get filter pairs list
   * @param data
   * @returns
   */
  async getFiltermarketMakerOrdersList(data: any): Promise<any> {
    let resp: any = [];
    let i = 0;
    for (const row of data) {
      resp = [
        ...resp,
        {
          "S-no": ++i,
          Pair: row?.pair_name,
          Type: row.is_swap === IS_SWAP.YES ? "SWAP" : row?.order_type,
          Fee:
            row?.order_type === BUY_SELL_TYPE.Buy.toUpperCase()
              ? `${row?.fee_in_qty} ${row?.primary}`
              : `${row?.fee} ${row?.secondary}`,
          Amount: `${row?.qty} ${row?.primary}`,
          "User Spend":
            row?.order_type === BUY_SELL_TYPE.Buy.toUpperCase()
              ? `${row?.total_price} ${row?.secondary}`
              : `${row?.qty} ${row?.primary}`,
          "User Received":
            row?.order_type === BUY_SELL_TYPE.Buy.toUpperCase()
              ? `${row?.order_qty} ${row?.primary}`
              : `${row?.total_price} ${row?.secondary}`,
          Email: row?.email,
          "Order ID": row?.id,
          Date: await this.changeDateMoment(row.created_at),
          "XIV Total Balance": row?.balance,
          "NGN Total Balance": row?.balance_in_usd,
          Status: row?.order_status,
        },
      ];
    }
    return resp;
  }
  async feeReportsCsv(data: any): Promise<any> {
    const res = await this.feeReports(data);
    let records = [];

    if (res?.error) throw res;
    if (res?.data?.rows.length) {
      records = await this.getFilterfeeReportsCsv(res?.data?.rows);
    }

    const hColumns = [
      { id: "S-no", title: "S-no" },
      { id: "Txn", title: "Txn" },
      { id: "Pair", title: "Pair" },
      { id: "Email", title: "Email" },
      { id: "Country", title: "Country" },
      { id: "Type", title: "TxnType" },
      { id: "FeeCharged", title: "FeeCharged" },
      { id: "FeeNGN", title: "FeeNGN" },
      { id: "Created at", title: "Date" },
      { id: "Status", title: "Status" },
    ];
    return { hColumns, records };
  }
  /**
   * get filter pairs list
   * @param data
   * @returns
   */
  async getFilterfeeReportsCsv(data: any): Promise<any> {
    let resp: any = [];
    let i = 0;
    for (const row of data) {
      resp = [
        ...resp,
        {
          "S-no": ++i,
          Txn: row?.id,
          Pair: `${row?.primary}-${row?.secondary}`,
          Email: row?.email,
          Type: row.is_swap === IS_SWAP.YES ? "SWAP" : row?.order_type,
          Country: row?.country,
          FeeCharged:
            row?.order_type === BUY_SELL_TYPE.Buy.toUpperCase()
              ? `${row?.fee_in_qty} ${row?.primary}`
              : `${row?.fee} ${row?.secondary}`,
          FeeNGN: row?.fee_in_usd,
          "Created at": await this.changeDateMoment(row.created_at),
          Status: row?.order_status,
        },
      ];
    }
    return resp;
  }

  /**
   * stat total orders for admin
   * @param param0
   * @returns
   */
  async statsTotalOrders({ from, to, coin }: StatsFiltersOrdersDto) {
    const query: any = {
      attributes: [
        [
          sequelize.fn(
            "ROUND",
            sequelize.fn(
              "SUM",
              sequelize.literal(
                `CASE WHEN order_type = "BUY" THEN qty ELSE 0 END`
              )
            ),
            8
          ),
          "total_buy",
        ],
        [
          sequelize.fn(
            "ROUND",
            sequelize.fn(
              "SUM",
              sequelize.literal(
                `CASE WHEN order_type = "SELL" THEN qty ELSE 0 END`
              )
            ),
            8
          ),
          "total_sell",
        ],
        [
          sequelize.fn(
            "ROUND",
            sequelize.fn(
              "SUM",
              sequelize.literal(
                `CASE WHEN order_type = "BUY" THEN total_price_usd ELSE 0 END`
              )
            ),
            8
          ),
          "total_buy_usd",
        ],
        [
          sequelize.fn(
            "ROUND",
            sequelize.fn(
              "SUM",
              sequelize.literal(
                `CASE WHEN order_type = "SELL" THEN total_price_usd ELSE 0 END`
              )
            ),
            8
          ),
          "total_sell_usd",
        ],
        [sequelize.fn("COUNT", "*"), `transactions`],
        [sequelize.literal("`pair`.`pair_name`"), "pair_name"],
        [sequelize.literal("`pair->currency`.`currency_symbol`"), "primary"],
        [
          sequelize.literal("`pair->other_currency`.`currency_symbol`"),
          "secondary",
        ],
      ],
      where: {
        order_status: ORDER_STATUS.Completed,
      },
    };
    //filters
    let fromDate: string = moment(new Date()).format("YYYY-MM-DD 00:00:00");
    let toDate: string = moment(new Date()).format("YYYY-MM-DD 23:59:59");

    // date filters
    if (from) {
      fromDate = moment(from).format("YYYY-MM-DD 00:00:00");
    }
    if (to) {
      toDate = moment(to).format("YYYY-MM-DD 23:59:59");
    }
    const startDate = moment(fromDate);
    const endDate = moment(toDate);
    // Calculate the difference in days
    const diffInDays = endDate.diff(startDate, "days");
    if (diffInDays > DATE_RANGE_LIMIT) {
      throw new Error(BUY_SELL_MSG.ERRORS.DATE_RANGE_ERROR(DATE_RANGE_LIMIT));
    }
    if (from || to) {
      query.where = {
        ...query.where,
        created_at: { [sequelize.Op.between]: [fromDate, toDate] },
      };
    }
    if (coin) {
      const coinObj = await this.currencyMasterResp.findOne({
        attributes: [`id`],
        where: {
          currency_symbol: {
            [sequelize.Op.like]: `%${coin}%`,
          },
        },
      });
      if (coinObj?.id) {
        query.where = {
          ...query.where,
          [sequelize.Op.or]: [
            {
              primary_currency_id: {
                [sequelize.Op.eq]: coinObj.id,
              },
            },
            {
              secondary_currency_id: {
                [sequelize.Op.eq]: coinObj.id,
              },
            },
          ],
        };
      }
    }
    const rows = await this.ordersResp.findAll<Orders>({
      ...query,
      include: [
        {
          model: Pairs,
          as: "pair",
          attributes: [],
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
        },
      ],
      group: ["pair_id"],
    });
    if (!rows) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, {
        rows: [],
      });
    }
    return returnSuccess(null, RES_MSG?.COMMON.LIST, { rows });
  }
  /**
   * csv for total orders stats
   * @param filters
   * @returns
   */
  async statsTotalOrdersCsv(filters: any): Promise<any> {
    const limit = 100000;
    const page = 1;
    filters = { ...filters, ...{ limit, page } };
    const res = await this.statsTotalOrders(filters);
    if (res?.error) throw res;

    const hColumns = [
      { id: "sno", title: "S-no" },
      { id: "pair_name", title: "Pair" },
      { id: "total_buy", title: "Total Buy" },
      { id: "total_buy_usd", title: `Total Buy (${DEFAULT_CURRENCY})` },
      { id: "total_sell", title: "Total Sell" },
      { id: "total_sell_usd", title: `Total Sell (${DEFAULT_CURRENCY})` },
      { id: "transactions", title: "Transactions" },
    ];

    let resp: any = [];
    let i = 0;
    for (let row of res?.data?.rows) {
      row = row.dataValues;
      resp = [
        ...resp,
        {
          sno: ++i,
          pair_name: row?.pair_name,
          total_buy: `${row?.total_buy} ${row?.primary}`,
          total_buy_usd: row?.total_buy_usd,
          total_sell: `${row?.total_sell} ${row?.primary}`,
          total_sell_usd: row?.total_sell_usd,
          transactions: row?.transactions,
        },
      ];
    }
    return { hColumns, records: resp };
  }
  /**
   * daily stats total orders for admin
   * @param param0
   * @returns
   */
  async dailyStatsTotalOrders({
    from,
    to,
    coin,
    limit,
    page,
    column,
    direction,
  }: DailyStatsFiltersOrdersDto) {
    const query: any = {
      attributes: [
        [
          sequelize.fn("DATE", sequelize.col("Orders.created_at")),
          "created_at",
        ],
        [
          sequelize.fn(
            "ROUND",
            sequelize.fn(
              "SUM",
              sequelize.literal(
                `CASE WHEN order_type = "BUY" THEN qty ELSE 0 END`
              )
            ),
            8
          ),
          "total_buy",
        ],
        [
          sequelize.fn(
            "ROUND",
            sequelize.fn(
              "SUM",
              sequelize.literal(
                `CASE WHEN order_type = "SELL" THEN qty ELSE 0 END`
              )
            ),
            8
          ),
          "total_sell",
        ],
        [
          sequelize.fn(
            "ROUND",
            sequelize.fn(
              "SUM",
              sequelize.literal(
                `CASE WHEN order_type = "BUY" THEN total_price_usd ELSE 0 END`
              )
            ),
            8
          ),
          "total_buy_usd",
        ],
        [
          sequelize.fn(
            "ROUND",
            sequelize.fn(
              "SUM",
              sequelize.literal(
                `CASE WHEN order_type = "SELL" THEN total_price_usd ELSE 0 END`
              )
            ),
            8
          ),
          "total_sell_usd",
        ],
        [sequelize.fn("COUNT", "*"), `transactions`],
        [sequelize.literal("`pair`.`pair_name`"), "pair_name"],
        [sequelize.literal("`pair->currency`.`currency_symbol`"), "primary"],
        [
          sequelize.literal("`pair->other_currency`.`currency_symbol`"),
          "secondary",
        ],
      ],
      where: {
        order_status: ORDER_STATUS.Completed,
      },
    };
    // pagination
    if (!limit || limit <= 0) {
      limit = 10;
    }
    if (limit > 1000000) {
      limit = 1000000;
    }
    if (!page || page <= 0) {
      page = 1;
    }
    query.offset = (page - 1) * limit;
    query.limit = limit;

    // sorting
    if (direction && column) {
      query.order = [[column, direction]];
    } else {
      query.order = [["created_at", "ASC"]];
    }
    //filters
    let fromDate: string = moment(new Date()).format("YYYY-MM-DD 00:00:00");
    let toDate: string = moment(new Date()).format("YYYY-MM-DD 23:59:59");

    // date filters
    if (from) {
      fromDate = moment(from).format("YYYY-MM-DD 00:00:00");
    }
    if (to) {
      toDate = moment(to).format("YYYY-MM-DD 23:59:59");
    }
    const startDate = moment(fromDate);
    const endDate = moment(toDate);
    // Calculate the difference in days
    const diffInDays = endDate.diff(startDate, "days");
    if (diffInDays > DATE_RANGE_LIMIT) {
      throw new Error(BUY_SELL_MSG.ERRORS.DATE_RANGE_ERROR(DATE_RANGE_LIMIT));
    }
    if (from || to) {
      query.where = {
        ...query.where,
        created_at: { [sequelize.Op.between]: [fromDate, toDate] },
      };
    }
    if (coin) {
      const coinObj = await this.currencyMasterResp.findOne({
        attributes: [`id`],
        where: {
          currency_symbol: {
            [sequelize.Op.like]: `%${coin}%`,
          },
        },
      });
      if (coinObj?.id) {
        query.where = {
          ...query.where,
          [sequelize.Op.or]: [
            {
              primary_currency_id: {
                [sequelize.Op.eq]: coinObj.id,
              },
            },
            {
              secondary_currency_id: {
                [sequelize.Op.eq]: coinObj.id,
              },
            },
          ],
        };
      }
    }

    const counts: any = await this.ordersResp.findAll({
      attributes: [[sequelize.fn("COUNT", "*"), "T"]],
      where: query.where,
      group: ["pair_id", sequelize.fn("DATE", sequelize.col("created_at"))],
    });
    const count = counts?.length || 0;

    const rows = await this.ordersResp.findAll<Orders>({
      ...query,
      include: [
        {
          model: Pairs,
          as: "pair",
          attributes: [],
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
        },
      ],
      group: [
        "pair_id",
        sequelize.fn("DATE", sequelize.col("Orders.created_at")),
      ],
    });
    if (!rows) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, {
        count: 0,
        rows: [],
      });
    }
    return returnSuccess(null, RES_MSG?.COMMON.LIST, { count, rows });
  }
  /**
   * csv for total orders stats
   * @param filters
   * @returns
   */
  async dailyStatsTotalOrdersCsv(filters: any): Promise<any> {
    const limit = 100000;
    const page = 1;
    filters = { ...filters, ...{ limit, page } };
    const res = await this.dailyStatsTotalOrders(filters);
    if (res?.error) throw res;

    const hColumns = [
      { id: "sno", title: "S-no" },
      { id: "pair_name", title: "Pair" },
      { id: "total_buy", title: "Total Buy" },
      { id: "total_buy_usd", title: `Total Buy (${DEFAULT_CURRENCY})` },
      { id: "total_sell", title: "Total Sell" },
      { id: "total_sell_usd", title: `Total Sell (${DEFAULT_CURRENCY})` },
      { id: "transactions", title: "Transactions" },
      { id: "created_at", title: "Created At" },
    ];

    let resp: any = [];
    let i = 0;
    for (let row of res?.data?.rows) {
      row = row.dataValues;
      resp = [
        ...resp,
        {
          sno: ++i,
          pair_name: row?.pair_name,
          total_buy: `${row?.total_buy} ${row?.primary}`,
          total_buy_usd: row?.total_buy_usd,
          total_sell: `${row?.total_sell} ${row?.primary}`,
          total_sell_usd: row?.total_sell_usd,
          transactions: row?.transactions,
          created_at: row?.created_at,
        },
      ];
    }
    return { hColumns, records: resp };
  }
  /**
   * mysql view orders stats
   * @returns
   */
  async ordersStatsView(): Promise<any> {
    const result = await this.orderStatsView.findOne({
      attributes: [`total_buy`, `total_sell`],
    });
    return returnSuccess(null, RES_MSG?.COMMON.LIST, result);
  }
}
