import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
} from "class-validator";
import { GreaterThanZeroConstraint } from "src/common/dto/greater-than-zero.contraint";
import { MaxMysqlOffsetLimitConstraint } from "src/common/dto/max-mysql-offset-limit.contraint";
import { FEE_REPORT_TRANSACTION_TYPE } from "src/constants/enums";

export class FeeReportFiltersDto {
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
    name: "country",
    type: String,
    description: "Text to search in country",
    required: false,
    default: "",
  })
  @IsString()
  @IsOptional()
  country: string;

  @ApiProperty({
    name: "filter",
    type: String,
    description: "Text to search in filters",
    required: false,
    default: "",
  })
  @IsString()
  @IsOptional()
  filter: string;

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

  @ApiProperty({
    name: "from",
    type: String,
    format: "date",
    example: "2023-12-26",
    description: "to date for filter",
    required: false,
  })
  @IsDateString()
  @IsOptional()
  from: string;

  @ApiProperty({
    name: "to",
    type: String,
    format: "date",
    example: "2023-12-27",
    description: "to date for filter",
    required: false,
  })
  @IsDateString()
  @IsOptional()
  to: string;

  @ApiProperty({
    enum: FEE_REPORT_TRANSACTION_TYPE,
    name: "transaction_type",
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsEnum(FEE_REPORT_TRANSACTION_TYPE)
  transaction_type: string;
}
