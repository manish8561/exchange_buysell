import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { CommonFitlerDto } from "src/common/dto/common-filter.dto";
import { IS_SWAP } from "src/constants/enums";

export class FiltersPairsDto extends CommonFitlerDto {
  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  pair_id: string;
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

  @ApiProperty({
    default: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  chain_id: number;
}
