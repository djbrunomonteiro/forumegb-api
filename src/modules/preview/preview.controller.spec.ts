import { Test, TestingModule } from '@nestjs/testing';
import { PreviewController } from './preview.controller';
import { PreviewService } from './preview.service';

describe('PreviewController', () => {
  let controller: PreviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PreviewController],
      providers: [PreviewService],
    }).compile();

    controller = module.get<PreviewController>(PreviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
