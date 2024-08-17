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
import { CurrencyMasterService } from "./currency_master.service";
import { CreateCurrencyMasterDto } from "./dto/create-currency_master.dto";
import { UpdateCurrencyMasterDto } from "./dto/update-currency_master.dto";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  failResponse,
  successResponse,
} from "src/common/util/response.handler";
import { CommonFitlerDto } from "src/common/dto/common-filter.dto";
import { FilterCurrencyDropdownDto } from "./dto/filter-currency-dropdown.dto";
import { AdminAccess, Public } from "src/api/auth/decorators/public.decorator";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from "@nestjs/microservices";
@ApiBearerAuth()
@AdminAccess()
@ApiTags("admin")
@Controller("admin/currency-master")
export class CurrencyMasterController {
  constructor(private readonly currencyMasterService: CurrencyMasterService) {}

  @Post()
  async create(
    @Body() createCurrencyMasterDto: CreateCurrencyMasterDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.currencyMasterService.create(
        createCurrencyMasterDto
      );
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  @Get()
  @ApiOperation({ summary: "Get a list of records" })
  async findAll(
    @Query() data: CommonFitlerDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.currencyMasterService.findAll(data);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  @Get("active")
  async getActiveCurrencies(
    @Query() data: FilterCurrencyDropdownDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.currencyMasterService.getActiveCurrencies(data);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Response() response: Response) {
    try {
      const result = await this.currencyMasterService.findOne(id);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateCurrencyMasterDto: UpdateCurrencyMasterDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.currencyMasterService.update(
        id,
        updateCurrencyMasterDto
      );
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Response() response: Response) {
    try {
      const result = await this.currencyMasterService.remove(id);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
}
