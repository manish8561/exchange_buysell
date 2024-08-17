import { Inject, Injectable } from "@nestjs/common";
import { FiltersOrdersDto } from "./dto/filters-order.dto";
import { ApiResponse } from "src/common/global/interface";
import { returnSuccess } from "src/common/util/response.handler";
import { Orders } from "src/common/base-model/entities/orders.entity";
import { RES_MSG } from "src/constants/message.constant";
import sequelize from "sequelize";
import { Pairs } from "src/common/base-model/entities/pairs.entity";
import * as moment from "moment";
import { CurrencyMaster } from "src/common/base-model/entities/currency_master.entity";
import { REQUEST } from "@nestjs/core";
import { IS_SWAP } from "src/constants/enums";

@Injectable()
export class OrdersService {
  constructor(
    @Inject("Orders") private readonly ordersResp: typeof Orders,
    @Inject("CURRENCY_MASTER")
    private readonly currencyMasterResp: typeof CurrencyMaster,
    @Inject(REQUEST) private readonly request: any
  ) {}
  /**
   * get order for user
   * @param filtersOrdersDto
   * @returns
   */
  async findAll({
    filter,
    page,
    limit,
    direction,
    column,
    order_type,
    is_swap,
    coin,
    from,
    to,
    is_market_maker,
  }: FiltersOrdersDto): Promise<ApiResponse> {
    const user = this.request?.user;
    if (!user) {
      throw new Error(RES_MSG.USERS.NOT_FOUND);
    }
    let query: any = {
      attributes: [
        [sequelize.fn("BIN_TO_UUID", sequelize.col("Orders.id")), "id"],
        // [sequelize.fn("BIN_TO_UUID", sequelize.col("member_id")), "member_id"],
        // [sequelize.fn("BIN_TO_UUID", sequelize.col("pair_id")), "pair_id"],
        // [
        //   sequelize.fn("BIN_TO_UUID", sequelize.col("primary_currency_id")),
        //   "primary_currency_id",
        // ],
        // [
        //   sequelize.fn("BIN_TO_UUID", sequelize.col("secondary_currency_id")),
        //   "secondary_currency_id",
        // ],
        // [
        //   sequelize.fn("BIN_TO_UUID", sequelize.col("market_maker_id")),
        //   "market_maker_id",
        // ],
        `order_type`,
        // `email`,
        // `country`,
        `order_status`,
        // `is_processed`,
        `created_at`,
        `updated_at`,
        `type`,
        `is_swap`,
        // `is_market_maker`,
        // `chain_id`,
        `order_qty`,
        `qty`,
        // `markupdown_qty`,
        `fee_in_qty`,
        `total_price`,
        // `actual_total_price`,
        // `actual_price`,
        `markupdown_price`,
        `fee`,
        `markupdown_fee`,
        // `markupdown_fee_in_qty`,
        // `per_price_usd`,
        // `qty_in_usd`,
        // `fee_in_usd`,
        // `markupdown_price_in_usd`,
        // `markupdown_fee_in_usd`,
        // `total_price_usd`,
        [sequelize.literal("`pair`.`pair_name`"), "pair_name"],
        [sequelize.literal("`primary_currency`.`currency_symbol`"), "primary"],
        [
          sequelize.literal("`secondary_currency`.`currency_symbol`"),
          "secondary",
        ],
      ],
    };
    //filters
    //user filter for his orders
    query.where = {
      member_id: sequelize.fn("UUID_TO_BIN", user.id),
    };
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
      query.where = { ...query, filterObj };
    }
    if (is_swap !== undefined) {
      query.where = { ...query.where, is_swap };
    }
    if (is_market_maker !== undefined) {
      query.where = { ...query.where, is_market_maker };
    }
    if (order_type) {
      query.where = { ...query.where, order_type, is_swap: IS_SWAP.NO };
    }

    if (coin) {
      const coinData = await this.currencyMasterResp.findOne({
        where: {
          currency_symbol: {
            [sequelize.Op.like]: `%${coin}%`,
          },
        },
      });
      // for buy or sell id applicable on primary_currency_id
      query.where = {
        ...query.where,
        primary_currency_id: coinData.id,
        // [sequelize.Op.or]: [
        //   { primary_currency_id: coinData.id },
        //   { secondary_currency_id: coinData.id },
        // ],
      };
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
    //adding joins
    query = {
      ...query,
      include: [
        { model: Pairs, as: "pair", attributes: [] },
        {
          model: CurrencyMaster,
          as: "primary_currency",
          attributes: [],
        },
        {
          model: CurrencyMaster,
          as: "secondary_currency",
          attributes: [],
        },
      ],
    };
    const rows = await this.ordersResp.findAll<Orders>(query);
    if (!rows) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, {
        count: 0,
        rows: [],
      });
    }
    return returnSuccess(null, RES_MSG?.COMMON.LIST, { rows, count });
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }
}
