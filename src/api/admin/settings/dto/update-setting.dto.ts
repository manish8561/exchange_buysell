import { PartialType } from "@nestjs/mapped-types";
import { CreateSettingDto } from "./create-setting.dto";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import {
  BUYSELL_KYC_LEVEL_TYPE,
  BUY_SELL_LIMIT_DURATION,
  NUMERIC_ACTIVE_INACTIVE,
} from "src/constants/enums";

export class UpdateSettingDto extends PartialType(CreateSettingDto) {
  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsOptional()
  bs_limit: string;

  @ApiProperty({
    required: true,
  })
  @IsNumber()
  @IsOptional()
  level: number;

  @ApiProperty({
    enum: BUY_SELL_LIMIT_DURATION,
    enumName: "BUY_SELL_LIMIT_DURATION",
  })
  @IsEnum(BUY_SELL_LIMIT_DURATION)
  @IsOptional()
  duration: string;

  @ApiProperty({
    enum: BUYSELL_KYC_LEVEL_TYPE,
    enumName: "BUYSELL_KYC_LEVEL_TYPE",
  })
  @IsEnum(BUYSELL_KYC_LEVEL_TYPE)
  @IsOptional()
  type: number;

  @ApiProperty({
    enum: NUMERIC_ACTIVE_INACTIVE,
    enumName: "IS_EXIST_IN_MARKET",
  })
  @IsEnum(NUMERIC_ACTIVE_INACTIVE)
  @IsOptional()
  is_active: number;
}
