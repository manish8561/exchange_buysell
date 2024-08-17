import { Controller, Get, Post, Param, Body, Response } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminAccess } from "src/api/auth/decorators/public.decorator";
import { AdminFiltersOrdersDto } from "./dto/admin-filters-orders.dto";

import {
  failResponse,
  returnError,
  successResponse,
} from "src/common/util/response.handler";

import { CSV_ERROR } from "src/constants/message.constant";
import createCSVFile from "src/common/helpers/generateCsv";
import { FeeReportFiltersDto } from "./dto/fee-reports-filters.dto";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from "@nestjs/microservices";
import { StatsFiltersOrdersDto } from "./dto/stats-filters-orders";
import { DailyStatsFiltersOrdersDto } from "./dto/dailystats-filters-orders";
@ApiBearerAuth()
@AdminAccess()
@ApiTags("admin")
@Controller("admin/orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async findAll(
    @Body() filters: AdminFiltersOrdersDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.ordersService.findAll(filters);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Post("csv")
  async findAllCsv(@Body() filters: any, @Response() response: any) {
    try {
      const limit = 100000;
      const page = 1;
      filters = { ...filters, ...{ limit, page } };

      const res = await this.ordersService.generate_csvFor(filters);
      const respData = await createCSVFile(res.records, res.hColumns);
      // send the csv file to the frontend for download

      if (!respData) throw returnError(true, CSV_ERROR);
      response.setHeader(
        "Content-Disposition",
        `attachment; filename=${respData.fileName}`
      );
      response.setHeader("Content-Type", "text/csv");
      return successResponse(respData?.message, respData.fileData, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  @Post("feereports")
  async feeReports(
    @Body() filters: FeeReportFiltersDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.ordersService.feeReports(filters);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  @Post("marketmakers")
  async marketMakerOrders(
    @Body() filters: AdminFiltersOrdersDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.ordersService.marketMakerOrders(filters);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  /**
   * total fee earned for admin service
   * @param data
   * @param context
   * @returns
   */
  @MessagePattern("total_fee_earned")
  async getTotalFeeEarned(
    @Payload() data: any,
    @Ctx() context: RmqContext
  ): Promise<any> {
    data = JSON.parse(data);
    // console.log("Message:", context.getMessage());
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
    // validation code
    return await this.ordersService.getTotalFeeEarned(data);
  }
  @Post("marketmakers-csv")
  async marketMakerOrdersCSV(@Body() filters: any, @Response() response: any) {
    try {
      const limit = 100000;
      const page = 1;
      filters = { ...filters, ...{ limit, page } };

      const res = await this.ordersService.marketMakerOrders_csvFor(filters);
      const respData = await createCSVFile(res.records, res.hColumns);
      // send the csv file to the frontend for download

      if (!respData) throw returnError(true, CSV_ERROR);
      response.setHeader(
        "Content-Disposition",
        `attachment; filename=${respData.fileName}`
      );
      response.setHeader("Content-Type", "text/csv");
      return successResponse(respData?.message, respData.fileData, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  @Post("feereports-csv")
  async feeReportsCsv(@Body() filters: any, @Response() response: any) {
    try {
      const limit = 100000;
      const page = 1;
      filters = { ...filters, ...{ limit, page } };

      const { records, hColumns } = await this.ordersService.feeReportsCsv(
        filters
      );

      const respData = await createCSVFile(records, hColumns);
      // send the csv file to the frontend for download

      if (!respData) throw returnError(true, CSV_ERROR);
      response.setHeader(
        "Content-Disposition",
        `attachment; filename=${respData.fileName}`
      );
      response.setHeader("Content-Type", "text/csv");
      return successResponse(respData?.message, respData.fileData, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  @Post("stats")
  async statsTotalOrders(
    @Body() filters: StatsFiltersOrdersDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.ordersService.statsTotalOrders(filters);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  @Post("stats-csv")
  async statsTotalOrdersCsv(@Body() filters: any, @Response() response: any) {
    try {
      const res = await this.ordersService.statsTotalOrdersCsv(filters);
      const respData = await createCSVFile(res.records, res.hColumns);
      // send the csv file to the frontend for download

      if (!respData) throw returnError(true, CSV_ERROR);
      response.setHeader(
        "Content-Disposition",
        `attachment; filename=${respData.fileName}`
      );
      response.setHeader("Content-Type", "text/csv");
      return successResponse(respData?.message, respData.fileData, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  @Post("dailystats")
  async dailyStatsTotalOrders(
    @Body() filters: DailyStatsFiltersOrdersDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.ordersService.dailyStatsTotalOrders(filters);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  @Post("dailystats-csv")
  async dailyStatsTotalOrdersCsv(
    @Body() filters: any,
    @Response() response: any
  ) {
    try {
      const res = await this.ordersService.dailyStatsTotalOrdersCsv(filters);
      const respData = await createCSVFile(res.records, res.hColumns);
      // send the csv file to the frontend for download

      if (!respData) throw returnError(true, CSV_ERROR);
      response.setHeader(
        "Content-Disposition",
        `attachment; filename=${respData.fileName}`
      );
      response.setHeader("Content-Type", "text/csv");
      return successResponse(respData?.message, respData.fileData, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  @Get("orders-stats-view")
  async ordersStatsView(@Response() response: any) {
    try {
      const result = await this.ordersService.ordersStatsView();
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
}
