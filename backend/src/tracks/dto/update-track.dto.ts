import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateTrackDto {
  @ApiPropertyOptional({ example: 'Nightfall Trap Beat' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ example: 'Beat oscuro con 808s' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 29.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  price?: number;

  @ApiPropertyOptional({ example: 'Trap' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  genre?: string;

  @ApiPropertyOptional({ example: 140 })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(300)
  bpm?: number;

  @ApiPropertyOptional({ example: 'C Minor' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  key?: string;

  @ApiPropertyOptional({ example: ['dark', '808'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];
}
