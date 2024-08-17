import { CurrencyMaster } from "./currency_master.entity";
import { MarketMakerWallets } from "./market_maker_wallets.entity";
import { Orders } from "./orders.entity";
import { OrdersFiat } from "./orders_fiat.entity";
import { OrderStats } from "./orders_stats.entity";
import { Pairs } from "./pairs.entity";
import { PairsFee } from "./pairs_fee.entity";
import { Settings } from "./settings.entity";

export const CommonEntityProviders = [
  {
    provide: "CURRENCY_MASTER",
    useValue: CurrencyMaster,
  },
  {
    provide: "PAIRS",
    useValue: Pairs,
  },
  {
    provide: "PAIRS_FEE",
    useValue: PairsFee,
  },
  {
    provide: "Orders",
    useValue: Orders,
  },
  {
    provide: "OrdersFiat",
    useValue: OrdersFiat,
  },
  {
    provide: "Settings",
    useValue: Settings,
  },
  {
    provide: "MarketMakerWallets",
    useValue: MarketMakerWallets,
  },
  {
    provide: "OrderStats",
    useValue: OrderStats,
  },
];

export const AllModels = [
  CurrencyMaster,
  Pairs,
  PairsFee,
  Orders,
  OrdersFiat,
  Settings,
  MarketMakerWallets,
  OrderStats,
];
