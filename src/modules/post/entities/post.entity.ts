import { EStatusPost } from "src/utils/enums/enums";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
    name: 'posts',
  })
  export class PostEntity {
    @PrimaryGeneratedColumn()
    id?: number;
    @Column({ nullable: false })
    title: string;
    @Column({ nullable: false })
    body: string;
    @Column({ nullable: true, default: '' })
    music_preview: string;
    @Column({ nullable: true })
    source_url: string | null;
    @Column({ default: '' })
    thumbnail: string;
    @Column({ default: '' })
    slug: string;
    @Column({ nullable: false })
    owner_id: number;
    @Column({ default: '' })
    owner_username: string;
    @Column({ default: '' })
    metadata: string;
    @Column({ default: EStatusPost.PUBLISHED })
    status: string;
    @Column({ nullable: true })
    parent_id: number;
    @CreateDateColumn()
    created_at: string;
    @UpdateDateColumn()
    updated_at: string;
  }