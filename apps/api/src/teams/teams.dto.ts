import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsObject,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { FORMATIONS, type Formation } from "@fb/shared";

export class SaveLineupDto {
  @IsString()
  @MinLength(3)
  @MaxLength(24)
  formation!: string;

  @IsObject()
  tactics!: Record<string, unknown>;
}

export class LineupAssignmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  slotKey!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  playerId!: string;
}

export class SaveLineupDraftDto {
  @IsString()
  @IsIn(FORMATIONS)
  formation!: Formation;

  @IsArray()
  @ArrayMinSize(11)
  @ArrayMaxSize(11)
  @ValidateNested({ each: true })
  @Type(() => LineupAssignmentDto)
  assignments!: LineupAssignmentDto[];
}
