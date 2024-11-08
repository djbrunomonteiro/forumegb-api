import { EPlanStatus, EPlanTypes } from 'src/utils/enums/enums';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('Payment')
export class PaymentEntity {
  @PrimaryGeneratedColumn()
  id: number; // Identificador único do pagamento

  @Column({default: EPlanStatus.Pending})
  status: string; // Status do pagamento (ex: 'pending', 'completed', 'failed')

  @Column({nullable: true, default: ''})
  transaction_id: string; // ID da transação gerada pelo sistema de pagamento

  @Column({ nullable: true })
  user_id?: number; 

  @Column({ nullable: true, default: EPlanTypes.TRIMESTRAL })
  plan_type?: string; 

  @Column({ nullable: true })
  plan_start: string; // Data e hora de início do acesso

  @Column({ nullable: true })
  plan_end: string; // Data e hora de fim do acesso

  @Column({ nullable: false, type: 'text', default: '' })
  preference?: string;

  @Column({ nullable: false, type: 'text', default: '' })
  payload?: string;

  @CreateDateColumn()
  created_at: string;

  @UpdateDateColumn()
  updated_at: string;
}
