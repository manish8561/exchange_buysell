import { PartialType } from "@nestjs/mapped-types";
import { CreateCurrencyMasterDto } from "./create-currency_master.dto";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { IS_FIAT_CURRENCY, IS_YES_NO_ENUM } from "src/constants/enums";

export class UpdateCurrencyMasterDto extends PartialType(
  CreateCurrencyMasterDto
) {
  @ApiProperty({
    default: "USD Dollar",
  })
  @IsString()
  @IsNotEmpty()
  currency_name: string;

  @ApiProperty({
    readOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  currency_symbol: string;

  @ApiProperty({
    enum: IS_YES_NO_ENUM,
    enumName: "IS_ERC20TOKEN",
  })
  @IsNotEmpty()
  @IsEnum(IS_YES_NO_ENUM)
  is_erc20token: string;

  @ApiProperty({
    enum: IS_FIAT_CURRENCY,
    enumName: "IS_FIAT_CURRENCY",
  })
  @IsNotEmpty()
  @IsEnum(IS_FIAT_CURRENCY)
  is_fiat_currency: number;

  @ApiProperty({
    default: "",
  })
  @IsString()
  @IsOptional()
  token_abi: string;

  @ApiProperty({
    default: "",
  })
  @IsString()
  @IsOptional()
  token_address: string;

  @ApiProperty()
  @IsNumber()
  smallest_unit: number;

  @ApiProperty()
  @IsNumber()
  exchange_price_per_usd: number;

  @ApiProperty()
  @IsNumber()
  decimals: number;

  @ApiProperty({
    description: "Full link for logo",
    default: "",
  })
  @IsString()
  @IsOptional()
  logo: string;
  @ApiProperty({
    enum: IS_YES_NO_ENUM,
    enumName: "IS_ACTIVE",
  })
  @IsNotEmpty()
  @IsEnum(IS_YES_NO_ENUM)
  is_active: string;

  @ApiProperty({
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  chain_id: number;
}
