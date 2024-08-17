import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { CurrencyMasterModule } from "./currency_master/currency_master.module";
import { PairsModule } from "./pairs/pairs.module";
import { PairsFeeModule } from "./pairs_fee/pairs_fee.module";
import { SettingsModule } from "./settings/settings.module";
import { OrdersModule } from "./orders/orders.module";

@Module({
  imports: [
    CurrencyMasterModule,
    PairsModule,
    PairsFeeModule,
    SettingsModule,
    OrdersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
