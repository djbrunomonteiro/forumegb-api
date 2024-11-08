import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDate, IsPositive } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @IsPositive()
  id: number; // Identificador único do pagamento

  @IsNotEmpty()
  status: string; // Status do pagamento (ex: 'pending', 'completed', 'failed')

  @IsString()
  @IsNotEmpty()
  transaction_id: string; // ID da transação gerada pelo sistema de pagamento

  @IsOptional()
  @IsNumber()
  user_id?: number; // ID do usuário que realizou o pagamento (se aplicável)

  @IsString()
  plan_type: string;

  @IsDate()
  plan_start: string;

  @IsDate()
  plan_end: string; 

  @IsOptional()
  @IsString()
  preference?: string;

  @IsOptional()
  @IsString()
  payload?: string;

  @IsDate()
  createdAt: Date;

  @IsOptional()
  @IsDate()
  updatedAt?: Date; 
}

