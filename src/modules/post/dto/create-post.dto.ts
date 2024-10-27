import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsOptional() // Este campo não deve ser fornecido durante a criação
  @IsNumber()
  id?: number;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsNumber()
  owner_id: number;

  @IsString()
  @IsOptional() // Pode ser opcional se não for fornecido
  music_preview?: string;

  @IsString()
  @IsOptional() // Pode ser opcional
  source_url?: string | null;

  @IsString()
  @IsOptional() // Pode ser opcional
  thumbnail?: string;

  @IsString()
  @IsOptional() // Pode ser opcional
  slug?: string;

  @IsString()
  @IsOptional() // Pode ser opcional
  metadata?: string;

  @IsString()
  @IsOptional() // Pode ser opcional
  status?: string;

  @IsOptional() // Permite null
  parent_id?: number | null;

  @IsOptional() // Pode ser opcional
  likes?: string;

  @IsOptional() // Pode ser opcional
  tags?: string;

  @IsString()
  @IsOptional() // Pode ser opcional
  type_stage?: string;
}
