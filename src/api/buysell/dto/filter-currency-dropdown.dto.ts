import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional } from "class-validator";
import { IS_YES_NO_ENUM, IS_FIAT_CURRENCY } from "src/constants/enums";

export class FilterCurrencyDropdownDto {
  @ApiProperty({
    required: false,
    enum: IS_YES_NO_ENUM,
    enumName: "IS_ERC20TOKEN",
  })
  @IsOptional()
  @IsEnum(IS_YES_NO_ENUM)
  is_erc20token: string;

  @ApiProperty({
    required: false,
    enum: IS_FIAT_CURRENCY,
    enumName: "IS_FIAT_CURRENCY",
  })
  @IsOptional()
  @IsNumber()
  @IsEnum(IS_FIAT_CURRENCY)
  is_fiat_currency: number;
}
