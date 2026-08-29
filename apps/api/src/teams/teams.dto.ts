import { IsObject, IsString, MaxLength, MinLength } from "class-validator";

export class SaveLineupDto {
  @IsString()
  @MinLength(3)
  @MaxLength(24)
  formation!: string;

  @IsObject()
  tactics!: Record<string, unknown>;
}
