import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";
import {
  BUYSELL_KYC_LEVEL_TYPE,
  BUY_SELL_LIMIT_DURATION,
} from "src/constants/enums";

export class CreateSettingDto {
  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  bs_limit: string;

  @ApiProperty({
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  level: number;

  @ApiProperty({
    enum: BUY_SELL_LIMIT_DURATION,
    enumName: "BUY_SELL_LIMIT_DURATION",
  })
  @IsEnum(BUY_SELL_LIMIT_DURATION)
  @IsNotEmpty()
  duration: string;

  @ApiProperty({
    enum: BUYSELL_KYC_LEVEL_TYPE,
    enumName: "BUYSELL_KYC_LEVEL_TYPE",
  })
  @IsEnum(BUYSELL_KYC_LEVEL_TYPE)
  @IsNotEmpty()
  type: number;
}
