import { Inject, Injectable } from "@nestjs/common";
import { CreateSettingDto } from "./dto/create-setting.dto";
import { UpdateSettingDto } from "./dto/update-setting.dto";
import sequelize from "sequelize";
import { Settings } from "src/common/base-model/entities/settings.entity";
import { returnSuccess } from "src/common/util/response.handler";
import { RES_MSG } from "src/constants/message.constant";
import { CommonFitlerDto } from "src/common/dto/common-filter.dto";
import { BUY_SELL_LIMITS } from "src/constants";
import { MyService } from "src/common/redis/redis.service";

@Injectable()
export class SettingsService {
  constructor(
    @Inject("Settings") private readonly settingsResp: typeof Settings,
    private readonly redisService: MyService
  ) {}
  /**
   * insert row
   * @param createSettingDto
   * @returns
   */
  async create(createSettingDto: CreateSettingDto) {
    const row = await this.settingsResp.create({
      sid: sequelize.fn("UUID_TO_BIN", sequelize.fn("UUID")),
      name: createSettingDto.name,
      duration: createSettingDto.duration,
      bs_limit: createSettingDto.bs_limit,
      level: createSettingDto.level,
      type: createSettingDto.type,
      is_active: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return returnSuccess(null, RES_MSG?.COMMON.CREATE, row);
  }
  /**
   * list
   * @returns
   */
  async findAll({ filter, limit, page, direction, column }: CommonFitlerDto) {
    const query: any = {
      attributes: [
        [sequelize.fn("BIN_TO_UUID", sequelize.col("sid")), "sid"],
        "name",
        "duration",
        "bs_limit",
        "level",
        "created_at",
        "updated_at",
        "type",
        "is_active",
      ],
    };
    if (filter) {
      const filterObj: any = {
        [sequelize.Op.or]: [
          {
            name: {
              [sequelize.Op.like]: `%${filter}%`,
            },
          },
        ],
      };
      query.where = filterObj;
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
      query.order = [["createdAt", "ASC"]];
    }
    const { count, rows } = await this.settingsResp.findAndCountAll<Settings>(
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
    const row = await this.settingsResp.findOne<Settings>({
      attributes: {
        exclude: ["sid"],
        include: [[sequelize.fn("BIN_TO_UUID", sequelize.col("sid")), "sid"]],
      },
      where: { sid: sequelize.fn("UUID_TO_BIN", id) },
    });
    if (!row) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, row);
    }
    return returnSuccess(null, RES_MSG?.COMMON.VIEW, row);
  }
  /**
   * update single record
   * @param id
   * @param updateSettingsDto
   * @returns
   */
  async update(id: string, updateSettingDto: UpdateSettingDto) {
    const row = await this.settingsResp.findOne<Settings>({
      where: { sid: sequelize.fn("UUID_TO_BIN", id) },
    });

    if (!row) {
      throw new Error(RES_MSG.COMMON.NOT_FOUND);
    }
    // optional fields
    if (updateSettingDto.name && updateSettingDto.name !== "")
      row.name = updateSettingDto.name;
    if (updateSettingDto.duration && updateSettingDto.duration !== "")
      row.duration = updateSettingDto.duration;
    if (updateSettingDto.bs_limit && updateSettingDto.bs_limit !== "")
      row.bs_limit = updateSettingDto.bs_limit;
    if (updateSettingDto.level !== undefined)
      row.level = updateSettingDto.level;
    if (updateSettingDto.type !== undefined) row.type = updateSettingDto.type;
    if (updateSettingDto.is_active !== undefined)
      row.is_active = updateSettingDto.is_active;

    row.updatedAt = new Date();

    const result = await row.save();
    this.redisService.delete(BUY_SELL_LIMITS);
    return returnSuccess(null, RES_MSG?.COMMON.UPDATE, result);
  }
  /**
   * delete single record
   * @param id
   * @returns
   */
  async remove(id: string) {
    const row = await this.settingsResp.destroy<Settings>({
      where: { sid: sequelize.fn("UUID_TO_BIN", id) },
    });
    if (!row || row < 1) {
      return returnSuccess(null, RES_MSG?.COMMON.NOT_FOUND, row);
    }
    return returnSuccess(null, RES_MSG?.COMMON.DELETE, row);
  }
}
