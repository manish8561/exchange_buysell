import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Validate,
} from "class-validator";
import { CompareValuesConstraint } from "src/common/dto/compare-values.contraint";
import { BUY_SELL_TYPE, FEE_TYPE, IS_SWAP } from "src/constants/enums";

export class CreatePairsFeeDto {
  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  pair_id: string;

  @ApiProperty({
    enum: BUY_SELL_TYPE,
    enumName: "BUY_SELL_TYPE",
  })
  @IsNotEmpty()
  @IsEnum(BUY_SELL_TYPE)
  type?: string;

  @ApiProperty({
    required: true,
  })
  @IsNumber()
  fee: number;

  @ApiProperty({
    enum: FEE_TYPE,
    enumName: "FEE_TYPE",
  })
  @IsNotEmpty()
  @IsEnum(FEE_TYPE)
  fee_type?: string;

  @ApiProperty({
    required: false,
  })
  @IsNumber()
  order_limit?: number;

  @ApiProperty({
    required: false,
  })
  @IsNumber()
  @Validate(CompareValuesConstraint)
  max_order_limit?: number;

  @ApiProperty({
    enum: IS_SWAP,
    enumName: "IS_SWAP",
  })
  @IsEnum(IS_SWAP)
  @IsNotEmpty()
  is_swap: number;
}
