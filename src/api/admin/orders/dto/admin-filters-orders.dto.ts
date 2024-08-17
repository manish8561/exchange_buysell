import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
} from "class-validator";
import { GreaterThanZeroConstraint } from "src/common/dto/greater-than-zero.contraint";
import { MaxMysqlOffsetLimitConstraint } from "src/common/dto/max-mysql-offset-limit.contraint";
import { BUY_SELL_TYPE, IS_SWAP, ORDER_TYPE } from "src/constants/enums";

export class AdminFiltersOrdersDto {
  @ApiProperty({
    name: "filter",
    type: String,
    description: "Text to search in filters",
    required: false,
    default: "",
  })
  @IsString()
  @IsOptional()
  filter: string;

  @ApiProperty({
    name: "pair_id",
    type: String,
    description: "select pair_id",
    required: false,
    default: "",
  })
  @IsString()
  @IsOptional()
  pair_id: string;

  @ApiProperty({
    enum: BUY_SELL_TYPE,
    name: "order_type",
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsEnum(BUY_SELL_TYPE)
  order_type: string;

  @ApiProperty({
    description: "Order type LIMIT or MARKET.",
    enum: ORDER_TYPE,
    enumName: "ORDER_TYPE",
    required: false,
  })
  @IsOptional()
  @IsEnum(ORDER_TYPE)
  type: string;

  @ApiProperty({
    name: "limit",
    type: Number,
    description: "Limit the number of records",
    default: 10,
  })
  @IsNumber()
  @Validate(GreaterThanZeroConstraint)
  @Validate(MaxMysqlOffsetLimitConstraint)
  limit: number;

  @ApiProperty({
    name: "page",
    type: Number,
    description: "Page for paginating records",
    default: 1,
  })
  @IsNumber()
  @Validate(GreaterThanZeroConstraint)
  @Validate(MaxMysqlOffsetLimitConstraint)
  page: number;

  @ApiProperty({
    name: "direction",
    type: String,
    description: "Sorting direction for the records",
    required: false,
    default: "",
  })
  @IsString()
  @IsOptional()
  direction: string;

  @ApiProperty({
    name: "column",
    type: String,
    description: "Sorting column for the records",
    required: false,
    default: "",
  })
  @IsString()
  @IsOptional()
  column: string;

  @ApiProperty({
    enum: IS_SWAP,
    name: "is_swap",
    type: Number,
    required: false,
    default: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsEnum(IS_SWAP)
  is_swap: number;

  @ApiProperty({
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  is_market_maker: number;

  @ApiProperty({
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  chain_id: number;

  @ApiProperty({
    name: "from",
    type: String,
    format: "date",
    example: "2023-12-11",
    description: "to date for filter",
    required: false,
  })
  @IsDateString()
  @IsOptional()
  from: string;

  @ApiProperty({
    name: "to",
    type: String,
    format: "date",
    example: "2023-12-12",
    description: "to date for filter",
    required: false,
  })
  @IsDateString()
  @IsOptional()
  to: string;
}
