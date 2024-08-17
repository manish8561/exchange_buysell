import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { CommonFitlerDto } from "src/common/dto/common-filter.dto";
import { BUY_SELL_TYPE, FEE_TYPE, IS_SWAP } from "src/constants/enums";

export class FilterPairsFeeDto extends CommonFitlerDto {
  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  pair_id: string;

  @ApiProperty({
    enum: BUY_SELL_TYPE,
    enumName: "BUY_SELL_TYPE",
    required: false,
  })
  @IsOptional()
  @IsEnum(BUY_SELL_TYPE)
  type?: string;

  @ApiProperty({
    enum: FEE_TYPE,
    enumName: "FEE_TYPE",
    required: false,
  })
  @IsOptional()
  @IsEnum(FEE_TYPE)
  fee_type?: string;

  @ApiProperty({
    enum: IS_SWAP,
    name: "is_swap",
    type: Number,
    required: false,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @IsEnum(IS_SWAP)
  is_swap: number;
}
