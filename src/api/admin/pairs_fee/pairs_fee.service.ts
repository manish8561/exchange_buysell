import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { CreatePairsFeeDto } from "./dto/create-pairs_fee.dto";
import { UpdatePairsFeeDto } from "./dto/update-pairs_fee.dto";
import sequelize from "sequelize";
import { returnSuccess } from "src/common/util/response.handler";
import { RES_MSG } from "src/constants/message.constant";
import { PairsFee } from "src/common/base-model/entities/pairs_fee.entity";
import { FilterPairsFeeDto } from "./dto/filter-pairs_fee.dto";
import { Pairs } from "src/common/base-model/entities/pairs.entity";
import { MyService } from "src/common/redis/redis.service";
import { CurrencyMaster } from "src/common/base-model/entities/currency_master.entity";
import {
  BUY_SELL_TYPE,
  FEE_TYPE,
  IS_EXIST_MARKET,
  IS_YES_NO_ENUM,
} from "src/constants/enums";
import BigNumber from "bignumber.js";
import { RabbitMqService } from "src/common/rabbitMq/rabbit-mq/rabbit-mq.service";
import { convertTo8Decimals } from "src/common/util/utility";
import { BUFFER_PERCENTAGE_PAIR_FEE } from "src/constants";
@Injectable()
export class PairsFeeService {
  constructor(
    @Inject("PAIRS_FEE") private readonly pairsFeeResp: typeof PairsFee,
    @Inject("PAIRS") private readonly pairResp: typeof Pairs,
    private readonly redisService: MyService,
    private readonly rabbitmqService: RabbitMqService
  ) {}

  /**
   * insert row
   * @param createPairsFeeDto
   * @returns
   */
  async create(createPairsFeeDto: CreatePairsFeeDto) {
    //pair already exists
    const pair = await this.pairsFeeResp.count({
      where: {
        pair_id: sequelize.fn("UUID_TO_BIN", createPairsFeeDto.pair_id),
        type: createPairsFeeDto.type,
      },
    });
    if (pair > 0) {
      throw new Error(RES_MSG.PAIRS_FEE.EXISTS);
    }

    const row = await this.pairsFeeResp.create({
      id: sequelize.fn("UUID_TO_BIN", sequelize.fn("UUID")),
      pair_id: sequelize.fn("UUID_TO_BIN", createPairsFeeDto.pair_id),
      type: createPairsFeeDto.type,
      fee: createPairsFeeDto.fee,
      fee_type: createPairsFeeDto.fee_type,
      order_limit: createPairsFeeDto.order_limit,
      max_order_limit: createPairsFeeDto.max_order_limit,
      is_swap: createPairsFeeDto.is_swap,
      is_enable: IS_YES_NO_ENUM.YES,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return returnSuccess(null, RES_MSG?.COMMON.CREATE, row);
  }
  /**
   * list
   * @returns
   */
  async findAll({
    filter,
    is_enable,
    is_swap,
    pair_id,
    fee_type,
    type,
    limit,
    page,
    direction,
    column,
  }: FilterPairsFeeDto) {
    const query: any = {
      attributes: [
        [sequelize.fn("BIN_TO_UUID", sequelize.col("id")), "id"],
        [sequelize.fn("BIN_TO_UUID", sequelize.col("pair_id")), "pair_id"],
        [
          sequelize.literal(
            `(SELECT pair_name FROM pairs WHERE id = PairsFee.pair_id)`
          ),
          "pair_name",
        ],
        "type",
        "is_enable",
        "fee",
        "fee_type",
        "order_limit",
        "max_order_limit",
        "is_swap",
        "created_at",
        "updated_at",
      ],
    };
    //filters
    if (filter) {
      const filterObj: any = {
        [sequelize.Op.or]: [
          {
            type: filter,
          },
        ],
      };
      query.where = filterObj;
    }
    if (is_enable) {
      query.where = { ...query.where, is_enable };
    }
    if (is_swap !== undefined) {
      query.where = { ...query.where, is_swap };
    }
    if (pair_id) {
      query.where = {
        ...query.where,
        pair_id: sequelize.fn("UUID_TO_BIN", pair_id),
      };
    }
    if (fee_type) {
      query.where = { ...query.where, fee_type };
    }
    if (type) {
      query.where = { ...query.where, type };
    }
    // pagination
    if (!limit || limit <= 0) {
      limit = 10;
    }
    if (limit > 1000) {
      limit = 1000;
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
      query.order = [["createdAt", "DESC"]];
    }

    const { count, rows } = await this.pairsFeeResp.findAndCountAll<PairsFee>(
      query
    );
    if (!rows) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, {
        count: 0,
        rows: [],
      });
    }
    return returnSuccess(null, RES_MSG?.COMMON.LIST, { count, rows });
  }
  /**
   * single record
   * @param id
   * @returns
   */
  async findOne(id: string) {
    const row = await this.pairsFeeResp.findOne<PairsFee>({
      attributes: {
        exclude: ["id", "pair_id"],
        include: [
          [sequelize.fn("BIN_TO_UUID", sequelize.col("id")), "id"],
          [sequelize.fn("BIN_TO_UUID", sequelize.col("pair_id")), "pair_id"],
        ],
      },
      where: { id: sequelize.fn("UUID_TO_BIN", id) },
    });
    if (!row) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, row);
    }
    return returnSuccess(null, RES_MSG?.COMMON.VIEW, row);
  }
  /**
   * update single record
   * @param id
   * @param updatePairsFeeDto
   * @returns
   */
  async update(id: string, updatePairsFeeDto: UpdatePairsFeeDto) {
    const row = await this.pairsFeeResp.findOne<PairsFee>({
      where: { id: sequelize.fn("UUID_TO_BIN", id) },
    });

    if (!row) {
      throw new Error(RES_MSG.COMMON.NOT_FOUND);
    }
    // delete redis on change in pairs fee`pair_found_${primary_currency_id}_${secondary_currency_id}`;
    const pair = await this.pairResp.findOne({
      attributes: [
        [sequelize.fn("BIN_TO_UUID", sequelize.col("Pairs.id")), "id"],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("currency_id")),
          "currency_id",
        ],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("other_currency_id")),
          "other_currency_id",
        ],
        `pair_name`,
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
      where: { id: row.pair_id },
      include: [
        {
          model: CurrencyMaster,
          as: "other_currency",
          attributes: ["is_fiat_currency", "currency_symbol"],
        },
      ],
    });
    if (updatePairsFeeDto.type) row.type = updatePairsFeeDto.type;
    if (updatePairsFeeDto.fee !== undefined) row.fee = updatePairsFeeDto.fee;
    if (updatePairsFeeDto.order_limit !== undefined)
      row.order_limit = updatePairsFeeDto.order_limit;
    if (updatePairsFeeDto.max_order_limit !== undefined)
      row.max_order_limit = updatePairsFeeDto.max_order_limit;
    if (updatePairsFeeDto.fee_type) row.fee_type = updatePairsFeeDto.fee_type;
    if (updatePairsFeeDto.is_swap !== undefined)
      row.is_swap = updatePairsFeeDto.is_swap;
    //checking for pair exist in exchange
    if (pair.exist_in_market === IS_EXIST_MARKET.YES) {
      const exchangeSymbol = pair.exchange_pair_name;
      const resp = await this.rabbitmqService.getPairOrderLimitQueue(
        exchangeSymbol
      );
      if (resp.error) {
        throw new Error(resp.message);
      }
      const {
        data: { maximumOrderSize, minimumOrderSize },
      } = resp;
      let minimumLimit = new BigNumber(minimumOrderSize);
      let maximumLimit = new BigNumber(maximumOrderSize);
      // get price from pair table with markup/mark down
      let price = new BigNumber(pair.markup);
      if (row.type === BUY_SELL_TYPE.Sell) {
        price = new BigNumber(pair.markdown);
      }

      minimumLimit = minimumLimit.multipliedBy(price);
      maximumLimit = maximumLimit.multipliedBy(price);

      //calculating order limit according to fee type
      switch (row.fee_type) {
        case FEE_TYPE.Percentage:
          minimumLimit = minimumLimit.plus(
            minimumLimit.multipliedBy(row.fee).dividedBy(100)
          );
          maximumLimit = maximumLimit.plus(
            maximumLimit.multipliedBy(row.fee).dividedBy(100)
          );
          break;
        case FEE_TYPE.Flat:
          minimumLimit = minimumLimit.plus(row.fee);
          maximumLimit = maximumLimit.plus(row.fee);
          break;
      }
      //buffer implementation buffer_percentage_pair_fee
      let buffer_percentage = await this.redisService.get(
        "buffer_percentage_pair_fee"
      );
      if (buffer_percentage) {
        buffer_percentage = Number(buffer_percentage);
      } else {
        buffer_percentage = BUFFER_PERCENTAGE_PAIR_FEE;
      }

      minimumLimit = minimumLimit.plus(
        minimumLimit.multipliedBy(buffer_percentage).dividedBy(100)
      );
      maximumLimit = maximumLimit.minus(
        maximumLimit.multipliedBy(buffer_percentage).dividedBy(100)
      );
      const minLimit = convertTo8Decimals(minimumLimit);
      const maxLimit = convertTo8Decimals(maximumLimit);
      if (row.order_limit < minLimit) {
        throw new Error(RES_MSG.PAIRS_FEE.INCREASE_ERROR(minLimit));
      }
      if (row.max_order_limit > maxLimit) {
        throw new Error(RES_MSG.PAIRS_FEE.DECREASE_ERROR(maxLimit));
      }
    }
    // delete the pair_found key
    //buy
    this.redisService.delete(
      `pair_found_${pair.other_currency_id}_${pair.currency_id}`
    );
    //sell
    this.redisService.delete(
      `pair_found_${pair.currency_id}_${pair.other_currency_id}`
    );
    // optional fields

    row.is_enable = updatePairsFeeDto.is_enable;
    row.updatedAt = new Date();

    const result = await row.save();

    return returnSuccess(null, RES_MSG?.COMMON.UPDATE, result);
  }
  /**
   * delete single record
   * @param id
   * @returns
   */
  async remove(id: string) {
    const row = await this.pairsFeeResp.destroy<PairsFee>({
      where: { id: sequelize.fn("UUID_TO_BIN", id) },
    });
    if (!row || row < 1) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, row);
    }
    return returnSuccess(null, RES_MSG?.COMMON.DELETE, row);
  }
}
