import { PartialType } from '@nestjs/mapped-types';
import { CreateTransferDto } from './create-transfer.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransferStatus } from '../../../common/enums/transfer-status.enum';

export class UpdateTransferDto extends PartialType(CreateTransferDto) {
  @IsEnum(TransferStatus)
  @IsOptional()
  status?: TransferStatus;

  @IsString()
  @IsOptional()
  cancellationReason?: string;
}
