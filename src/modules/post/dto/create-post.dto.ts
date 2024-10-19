import { IsNumber, IsString } from "class-validator";

export class CreatePostDto {
    @IsNumber()
    id?: number;
    @IsString()
    title: string;
    @IsString()
    body: string;
    @IsString()
    music_preview: string;
    @IsString()
    source_url?: string | null;
    @IsString()
    thumbnail?: string;
    @IsString()
    slug: string;
    @IsNumber()
    owner_id: number;
    @IsString()
    owner_username: string;
    @IsString()
    metadata?: string;
    @IsString()
    status?: string;
    parent_id?: number | null;
    children?: any;
    @IsString()
    likes?: any;
    @IsString()
    created_at?: string;
    @IsString()
    updated_at?: string;
}
