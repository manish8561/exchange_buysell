import { Inject, Injectable } from "@nestjs/common";
import { CreateCurrencyMasterDto } from "./dto/create-currency_master.dto";
import { UpdateCurrencyMasterDto } from "./dto/update-currency_master.dto";
import { CurrencyMaster } from "src/common/base-model/entities/currency_master.entity";
import sequelize from "sequelize";
import { returnSuccess } from "src/common/util/response.handler";
import { RES_MSG } from "src/constants/message.constant";
import { CommonFitlerDto } from "src/common/dto/common-filter.dto";
import { IS_YES_NO_ENUM } from "src/constants/enums";
import { FilterCurrencyDropdownDto } from "./dto/filter-currency-dropdown.dto";

@Injectable()
export class CurrencyMasterService {
  constructor(
    @Inject("CURRENCY_MASTER") private currencyMasterResp: typeof CurrencyMaster
  ) {}
  /**
   * insert row
   * @param createCurrencyMasterDto
   * @returns
   */
  async create(createCurrencyMasterDto: CreateCurrencyMasterDto): Promise<any> {
    //checking symbol already exists
    const currency = await this.currencyMasterResp.count({
      where: {
        currency_symbol: createCurrencyMasterDto.currency_symbol.toUpperCase(),
        chain_id: createCurrencyMasterDto.chain_id,
      },
    });
    if (currency > 0) {
      throw new Error(RES_MSG.CURRENCY_MASTER.EXISTS);
    }
    // console.table(createCurrencyMasterDto);

    const row = await this.currencyMasterResp.create({
      id: sequelize.fn("UUID_TO_BIN", sequelize.fn("UUID")),
      currency_name: createCurrencyMasterDto.currency_name,
      currency_symbol: createCurrencyMasterDto.currency_symbol.toUpperCase(),
      is_erc20token: createCurrencyMasterDto.is_erc20token,
      is_fiat_currency: createCurrencyMasterDto.is_fiat_currency,
      token_abi: createCurrencyMasterDto.token_abi,
      token_address: createCurrencyMasterDto.token_address,
      smallest_unit: createCurrencyMasterDto.smallest_unit,
      exchange_price_per_usd: createCurrencyMasterDto.exchange_price_per_usd,
      decimals: createCurrencyMasterDto.decimals,
      logo: createCurrencyMasterDto.logo,
      chain_id: createCurrencyMasterDto.chain_id,
      is_active: IS_YES_NO_ENUM.YES,
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
    limit,
    page,
    direction,
    column,
  }: CommonFitlerDto) {
    const query: any = {
      attributes: {
        exclude: ["id"],
        include: [[sequelize.fn("BIN_TO_UUID", sequelize.col("id")), "id"]],
      },
    };
    //filters
    if (filter) {
      const filterObj: any = {
        [sequelize.Op.or]: [
          {
            currency_name: {
              [sequelize.Op.like]: `%${filter}%`,
            },
          },
          {
            currency_symbol: {
              [sequelize.Op.like]: `%${filter}%`,
            },
          },
        ],
      };
      query.where = filterObj;
    }
    if (is_enable) {
      query.where = { ...query.where, is_active: is_enable };
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
    const { count, rows } =
      await this.currencyMasterResp.findAndCountAll<CurrencyMaster>(query);
    if (!rows) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, {
        count: 0,
        rows: [],
      });
    }
    return returnSuccess(null, RES_MSG?.COMMON.LIST, { count, rows });
  }
  /**
   * active records
   * @returns
   */
  async getActiveCurrencies(filters: FilterCurrencyDropdownDto) {
    const query: any = { is_active: filters.is_active || IS_YES_NO_ENUM.YES };
    if (filters.is_fiat_currency !== undefined) {
      query.is_fiat_currency = filters.is_fiat_currency;
    }
    if (filters.is_erc20token) {
      query.is_erc20token = filters.is_erc20token;
    }
    if (filters.chain_id !== undefined) {
      query.chain_id = filters.chain_id;
    }

    const row = await this.currencyMasterResp.findAll<CurrencyMaster>({
      attributes: {
        exclude: ["id"],
        include: [[sequelize.fn("BIN_TO_UUID", sequelize.col("id")), "id"]],
      },
      where: query,
    });
    if (!row) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, row);
    }
    return returnSuccess(null, RES_MSG?.COMMON.VIEW, row);
  }
  /**
   * single record
   * @param id
   * @returns
   */
  async findOne(id: string) {
    const row = await this.currencyMasterResp.findOne<CurrencyMaster>({
      attributes: {
        exclude: ["id"],
        include: [[sequelize.fn("BIN_TO_UUID", sequelize.col("id")), "id"]],
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
   * @param updateCurrencyMasterDto
   * @returns
   */

  async update(id: string, updateCurrencyMasterDto: UpdateCurrencyMasterDto) {
    const row = await this.currencyMasterResp.findOne<CurrencyMaster>({
      where: { id: sequelize.fn("UUID_TO_BIN", id) },
    });
    if (!row) {
      throw new Error("Record not found.");
    }
    // optional fields
    if (updateCurrencyMasterDto.currency_name)
      row.currency_name = updateCurrencyMasterDto.currency_name;
    if (updateCurrencyMasterDto.currency_symbol)
      row.currency_symbol =
        updateCurrencyMasterDto.currency_symbol.toUpperCase();
    if (updateCurrencyMasterDto.is_erc20token)
      row.is_erc20token = updateCurrencyMasterDto.is_erc20token;
    if (updateCurrencyMasterDto.is_fiat_currency !== undefined)
      row.is_fiat_currency = updateCurrencyMasterDto.is_fiat_currency;
    if (updateCurrencyMasterDto.token_abi)
      row.token_abi = updateCurrencyMasterDto.token_abi;
    if (updateCurrencyMasterDto.token_address)
      row.token_address = updateCurrencyMasterDto.token_address;
    if (updateCurrencyMasterDto.smallest_unit !== undefined)
      row.smallest_unit = updateCurrencyMasterDto.smallest_unit;
    if (updateCurrencyMasterDto.exchange_price_per_usd !== undefined)
      row.exchange_price_per_usd =
        updateCurrencyMasterDto.exchange_price_per_usd;
    if (updateCurrencyMasterDto.decimals !== undefined)
      row.decimals = updateCurrencyMasterDto.decimals;
    if (updateCurrencyMasterDto.logo) row.logo = updateCurrencyMasterDto.logo;
    if (updateCurrencyMasterDto.chain_id !== undefined)
      row.chain_id = updateCurrencyMasterDto.chain_id;

    row.is_active = updateCurrencyMasterDto.is_active;
    row.updatedAt = new Date();

    await row.save();

    return returnSuccess(null, RES_MSG?.COMMON.UPDATE, { id });
  }
  /**
   * delete single record
   * @param id
   * @returns
   */
  async remove(id: string) {
    const row = await this.currencyMasterResp.destroy<CurrencyMaster>({
      where: { id: sequelize.fn("UUID_TO_BIN", id) },
    });
    if (!row || row < 1) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, row);
    }
    return returnSuccess(null, RES_MSG?.COMMON.DELETE, row);
  }
}
