import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Response,
  Query,
} from "@nestjs/common";
import { PairsService } from "./pairs.service";
import { CreatePairDto } from "./dto/create-pair.dto";
import { UpdatePairDto } from "./dto/update-pair.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  failResponse,
  returnError,
  successResponse,
} from "src/common/util/response.handler";
import { AdminAccess, Public } from "src/api/auth/decorators/public.decorator";
import { FiltersPairsDto } from "./dto/filters-pair.dto";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from "@nestjs/microservices";
import createCSVFile from "src/common/helpers/generateCsv";

import { CSV_ERROR } from "src/constants/message.constant";
@ApiBearerAuth()
@AdminAccess()
@ApiTags("admin")
@Controller("admin/pairs")
export class PairsController {
  constructor(private readonly pairsService: PairsService) {}

  @Post()
  async create(
    @Body() createPairDto: CreatePairDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.pairsService.create(createPairDto);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  @Get()
  async findAll(
    @Query() data: FiltersPairsDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.pairsService.findAll(data);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  @Get("marketmaker")
  async marketMakerFindAll(@Response() response: Response) {
    try {
      const result = await this.pairsService.marketMakerFindAll();
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Response() response: Response) {
    try {
      const result = await this.pairsService.findOne(id);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updatePairDto: UpdatePairDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.pairsService.update(id, updatePairDto);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Response() response: Response) {
    try {
      const result = await this.pairsService.remove(id);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  /**
   * get active pairs for liquidity service
   * @param data
   * @param context
   * @returns
   */
  @Public()
  @MessagePattern("active_pairs")
  async getActivePairs(
    @Payload() data: any,
    @Ctx() context: RmqContext
  ): Promise<any> {
    // console.log("Message:", context.getMessage());
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
    // validation code
    return await this.pairsService.getActivePairs();
  }

  @Get("list/csv")
  async findAllCsv(@Query() data: any, @Response() response: any) {
    try {
      data = { ...data, limit: 100000, page: 1 };
      let records = [];
      const res = await this.pairsService.findAll(data);
      if (res?.error) throw res;
      if (res?.data?.rows) {
        records = await this.getFilterPairsList(res?.data?.rows);
      }

      const hColumns = [
        { id: "S-no", title: "S-no" },
        { id: "Pair", title: "Currency pair" },
        { id: "Reference price", title: "Reference price" },
        { id: "Markup percentage", title: "Markup (%)" },
        { id: "Markdown percentage", title: "Markdown (%)" },
        { id: "Markup", title: "Bid Price" },
        { id: "Markdown", title: "Ask Price" },
        { id: "Status", title: "Status" },
      ];

      const respData = await createCSVFile(records, hColumns);
      // send the csv file to the frontend for download

      if (!respData) throw returnError(true, CSV_ERROR);
      response.setHeader(
        "Content-Disposition",
        `attachment; filename=${respData.fileName}`
      );
      response.setHeader("Content-Type", "text/csv");
      return successResponse(res?.message, respData.fileData, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  /**
   * getFilterPairsList
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
          Pair: row.pair_name,
          "Reference price": row.reference_price,
          "Markup percentage": row?.markup_percentage,
          "Markdown percentage": row?.markdown_percentage,
          Markup: row?.markup,
          Markdown: row?.markdown,
          Status: row?.is_enable == "NO" ? "Inactive" : "Active",
        },
      ];
    }
    return resp;
  }
  /**
   * disable single coin from admin service
   * @param data
   * @param context
   * @returns
   */
  @MessagePattern("buy_sell_coin_active")
  async disableSingleCoinPair(
    @Payload() data: any,
    @Ctx() context: RmqContext
  ): Promise<any> {
    data = JSON.parse(data);
    console.log("Message:buy_sell_coin_active", context.getMessage(), data);
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
    // validation code
    return await this.pairsService.updateCurrencyStatus(data);
  }
  /**
   * disable all from admin service
   * @param data
   * @param context
   * @returns
   */
  @MessagePattern("buy_sell_all_coins_enable_disable")
  async disableAllEnableAllCoins(
    @Payload() data: any,
    @Ctx() context: RmqContext
  ): Promise<any> {
    data = JSON.parse(data);
    // console.log("Message:", context.getMessage());
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
    // validation code
    return await this.pairsService.disableAllEnableAllCoins(data);
  }
}
