import { EStatusPost, ETypeStage } from "src/utils/enums/enums";
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
    @Column({ nullable: true, default: '' })
    source_url: string | null;
    @Column({ nullable: true, default: '' })
    thumbnail: string;
    @Column({ nullable: true, default: '' })
    slug: string;
    @Column({ nullable: true})
    owner_id: number;
    @Column({ default: '' })
    owner_username: string;
    @Column({ nullable: true})
    metadata: string;
    @Column({ default: EStatusPost.PUBLISHED })
    status: string;
    @Column({ nullable: true })
    parent_id: number;
    @Column({ nullable: true })
    type_stage: string;
    @Column({ type: 'text', default: "[]"})
    likes: string;
    @CreateDateColumn()
    created_at: string;
    @UpdateDateColumn()
    updated_at: string;
  }