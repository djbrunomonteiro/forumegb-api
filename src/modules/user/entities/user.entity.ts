import { PostEntity } from 'src/modules/post/entities/post.entity';
import { EPermission } from 'src/utils/enums/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
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

  @OneToMany(() => PostEntity, post => post.user)
  posts: PostEntity[];
}
