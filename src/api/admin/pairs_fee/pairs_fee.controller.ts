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
import { PairsFeeService } from "./pairs_fee.service";
import { CreatePairsFeeDto } from "./dto/create-pairs_fee.dto";
import { UpdatePairsFeeDto } from "./dto/update-pairs_fee.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  failResponse,
  successResponse,
} from "src/common/util/response.handler";
import { AdminAccess } from "src/api/auth/decorators/public.decorator";
import { FilterPairsFeeDto } from "./dto/filter-pairs_fee.dto";
@ApiBearerAuth()
@AdminAccess()
@ApiTags("admin")
@Controller("admin/pairs-fee")
export class PairsFeeController {
  constructor(private readonly pairsFeeService: PairsFeeService) {}

  @Post()
  async create(
    @Body() createPairsFeeDto: CreatePairsFeeDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.pairsFeeService.create(createPairsFeeDto);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
  @Get()
  async findAll(
    @Query() data: FilterPairsFeeDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.pairsFeeService.findAll(data);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Response() response: Response) {
    try {
      const result = await this.pairsFeeService.findOne(id);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updatePairsFeeDto: UpdatePairsFeeDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.pairsFeeService.update(id, updatePairsFeeDto);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Response() response: Response) {
    try {
      const result = await this.pairsFeeService.remove(id);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }
}
