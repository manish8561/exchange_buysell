import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { IS_SWAP } from "src/constants/enums";

export class FilterActivePairDto {
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
    name: "coin",
    type: String,
    description: "select coin",
    required: false,
    default: "",
  })
  @IsString()
  @IsOptional()
  coin: string;
}
