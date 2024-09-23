import { EPermission } from 'src/utils/enums/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'users',
})
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ nullable: true })
  displayName: string;
  @Column({ nullable: false })
  email: string;
  @Column({ default: '' })
  photoURL: string;
  @Column({ nullable: true })
  social_links: string;
  @Column({ default: EPermission.NOOB })
  permission: string;
  @Column({ default: '' })
  metadata: string;
  @CreateDateColumn()
  created_at: string;
  @UpdateDateColumn()
  updated_at: string;
}
