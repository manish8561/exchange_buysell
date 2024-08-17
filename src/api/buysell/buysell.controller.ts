import { Controller, Get, Query, Response } from "@nestjs/common";
import { BuysellService } from "./buysell.service";
import {
  failResponse,
  successResponse,
} from "../../common/util/response.handler";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator";
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from "@nestjs/microservices";
import { FilterActivePairDto } from "./dto/filter-active-pair.dto";

@ApiBearerAuth()
@Controller("buysell")
export class BuysellController {
  constructor(private readonly buysellService: BuysellService) {}

  @Get("health")
  @Public()
  async testCall(@Response() response: Response) {
    const r = await this.buysellService.test();
    return successResponse("OK", { status: r }, response);
  }
  // getbuysellpairs api
  @Get("get_buysell_pairs")
  async getBuySellPairs(
    @Query() data: FilterActivePairDto,
    @Response() response: Response
  ) {
    try {
      const coinListResp: any = await this.buysellService.getBuySellPairsList(
        data
      );
      return successResponse(
        coinListResp?.message,
        coinListResp?.data,
        response
      );
    } catch (error) {
      return failResponse(true, error?.message, response);
    }
  }

  /**
   * consumer function for rabbitmq execution queue
   * @param data
   * @param context
   * @returns
   */
  @EventPattern("executions")
  async getNotifications(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log("executions consumer ");
    console.table(JSON.parse(data));
    console.log(`executions Pattern: ${context.getPattern()}`);
    // console.log("Message:", context.getMessage());
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    await this.buysellService.validateOrderBuySell(JSON.parse(data));
    // validation code
    channel.ack(originalMsg);
  }
  /**
   * consumer function for order response in buy sell service
   * @param data
   * @param context
   */
  @EventPattern("liquidity_response")
  async getOrderResponse(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log("-----order response queue consumer in buy sell service----");
    const res = JSON.parse(data);
    console.log(res);
    console.table(res?.data);
    console.log(`response queue Pattern: ${context.getPattern()}`);
    // console.log("Message:", context.getMessage());
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    //sending to the frontend
    this.buysellService.updateOrderStatus(res);
    channel.ack(originalMsg);
  }
  /**
   * get pair for web socket service
   * @param data
   * @param context
   * @returns
   */
  @MessagePattern("get_pair")
  async getActivePairs(
    @Payload() data: any,
    @Ctx() context: RmqContext
  ): Promise<any> {
    data = JSON.parse(data);
    console.log("get_pair consumer ", data);
    console.log(`Pattern: ${context.getPattern()}`);
    // console.log("Message:", context.getMessage());
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
    // validation code
    return await this.buysellService.getPair(data);
  }
  /**
   * consumer function for order response in buy sell service
   * @param data
   * @param context
   */
  @EventPattern("market_maker_order")
  async getMarketOrderConsumer(
    @Payload() data: any,
    @Ctx() context: RmqContext
  ) {
    console.log(
      "-----market maker order queue consumer in buy sell service----"
    );
    const res = JSON.parse(data);
    console.table(res);
    console.log(`Pattern: ${context.getPattern()}`);
    // console.log("Message:", context.getMessage());
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    //sending to the frontend
    this.buysellService.updateMarketMakerOrderStatus(res);
    channel.ack(originalMsg);
  }
}
