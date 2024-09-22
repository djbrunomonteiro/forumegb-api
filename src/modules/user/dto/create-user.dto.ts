import { IsEmail, IsNumber, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNumber()
  id?: number;
  @IsString()
  displayName: string;
  @IsEmail()
  email: string;
  @IsString()
  photoURL: string;
  @IsString()
  social_links: string;
  @IsString()
  permission: string;
  @IsString()
  metadata: string;
  @IsString()
  created_at?: string;
  @IsString()
  updated_at?: string;
}
