import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PairsService } from "./pairs.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PairsCronService {
  logger = new Logger(PairsCronService.name);
  constructor(
    private readonly pairsService: PairsService,
    private readonly configService: ConfigService
  ) {}
  /**
   * update the pair reference price(or actual price) from exchange
   */
  @Cron("2 */5 * * * *")
  handlePrice() {
    if (this.configService.get<string>("ENABLE_CRON") === "NO") {
      return;
    }
    this.logger.debug("update pair price in the pairs table");
    this.pairsService.updatePairsPrice();
  }
}
