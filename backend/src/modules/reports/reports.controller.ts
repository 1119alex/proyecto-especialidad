import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportFiltersDto } from './dto/report-filters.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('transfers')
  getTransfersReport(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getReport(filters);
  }

  @Get('transfers/pdf')
  async getTransfersReportPdf(
    @Query() filters: ReportFiltersDto,
    @Res() res: Response,
  ) {
    const pdf = await this.reportsService.generatePdf(filters);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-transferencias-${Date.now()}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}
