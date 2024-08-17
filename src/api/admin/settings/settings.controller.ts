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
import { SettingsService } from "./settings.service";
import { CreateSettingDto } from "./dto/create-setting.dto";
import { UpdateSettingDto } from "./dto/update-setting.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminAccess, Public } from "src/api/auth/decorators/public.decorator";
import {
  failResponse,
  successResponse,
} from "src/common/util/response.handler";
import { CommonFitlerDto } from "src/common/dto/common-filter.dto";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from "@nestjs/microservices";
import { BUY_SELL_LIMITS } from "../../../constants";

@AdminAccess()
@ApiBearerAuth()
@ApiTags("admin")
@Controller("admin/settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  async create(
    @Body() createSettingDto: CreateSettingDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.settingsService.create(createSettingDto);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Get()
  async findAll(
    @Query() data: CommonFitlerDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.settingsService.findAll(data);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Response() response: Response) {
    try {
      const result = await this.settingsService.findOne(id);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.settingsService.update(id, updateSettingDto);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Response() response: Response) {
    try {
      const result = await this.settingsService.remove(id);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  /*
   * Consumer for buy-sell limits queue !...
   * @param data
   * @param context
   * @returns
   */
  @Public()
  @MessagePattern(BUY_SELL_LIMITS)
  async updateWithdrawRequestStatusQueue(
    @Payload() data: any,
    @Ctx() context: RmqContext
  ): Promise<any> {
    data = JSON.parse(data);
    console.log("buy_sell_limits_queue consumer ");
    console.log(`Pattern: ${context.getPattern()}`);
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
    const res: any = await this.settingsService.findAll(data);
    return res;
  }
}
