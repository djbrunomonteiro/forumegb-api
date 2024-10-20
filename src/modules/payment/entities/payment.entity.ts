import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Payment')
export class PaymentEntity {
  @PrimaryGeneratedColumn()
  id: number; // Identificador único do pagamento

  @Column()
  amount: number; // Valor do pagamento

  @Column()
  currency: string; // Moeda do pagamento (ex: 'USD', 'BRL')

  @Column()
  paymentMethod: string; // Método de pagamento (ex: 'credit_card', 'paypal')

  @Column()
  status: string; // Status do pagamento (ex: 'pending', 'completed', 'failed')

  @Column()
  transactionId: string; // ID da transação gerada pelo sistema de pagamento

  @Column({ nullable: true })
  userId?: number; // ID do usuário que realizou o pagamento (se aplicável)

  @Column({ nullable: true })
  errorMessage?: string; // Mensagem de erro, caso o pagamento falhe

  @Column()
  accessStartDate: Date; // Data e hora de início do acesso

  @Column()
  accessEndDate: Date; // Data e hora de fim do acesso

  @Column({ nullable: true })
  metadata?: string; // Mensagem de erro, caso o pagamento falhe

  @Column()
  createdAt: Date; // Data e hora em que o pagamento foi criado

  @Column({ nullable: true })
  updatedAt?: Date; // Data e hora da última atualização do pagamento (se aplicável)
}
