import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
} from "class-validator";
import { GreaterThanHundredConstraint } from "src/common/dto/greater-than-hundred.contraint";
import { GreaterThanEqualToZeroConstraint } from "src/common/dto/greater-than-zero.contraint";
import {
  IS_ACTIVE_STATUS_PAIR,
  IS_EXIST_MARKET,
  IS_SWAP,
} from "src/constants/enums";

export class CreatePairDto {
  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  currency_id: string;

  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  other_currency_id: string;

  @ApiProperty({
    default: "BTCNGN",
  })
  @IsString()
  @IsNotEmpty()
  pair_name: string;

  @ApiProperty({
    enum: IS_EXIST_MARKET,
    enumName: "IS_EXIST_IN_MARKET",
  })
  @IsEnum(IS_EXIST_MARKET)
  @IsNotEmpty()
  exist_in_market: number;

  @ApiProperty({
    required: false,
    description: "markup percentage for buy set by admin for user.",
  })
  @IsNumber()
  @IsOptional()
  reference_price: number;

  @ApiProperty({
    required: false,
    description: "markup percentage for buy set by admin for user.",
  })
  @IsNumber()
  @IsOptional()
  @Validate(GreaterThanEqualToZeroConstraint)
  @Validate(GreaterThanHundredConstraint)
  markup_percentage: number;

  @ApiProperty({
    required: false,
    description: "markdown percentage for buy set by admin for user.",
  })
  @IsNumber()
  @IsOptional()
  @Validate(GreaterThanEqualToZeroConstraint)
  @Validate(GreaterThanHundredConstraint)
  markdown_percentage: number;

  @ApiProperty({
    required: false,
    description: "markup value for buy set by admin for user.",
  })
  @IsNumber()
  @IsOptional()
  markup: number;

  @ApiProperty({
    required: false,
    description: "markdown value for sell set by admin for user.",
  })
  @IsNumber()
  @IsOptional()
  markdown: number;

  @ApiProperty({
    default: "",
    required: false,
    description: "name of pair on exchange(like bifinex,binance)",
  })
  @IsString()
  @IsOptional()
  exchange_pair: string;

  @ApiProperty({
    default: "",
    required: false,
    description: "name of pair show in our plateform",
  })
  @IsString()
  @IsOptional()
  exchange_pair_name: string;

  @ApiProperty({
    enum: IS_SWAP,
    enumName: "IS_SWAP",
  })
  @IsEnum(IS_SWAP)
  @IsNotEmpty()
  is_swap: number;

  @ApiProperty({
    enum: IS_ACTIVE_STATUS_PAIR,
    enumName: "IS_ACTIVE_STATUS_PAIR",
  })
  @IsEnum(IS_ACTIVE_STATUS_PAIR)
  @IsNotEmpty()
  active_status: number;

  @ApiProperty({
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  chain_id: number;
}
