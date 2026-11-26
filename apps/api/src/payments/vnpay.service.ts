import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createHmac } from 'crypto';

export interface VnpayPaymentUrlParams {
  orderId: string;
  /** Mã hiển thị trong nội dung thanh toán (không dấu, không ký tự đặc biệt). */
  orderInfo: string;
  /** Số tiền VND (chưa nhân 100). */
  amount: number;
  ipAddr?: string;
  bankCode?: string;
}

export interface VnpayReturnResult {
  isValid: boolean;
  isSuccess: boolean;
  txnRef: string;
  orderId: string;
  amount: number;
  transactionNo: string;
  responseCode: string;
  message: string;
}

const VNPAY_ERROR_MESSAGES: Record<string, string> = {
  '07': 'Trừ tiền thành công nhưng giao dịch bị nghi ngờ bất thường.',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ Internet Banking.',
  '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
  '11': 'Đã hết hạn chờ thanh toán trên Cổng VNPay.',
  '12': 'Thẻ hoặc tài khoản ngân hàng đang bị khóa.',
  '24': 'Khách hàng hủy giao dịch thanh toán.',
  '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
  '65': 'Tài khoản đã vượt quá hạn mức thanh toán trong ngày.',
  '75': 'Ngân hàng thanh toán đang bảo trì hệ thống.',
  '79': 'Nhập sai mã OTP quá số lần quy định.',
};

/**
 * Tích hợp Cổng VNPay Sandbox (vnp_Version 2.1.0, chữ ký HMAC-SHA512).
 * Cấu hình qua biến môi trường: VNP_TMN_CODE, VNP_HASH_SECRET, VNP_URL, VNP_RETURN_URL.
 */
@Injectable()
export class VnpayService {
  private get config() {
    const tmnCode = process.env.VNP_TMN_CODE;
    const hashSecret = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;
    if (!tmnCode || !hashSecret || !vnpUrl || !returnUrl) {
      throw new InternalServerErrorException(
        'Thiếu cấu hình VNPay (VNP_TMN_CODE, VNP_HASH_SECRET, VNP_URL, VNP_RETURN_URL)',
      );
    }
    return { tmnCode, hashSecret, vnpUrl, returnUrl };
  }

  /** Tạo URL chuyển hướng khách sang Cổng VNPay Sandbox. */
  createPaymentUrl(params: VnpayPaymentUrlParams): string {
    const { tmnCode, hashSecret, vnpUrl, returnUrl } = this.config;

    // Mã tham chiếu duy nhất cho mỗi lượt thanh toán: "<orderId>_<timestamp>"
    const txnRef = `${params.orderId}_${Date.now()}`;

    const vnpParams: Record<string, string | number> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(params.amount * 100), // VNPay yêu cầu nhân 100
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: params.ipAddr || '127.0.0.1',
      vnp_CreateDate: this.formatCreateDate(new Date()),
    };

    if (params.bankCode && params.bankCode.trim() !== '') {
      vnpParams.vnp_BankCode = params.bankCode.trim();
    }

    const signData = this.buildSignData(vnpParams);
    const secureHash = this.sign(signData, hashSecret);
    return `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;
  }

  /** Xác minh chữ ký và kết quả khi VNPay redirect về ReturnUrl. */
  verifyReturn(query: Record<string, string>): VnpayReturnResult {
    const { hashSecret } = this.config;

    const vnpParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(query)) {
      if (
        key.startsWith('vnp_') &&
        key !== 'vnp_SecureHash' &&
        key !== 'vnp_SecureHashType'
      ) {
        vnpParams[key] = String(value);
      }
    }

    const expected = this.sign(this.buildSignData(vnpParams), hashSecret);
    const received = String(query.vnp_SecureHash ?? '');
    const isValid =
      received.length > 0 && received.toLowerCase() === expected.toLowerCase();

    const responseCode = query.vnp_ResponseCode || '';
    const isSuccess =
      isValid && responseCode === '00' && query.vnp_TransactionStatus === '00';
    const txnRef = query.vnp_TxnRef || '';

    return {
      isValid,
      isSuccess,
      txnRef,
      orderId: txnRef.split('_')[0] || '',
      amount: Number(query.vnp_Amount || 0) / 100,
      transactionNo: query.vnp_TransactionNo || '',
      responseCode,
      message: isSuccess
        ? 'Giao dịch VNPay thành công'
        : VNPAY_ERROR_MESSAGES[responseCode] ||
          `Giao dịch không thành công (Mã lỗi: ${responseCode || 'không xác định'})`,
    };
  }

  /** Sắp xếp tham số theo alphabet rồi encode theo đúng quy tắc ký của VNPay. */
  private buildSignData(params: Record<string, string | number>): string {
    return Object.keys(params)
      .sort()
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key])).replace(/%20/g, '+')}`,
      )
      .join('&');
  }

  private sign(signData: string, secret: string): string {
    return createHmac('sha512', secret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');
  }

  /** yyyyMMddHHmmss theo giờ Việt Nam (GMT+7), bất kể múi giờ của server. */
  private formatCreateDate(date: Date): string {
    const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      String(vn.getUTCFullYear()) +
      pad(vn.getUTCMonth() + 1) +
      pad(vn.getUTCDate()) +
      pad(vn.getUTCHours()) +
      pad(vn.getUTCMinutes()) +
      pad(vn.getUTCSeconds())
    );
  }
}
