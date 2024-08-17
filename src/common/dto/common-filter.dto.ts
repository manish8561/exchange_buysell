import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
} from "class-validator";
import { IS_YES_NO_ENUM } from "src/constants/enums";
import { GreaterThanZeroConstraint } from "./greater-than-zero.contraint";
import { MaxMysqlOffsetLimitConstraint } from "./max-mysql-offset-limit.contraint";

export class CommonFitlerDto {
  @ApiProperty({
    name: "filter",
    type: String,
    description: "Text to search in filters",
    required: false,
  })
  @IsString()
  @IsOptional()
  filter: string;
  @ApiProperty({
    enum: IS_YES_NO_ENUM,
    name: "is_enable",
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsEnum(IS_YES_NO_ENUM)
  is_enable: string;
  @ApiProperty({
    name: "limit",
    type: Number,
    description: "Limit the number of records",
    default: 10,
  })
  @IsNumber()
  @Validate(GreaterThanZeroConstraint)
  @Validate(MaxMysqlOffsetLimitConstraint)
  limit: number;
  @ApiProperty({
    name: "page",
    type: Number,
    description: "Page for paginating records",
    default: 1,
  })
  @IsNumber()
  @Validate(GreaterThanZeroConstraint)
  @Validate(MaxMysqlOffsetLimitConstraint)
  page: number;
  @ApiProperty({
    name: "direction",
    type: String,
    description: "Sorting direction for the records",
    required: false,
  })
  @IsString()
  @IsOptional()
  direction: string;
  @ApiProperty({
    name: "column",
    type: String,
    description: "Sorting column for the records",
    required: false,
  })
  @IsString()
  @IsOptional()
  column: string;
}
