import { PartialType } from '@nestjs/mapped-types';
import { CreatePreviewDto } from './create-preview.dto';

export class UpdatePreviewDto extends PartialType(CreatePreviewDto) {}
