import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDate, IsPositive } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @IsPositive()
  id: number; // Identificador único do pagamento

  @IsNumber()
  @IsPositive()
  amount: number; // Valor do pagamento

  @IsString()
  @IsNotEmpty()
  currency: string; // Moeda do pagamento (ex: 'USD', 'BRL')

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // Método de pagamento (ex: 'credit_card', 'paypal')

  @IsString()
  @IsNotEmpty()
  status: string; // Status do pagamento (ex: 'pending', 'completed', 'failed')

  @IsString()
  @IsNotEmpty()
  transactionId: string; // ID da transação gerada pelo sistema de pagamento

  @IsOptional()
  @IsNumber()
  userId?: number; // ID do usuário que realizou o pagamento (se aplicável)

  @IsOptional()
  @IsString()
  errorMessage?: string; // Mensagem de erro, caso o pagamento falhe

  @IsDate()
  accessStartDate: Date; // Data e hora de início do acesso

  @IsDate()
  accessEndDate: Date; // Data e hora de fim do acesso

  @IsOptional()
  @IsString()
  metadata?: string; // Mensagem de erro, caso o pagamento falhe

  @IsDate()
  createdAt: Date; // Data e hora em que o pagamento foi criado

  @IsOptional()
  @IsDate()
  updatedAt?: Date; // Data e hora da última atualização do pagamento (se aplicável)
}

