import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsOptional()  // Este campo não deve ser fornecido durante a criação
  @IsNumber()
  id?: number;

  @IsString()
  displayName: string;

  @IsEmail()
  email: string;

  @IsOptional()  // Pode ser opcional
  @IsString()
  photoURL?: string;

  @IsOptional()  // Pode ser opcional
  @IsString()
  social_links?: string;

  @IsString()
  permission: string;

  @IsOptional()  // Pode ser opcional
  @IsString()
  metadata?: string;

  @IsOptional()  // Pode ser opcional
  @IsString()
  created_at?: string;

  @IsOptional()  // Pode ser opcional
  @IsString()
  updated_at?: string;
}
