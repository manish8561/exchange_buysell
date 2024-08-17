import { PartialType } from "@nestjs/mapped-types";
import { CreatePairsFeeDto } from "./create-pairs_fee.dto";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, Validate } from "class-validator";
import {
  BUY_SELL_TYPE,
  FEE_TYPE,
  IS_SWAP,
  IS_YES_NO_ENUM,
} from "src/constants/enums";
import { CompareValuesConstraint } from "src/common/dto/compare-values.contraint";

export class UpdatePairsFeeDto extends PartialType(CreatePairsFeeDto) {
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
    enum: IS_YES_NO_ENUM,
    enumName: "IS_ENABLE",
  })
  @IsNotEmpty()
  @IsEnum(IS_YES_NO_ENUM)
  is_enable?: string;

  @ApiProperty({
    enum: IS_SWAP,
    enumName: "IS_SWAP",
  })
  @IsEnum(IS_SWAP)
  @IsNotEmpty()
  is_swap: number;
}
