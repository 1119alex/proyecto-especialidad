import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument = require('pdfkit');
import { Transfer } from '../../entities/transfer.entity';
import { TransferStatus } from '../../common/enums/transfer-status.enum';
import { ReportFiltersDto } from './dto/report-filters.dto';

export interface TransfersReportSummary {
  total: number;
  byStatus: Record<string, number>;
  withDiscrepancies: number;
  averageTransitMinutes: number | null;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
  ) {}

  async getTransfers(filters: ReportFiltersDto): Promise<Transfer[]> {
    const query = this.transferRepository
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.originWarehouse', 'originWarehouse')
      .leftJoinAndSelect(
        'transfer.destinationWarehouse',
        'destinationWarehouse',
      )
      .leftJoinAndSelect('transfer.vehicle', 'vehicle')
      .leftJoinAndSelect('transfer.driver', 'driver')
      .leftJoinAndSelect('transfer.details', 'details')
      .orderBy('transfer.createdAt', 'DESC');

    if (filters.from) {
      query.andWhere('transfer.createdAt >= :from', {
        from: new Date(filters.from),
      });
    }
    if (filters.to) {
      // Incluir el día completo de la fecha final
      const to = new Date(filters.to);
      to.setHours(23, 59, 59, 999);
      query.andWhere('transfer.createdAt <= :to', { to });
    }
    if (filters.status) {
      query.andWhere('transfer.status = :status', { status: filters.status });
    }
    if (filters.originWarehouseId) {
      query.andWhere('transfer.originWarehouseId = :originId', {
        originId: filters.originWarehouseId,
      });
    }
    if (filters.destinationWarehouseId) {
      query.andWhere('transfer.destinationWarehouseId = :destinationId', {
        destinationId: filters.destinationWarehouseId,
      });
    }

    return query.getMany();
  }

  buildSummary(transfers: Transfer[]): TransfersReportSummary {
    const byStatus: Record<string, number> = {};
    let withDiscrepancies = 0;
    const transitMinutes: number[] = [];

    for (const transfer of transfers) {
      byStatus[transfer.status] = (byStatus[transfer.status] ?? 0) + 1;

      if (transfer.status === TransferStatus.COMPLETADA_CON_DISCREPANCIA) {
        withDiscrepancies++;
      }

      if (transfer.actualDepartureTime && transfer.actualArrivalTime) {
        const minutes =
          (new Date(transfer.actualArrivalTime).getTime() -
            new Date(transfer.actualDepartureTime).getTime()) /
          60000;
        if (minutes > 0) transitMinutes.push(minutes);
      }
    }

    return {
      total: transfers.length,
      byStatus,
      withDiscrepancies,
      averageTransitMinutes:
        transitMinutes.length > 0
          ? Math.round(
              transitMinutes.reduce((a, b) => a + b, 0) /
                transitMinutes.length,
            )
          : null,
    };
  }

  async getReport(filters: ReportFiltersDto): Promise<{
    summary: TransfersReportSummary;
    transfers: Transfer[];
  }> {
    const transfers = await this.getTransfers(filters);
    return { summary: this.buildSummary(transfers), transfers };
  }

  /** Genera el reporte de transferencias en PDF (RF14) */
  async generatePdf(filters: ReportFiltersDto): Promise<Buffer> {
    const { summary, transfers } = await this.getReport(filters);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) =>
      doc.on('end', () => resolve(Buffer.concat(chunks))),
    );

    const formatDate = (d?: Date | null) =>
      d ? new Date(d).toLocaleString('es-BO') : '—';

    // Encabezado
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('LogiTrack — Reporte de Transferencias', { align: 'center' });
    doc.moveDown(0.3);
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#555555')
      .text(`Generado: ${new Date().toLocaleString('es-BO')}`, {
        align: 'center',
      });

    // Filtros aplicados
    const filterParts: string[] = [];
    if (filters.from) filterParts.push(`Desde: ${filters.from}`);
    if (filters.to) filterParts.push(`Hasta: ${filters.to}`);
    if (filters.status) filterParts.push(`Estado: ${filters.status}`);
    if (filters.originWarehouseId)
      filterParts.push(`Origen ID: ${filters.originWarehouseId}`);
    if (filters.destinationWarehouseId)
      filterParts.push(`Destino ID: ${filters.destinationWarehouseId}`);
    if (filterParts.length > 0) {
      doc.text(`Filtros: ${filterParts.join(' | ')}`, { align: 'center' });
    }
    doc.moveDown(1);

    // Resumen
    doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text('Resumen');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total de transferencias: ${summary.total}`);
    doc.text(`Con discrepancias: ${summary.withDiscrepancies}`);
    doc.text(
      `Tiempo promedio de tránsito: ${
        summary.averageTransitMinutes != null
          ? `${summary.averageTransitMinutes} min`
          : 'sin datos'
      }`,
    );
    for (const [status, count] of Object.entries(summary.byStatus)) {
      doc.text(`  • ${status}: ${count}`);
    }
    doc.moveDown(1);

    // Detalle
    doc.fontSize(12).font('Helvetica-Bold').text('Detalle de transferencias');
    doc.moveDown(0.5);

    for (const transfer of transfers) {
      if (doc.y > 720) doc.addPage();

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`${transfer.transferCode} — ${transfer.status}`);
      doc.fontSize(9).font('Helvetica').fillColor('#333333');
      doc.text(
        `Ruta: ${transfer.originWarehouse?.name ?? transfer.originWarehouseId} → ` +
          `${transfer.destinationWarehouse?.name ?? transfer.destinationWarehouseId}`,
      );
      doc.text(
        `Conductor: ${
          transfer.driver
            ? `${transfer.driver.firstName} ${transfer.driver.lastName}`
            : 'Sin asignar'
        }   Vehículo: ${transfer.vehicle?.licensePlate ?? 'Sin asignar'}`,
      );
      doc.text(
        `Creada: ${formatDate(transfer.createdAt)}   ` +
          `Salida: ${formatDate(transfer.actualDepartureTime)}   ` +
          `Llegada: ${formatDate(transfer.actualArrivalTime)}`,
      );

      const discrepancies = (transfer.details ?? []).filter(
        (d) => d.hasDiscrepancy,
      );
      if (discrepancies.length > 0) {
        doc.fillColor('#b45309');
        for (const d of discrepancies) {
          doc.text(
            `  ⚠ ${d.productName}: esperado ${Number(d.quantityExpected)}, ` +
              `recibido ${Number(d.quantityReceived)}`,
          );
        }
      }

      doc.fillColor('#000000').moveDown(0.6);
    }

    if (transfers.length === 0) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('No se encontraron transferencias con los filtros aplicados.');
    }

    doc.end();
    return done;
  }
}
