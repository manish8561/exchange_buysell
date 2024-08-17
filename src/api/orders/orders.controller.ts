import { Controller, Get, Post, Body, Param, Response } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { FiltersOrdersDto } from "./dto/filters-order.dto";
import {
  failResponse,
  successResponse,
} from "src/common/util/response.handler";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async findAll(
    @Body() filtersOrdersDto: FiltersOrdersDto,
    @Response() response: Response
  ) {
    try {
      const result = await this.ordersService.findAll(filtersOrdersDto);
      return successResponse(result?.message, result?.data, response);
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ordersService.findOne(+id);
  }
}
