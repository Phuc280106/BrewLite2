import { BadRequestException } from '@nestjs/common';

/** Đơn hàng không tồn tại / không thuộc khách / không còn PENDING / đã quá hạn. */
export class InvalidOrderException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}
