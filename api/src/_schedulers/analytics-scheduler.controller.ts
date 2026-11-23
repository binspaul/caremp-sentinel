import {
  Controller,
  Post,
  Param,
  ParseIntPipe,
  Version,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnalyticsSchedulerService } from './analytics-scheduler.service';

@Controller('analytics')
export class AnalyticsSchedulerController {
  constructor(private readonly analyticsSchedulerService: AnalyticsSchedulerService) { }

  @Post('trigger/:residentId')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  async triggerForResident(@Param('residentId', ParseIntPipe) residentId: number) {
    const result = await this.analyticsSchedulerService.runAnalyticsForResidentNow(residentId);
    return {
      code: HttpStatus.OK,
      status: 'success',
      message: `Analytics executed for resident ${residentId}`,
      data: result,
    };
  }
}
