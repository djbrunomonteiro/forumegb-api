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

  @Column({ default: '', type: 'text' })
  photoURL: string;

  @Column({ nullable: true })
  social_links: string;

  @Column({ default: EPermission.BASIC_DJ })
  permission: string;

  @Column({ default: '', type: 'text' })
  metadata: string;

  @Column({ default: '', nullable: true })
  end_uf: string;

  @Column({ default: '', nullable: true })
  end_city: string;

  @CreateDateColumn()
  created_at: string;

  @UpdateDateColumn()
  updated_at: string;

  @OneToMany(() => PostEntity, (post) => post.user)
  posts: PostEntity[];
}
