import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
} from "class-validator";
import { GreaterThanZeroConstraint } from "src/common/dto/greater-than-zero.contraint";
import { MaxMysqlOffsetLimitConstraint } from "src/common/dto/max-mysql-offset-limit.contraint";

export class DailyStatsFiltersOrdersDto {
  @ApiProperty({
    name: "from",
    type: String,
    format: "date",
    example: "2024-02-22",
    description: "from date for filter",
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  from: string;
  @ApiProperty({
    name: "to",
    type: String,
    format: "date",
    example: "2024-02-23",
    description: "to date for filter",
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    name: "coin",
    type: String,
    description: "Text to search in coins",
    required: false,
    default: "",
  })
  @IsString()
  @IsOptional()
  coin: string;
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
    default: "",
  })
  @IsString()
  @IsOptional()
  direction: string;

  @ApiProperty({
    name: "column",
    type: String,
    description: "Sorting column for the records",
    required: false,
    default: "",
  })
  @IsString()
  @IsOptional()
  column: string;
}
