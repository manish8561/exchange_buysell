import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { CreatePairDto } from "./dto/create-pair.dto";
import { UpdatePairDto } from "./dto/update-pair.dto";
import { Pairs } from "src/common/base-model/entities/pairs.entity";
import sequelize from "sequelize";
import { returnSuccess } from "src/common/util/response.handler";
import { RES_MSG } from "src/constants/message.constant";
import { FiltersPairsDto } from "./dto/filters-pair.dto";
import { IS_EXIST_MARKET, IS_YES_NO_ENUM } from "src/constants/enums";
import { MyService } from "src/common/redis/redis.service";
import BigNumber from "bignumber.js";
import { RabbitMqService } from "src/common/rabbitMq/rabbit-mq/rabbit-mq.service";
import { convertTo8Decimals } from "src/common/util/utility";
import { DEFAULT_CURRENCY, DEFAULT_EXCHANGE_CURRENCY } from "src/constants";
import { CurrencyMaster } from "src/common/base-model/entities/currency_master.entity";

@Injectable()
export class PairsService {
  constructor(
    @Inject("PAIRS") private readonly pairResp: typeof Pairs,
    @Inject("CURRENCY_MASTER")
    private readonly currencyMasterResp: typeof CurrencyMaster,
    private readonly redisService: MyService,
    private readonly rabbitmqService: RabbitMqService
  ) {}

  /**
   * insert row
   * @param createPairsDto
   * @returns
   */
  async create(createPairDto: CreatePairDto) {
    // console.table(createPairDto);
    //pair already exists
    const pair = await this.pairResp.count({
      where: {
        currency_id: sequelize.fn("UUID_TO_BIN", createPairDto.currency_id),
        other_currency_id: sequelize.fn(
          "UUID_TO_BIN",
          createPairDto.other_currency_id
        ),
        chain_id: createPairDto.chain_id,
      },
    });
    if (pair > 0) {
      throw new Error(RES_MSG.PAIRS.EXISTS);
    }
    let markup = new BigNumber(createPairDto.reference_price),
      markdown = new BigNumber(createPairDto.reference_price);
    markup = markup.plus(
      markup.multipliedBy(createPairDto.markup_percentage).dividedBy(100)
    );
    markdown = markdown.plus(
      markdown.multipliedBy(createPairDto.markdown_percentage).dividedBy(100)
    );

    const row = await this.pairResp.create({
      id: sequelize.fn("UUID_TO_BIN", sequelize.fn("UUID")),
      currency_id: sequelize.fn("UUID_TO_BIN", createPairDto.currency_id),
      other_currency_id: sequelize.fn(
        "UUID_TO_BIN",
        createPairDto.other_currency_id
      ),
      pair_name: createPairDto.pair_name.toUpperCase(),
      exist_in_market: createPairDto.exist_in_market,
      reference_price: createPairDto.reference_price,
      markup_percentage: createPairDto.markup_percentage,
      markdown_percentage: createPairDto.markdown_percentage,
      markup: markup.toNumber(),
      markdown: markdown.toNumber(),
      exchange_pair: createPairDto.exchange_pair,
      exchange_pair_name: createPairDto.exchange_pair_name,
      is_swap: createPairDto.is_swap,
      chain_id: createPairDto.chain_id,
      active_status: createPairDto.active_status,
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
    pair_id,
    filter,
    is_enable,
    is_swap,
    limit,
    page,
    direction,
    column,
    chain_id,
  }: FiltersPairsDto) {
    const query: any = {
      attributes: [
        [sequelize.fn("BIN_TO_UUID", sequelize.col("id")), "id"],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("currency_id")),
          "currency_id",
        ],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("other_currency_id")),
          "other_currency_id",
        ],
        "pair_name",
        "created_at",
        "updated_at",
        "exist_in_market",
        "is_enable",
        "reference_price",
        "markup_percentage",
        "markdown_percentage",
        "markup",
        "markdown",
        "exchange_pair",
        "exchange_pair_name",
        "is_swap",
        "active_status",
      ],
    };
    //filters
    let filterObj: any;
    if (filter) {
      filterObj = {
        [sequelize.Op.or]: [
          {
            pair_name: {
              [sequelize.Op.like]: `%${filter}%`,
            },
          },
        ],
      };
      query.where = filterObj;
    }
    if (pair_id) {
      query.where = {
        ...query.where,
        id: sequelize.fn("UUID_TO_BIN", pair_id),
      };
    }
    if (is_swap !== undefined) {
      query.where = { ...query.where, is_swap };
    }
    if (is_enable) {
      query.where = { ...query.where, is_enable };
    }
    if (chain_id !== undefined) {
      query.where = { ...query.where, chain_id };
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
    const { count, rows } = await this.pairResp.findAndCountAll<Pairs>(query);
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
    const row = await this.pairResp.findOne<Pairs>({
      attributes: {
        exclude: ["id", "currency_id", "other_currency_id"],
        include: [
          [sequelize.fn("BIN_TO_UUID", sequelize.col("id")), "id"],
          [
            sequelize.fn("BIN_TO_UUID", sequelize.col("currency_id")),
            "currency_id",
          ],
          [
            sequelize.fn("BIN_TO_UUID", sequelize.col("other_currency_id")),
            "other_currency_id",
          ],
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
   * @param updatePairsDto
   * @returns
   */
  async update(id: string, updatePairsDto: UpdatePairDto) {
    const row = await this.pairResp.findOne<Pairs>({
      attributes: [
        `id`,
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("currency_id")),
          "currency_id",
        ],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("other_currency_id")),
          "other_currency_id",
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
      where: { id: sequelize.fn("UUID_TO_BIN", id) },
    });

    if (!row) {
      throw new Error(RES_MSG.COMMON.NOT_FOUND);
    }
    // delete the pair_found key
    //buy
    this.redisService.delete(
      `pair_found_${row.other_currency_id}_${row.currency_id}`
    );
    //sell
    this.redisService.delete(
      `pair_found_${row.currency_id}_${row.other_currency_id}`
    );
    // optional fields
    if (updatePairsDto.exist_in_market !== undefined)
      row.exist_in_market = updatePairsDto.exist_in_market;
    if (updatePairsDto.reference_price !== undefined)
      row.reference_price = updatePairsDto.reference_price;
    if (updatePairsDto.markup_percentage !== undefined)
      row.markup_percentage = updatePairsDto.markup_percentage;
    if (updatePairsDto.markdown_percentage !== undefined)
      row.markdown_percentage = updatePairsDto.markdown_percentage;

    let markup = new BigNumber(updatePairsDto.reference_price),
      markdown = new BigNumber(updatePairsDto.reference_price);
    markup = markup.plus(
      markup.multipliedBy(updatePairsDto.markup_percentage).dividedBy(100)
    );
    markdown = markdown.plus(
      markdown.multipliedBy(updatePairsDto.markdown_percentage).dividedBy(100)
    );
    row.markup = markup.toNumber();
    row.markdown = markdown.toNumber();

    if (updatePairsDto.exchange_pair)
      row.exchange_pair = updatePairsDto.exchange_pair;
    if (updatePairsDto.exchange_pair_name)
      row.exchange_pair_name = updatePairsDto.exchange_pair_name;
    if (updatePairsDto.active_status !== undefined)
      row.active_status = updatePairsDto.active_status;
    if (updatePairsDto.is_swap !== undefined)
      row.is_swap = updatePairsDto.is_swap;
    if (updatePairsDto.chain_id !== undefined)
      row.chain_id = updatePairsDto.chain_id;
    row.is_enable = updatePairsDto.is_enable;
    row.updatedAt = new Date();

    const result = await row.save();
    await this.updatePairsPrice();

    return returnSuccess(null, RES_MSG?.COMMON.UPDATE, result);
  }
  /**
   * delete single record
   * @param id
   * @returns
   */
  async remove(id: string) {
    const row = await this.pairResp.destroy<Pairs>({
      where: { id: sequelize.fn("UUID_TO_BIN", id) },
    });
    if (!row || row < 1) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, row);
    }
    return returnSuccess(null, RES_MSG?.COMMON.DELETE, row);
  }

  /**
   * send active pairs to queue for liquidity service
   * @returns
   */
  async getActivePairs(): Promise<any> {
    let pairs = await this.redisService.get("active_pairs");
    if (pairs) {
      return JSON.parse(pairs);
    }

    pairs = await this.pairResp.findAll({
      attributes: [
        [sequelize.fn("BIN_TO_UUID", sequelize.col("id")), "id"],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("currency_id")),
          "currency_id",
        ],
        [
          sequelize.fn("BIN_TO_UUID", sequelize.col("other_currency_id")),
          "other_currency_id",
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
      where: { is_enable: IS_YES_NO_ENUM.YES },
    });
    //keep in the cache for 10 minutes
    this.redisService.set("active_pairs", JSON.stringify(pairs), 10 * 60);
    return pairs;
  }
  /**
   * get admin pair for conversion
   * @param pair
   * @returns
   */
  async getAdminPairConversionPrice(pair: string): Promise<any> {
    let result = await this.redisService.get(pair);
    let amount = new BigNumber(0);
    let buyPrice = new BigNumber(0),
      sellPrice = new BigNumber(0);
    if (result) {
      result = JSON.parse(result);
    } else {
      result = await this.rabbitmqService.getCoinPriceAdmin({
        pair,
      });
      if (result.status === HttpStatus.OK) {
        result = result.data;
      } else {
        console.log(result.message);
      }
    }
    if (!result.amount) {
      throw new Error("Amount is undefined");
    }
    amount = new BigNumber(result.amount);
    //buy
    buyPrice = amount.plus(amount.multipliedBy(result.markup).dividedBy(100));
    //sell
    sellPrice = amount.minus(
      amount.multipliedBy(result.markdown).dividedBy(100)
    );
    return {
      buyPrice: convertTo8Decimals(buyPrice),
      sellPrice: convertTo8Decimals(sellPrice),
    };
  }

  /**
   * updating the price in the db
   */
  async updatePairsPrice(): Promise<void> {
    const pairs = await this.pairResp.findAll({
      where: {
        is_enable: IS_YES_NO_ENUM.YES,
      },
    });
    for (const p of pairs) {
      try {
        let reference_price = new BigNumber(0);
        if (p.exist_in_market === IS_EXIST_MARKET.YES) {
          console.log(p.exchange_pair_name);

          const is_swap = p.is_swap;
          const exchangeSymbol = p.exchange_pair_name;
          // from redis
          let prices = await this.redisService.getValue(
            "pair_price",
            exchangeSymbol
          );
          if (prices) {
            reference_price = new BigNumber(prices);
          } else {
            //from liquidity queue for price
            try {
              const res = await this.rabbitmqService.sendToPairPriceQueue({
                pair: exchangeSymbol,
              });

              if (res.status === HttpStatus.OK && res.data) {
                prices = res.data;
                reference_price = new BigNumber(res.data);
              } else {
                //skip for error
                continue;
              }
            } catch (error) {
              console.log("Price from liquidity error", error);
              continue;
            }
          }
          if (is_swap) {
            //swap pairs
            //actual price from exchange
            p.reference_price = reference_price.toNumber();
            //markup price for currency
            const markup = reference_price.plus(
              reference_price.multipliedBy(p.markup_percentage).dividedBy(100)
            );
            //markdown price for currency
            const markdown = reference_price.minus(
              reference_price.multipliedBy(p.markdown_percentage).dividedBy(100)
            );
            p.markup = markup.toNumber();
            p.markdown = markdown.toNumber();
          } else {
            // pair with fiat
            const currency_pair = `${DEFAULT_EXCHANGE_CURRENCY}-${DEFAULT_CURRENCY}`;

            //fiat currency conversion from admin service object
            const { buyPrice, sellPrice } =
              await this.getAdminPairConversionPrice(currency_pair);

            //actual price from exchange
            p.reference_price = reference_price.toNumber();
            const exchange_reference_price = reference_price;
            //markup price for currency
            reference_price = exchange_reference_price.multipliedBy(buyPrice);
            const markup = reference_price.plus(
              reference_price.multipliedBy(p.markup_percentage).dividedBy(100)
            );
            //markdown price for currency
            reference_price = exchange_reference_price.multipliedBy(sellPrice);
            const markdown = reference_price.minus(
              reference_price.multipliedBy(p.markdown_percentage).dividedBy(100)
            );
            p.markup = markup.toNumber();
            p.markdown = markdown.toNumber();
          }
        } else {
          // market maker
          reference_price = new BigNumber(p.reference_price);
          const markup = reference_price.plus(
            reference_price.multipliedBy(p.markup_percentage).dividedBy(100)
          );
          const markdown = reference_price.minus(
            reference_price.multipliedBy(p.markdown_percentage).dividedBy(100)
          );
          p.markup = markup.toNumber();
          p.markdown = markdown.toNumber();
        }
        p.save();
      } catch (error) {
        console.log("Pair Price update error:", error);
        continue;
      }
    }
  }
  /**
   * get all market maker pairs
   * @returns
   */
  async marketMakerFindAll() {
    const query: any = {
      attributes: [
        [sequelize.fn("BIN_TO_UUID", sequelize.col("id")), "id"],
        "pair_name",
        "exist_in_market",
        "is_enable",
        "exchange_pair",
        "exchange_pair_name",
        "is_swap",
        "active_status",
      ],
      where: {
        is_enable: IS_YES_NO_ENUM.YES,
        exist_in_market: IS_EXIST_MARKET.NO,
      },
    };

    const result = await this.pairResp.findAll<Pairs>(query);
    if (!result) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, []);
    }
    return returnSuccess(null, RES_MSG?.COMMON.LIST, result);
  }

  /**
   * update status with queue
   * @param param0
   * @returns
   */
  async updateCurrencyStatus({ coin, status, chain_id }: any) {
    const row = await this.currencyMasterResp.findOne<CurrencyMaster>({
      where: {
        currency_symbol: {
          [sequelize.Op.like]: `%${coin}%`,
        },
        chain_id,
      },
    });
    if (!row) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, row);
    }
    if (status === IS_YES_NO_ENUM.YES) {
      row.is_active = IS_YES_NO_ENUM.YES;
    } else {
      row.is_active = IS_YES_NO_ENUM.NO;
    }
    row.save();
    // update the coin in pair primary id
    await this.pairResp.update<Pairs>(
      { is_enable: status },
      {
        where: {
          chain_id,
          currency_id: row.id,
        },
      }
    );
    // update secondary id
    await this.pairResp.update<Pairs>(
      { is_enable: status },
      {
        where: {
          chain_id,
          other_currency_id: row.id,
        },
      }
    );
    return returnSuccess(null, RES_MSG?.COMMON.UPDATE, { coin });
  }

  /**
   * update status with queue
   * @param param0
   * @returns
   */
  async disableAllEnableAllCoins({ status }: any) {
    //disable in currency master
    let res = await this.currencyMasterResp.update(
      { is_active: status },
      {
        where: {},
      }
    );
    //disable in pairs
    res = await this.pairResp.update(
      { is_enable: status },
      {
        where: {},
      }
    );
    return returnSuccess(null, RES_MSG?.COMMON.UPDATE, { res });
  }
}
