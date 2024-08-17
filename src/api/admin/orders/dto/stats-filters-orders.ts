import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class StatsFiltersOrdersDto {
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
}
