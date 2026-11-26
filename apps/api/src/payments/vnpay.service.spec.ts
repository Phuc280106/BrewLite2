import { createHmac } from 'crypto';
import { VnpayService } from './vnpay.service';

const SECRET = 'TEST_HASH_SECRET';

/** Ký lại tham số theo đúng quy tắc của VNPay để giả lập phản hồi từ cổng. */
function signedReturnQuery(params: Record<string, string>) {
  const signData = Object.keys(params)
    .sort()
    .map(
      (k) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`,
    )
    .join('&');
  const hash = createHmac('sha512', SECRET)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');
  return { ...params, vnp_SecureHash: hash };
}

describe('VnpayService', () => {
  let service: VnpayService;
  const env = { ...process.env };

  beforeEach(() => {
    process.env.VNP_TMN_CODE = 'TESTCODE';
    process.env.VNP_HASH_SECRET = SECRET;
    process.env.VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    process.env.VNP_RETURN_URL = 'http://localhost:3000/payment/vnpay-return';
    service = new VnpayService();
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it('createPaymentUrl: có đủ tham số, số tiền nhân 100 và chữ ký tự kiểm chứng được', () => {
    const url = new URL(
      service.createPaymentUrl({
        orderId: 'order-1',
        orderInfo: 'Thanh toan don hang order-1',
        amount: 102000,
        ipAddr: '127.0.0.1',
        bankCode: 'VNBANK',
      }),
    );
    const q = Object.fromEntries(url.searchParams.entries());

    expect(url.origin + url.pathname).toBe(
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    );
    expect(q).toMatchObject({
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: 'TESTCODE',
      vnp_Amount: '10200000',
      vnp_CurrCode: 'VND',
      vnp_BankCode: 'VNBANK',
      vnp_ReturnUrl: 'http://localhost:3000/payment/vnpay-return',
    });
    expect(q.vnp_TxnRef.startsWith('order-1_')).toBe(true);
    expect(q.vnp_CreateDate).toMatch(/^\d{14}$/);
    // Chính URL vừa sinh phải qua được bước verify (cùng thuật toán ký)
    expect(service.verifyReturn(q).isValid).toBe(true);
  });

  it('createPaymentUrl: không có bankCode thì không gửi vnp_BankCode', () => {
    const url = new URL(
      service.createPaymentUrl({ orderId: 'o', orderInfo: 'x', amount: 5000 }),
    );
    expect(url.searchParams.has('vnp_BankCode')).toBe(false);
  });

  it('verifyReturn: chữ ký đúng + mã 00 => thành công, tách orderId từ vnp_TxnRef', () => {
    const query = signedReturnQuery({
      vnp_TxnRef: 'order-1_1700000000000',
      vnp_Amount: '10200000',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TransactionNo: '14000001',
      vnp_OrderInfo: 'Thanh toan don hang order-1',
    });

    expect(service.verifyReturn(query)).toMatchObject({
      isValid: true,
      isSuccess: true,
      orderId: 'order-1',
      txnRef: 'order-1_1700000000000',
      amount: 102000,
      transactionNo: '14000001',
    });
  });

  it('verifyReturn: sai chữ ký => isValid=false, không bao giờ thành công', () => {
    const query = signedReturnQuery({
      vnp_TxnRef: 'order-1_1',
      vnp_Amount: '10200000',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
    });
    const tampered = { ...query, vnp_Amount: '100' };

    expect(service.verifyReturn(tampered)).toMatchObject({
      isValid: false,
      isSuccess: false,
    });
  });

  it('verifyReturn: thiếu vnp_SecureHash => không hợp lệ', () => {
    expect(
      service.verifyReturn({ vnp_TxnRef: 'o_1', vnp_ResponseCode: '00' }),
    ).toMatchObject({ isValid: false, isSuccess: false });
  });

  it('verifyReturn: chữ ký đúng nhưng mã 24 (khách hủy) => không thành công, có thông báo', () => {
    const query = signedReturnQuery({
      vnp_TxnRef: 'order-1_1',
      vnp_Amount: '10200000',
      vnp_ResponseCode: '24',
      vnp_TransactionStatus: '02',
    });

    expect(service.verifyReturn(query)).toMatchObject({
      isValid: true,
      isSuccess: false,
      responseCode: '24',
      message: 'Khách hàng hủy giao dịch thanh toán.',
    });
  });

  it('thiếu cấu hình VNP_*: ném lỗi rõ ràng thay vì dùng giá trị mặc định', () => {
    delete process.env.VNP_HASH_SECRET;
    expect(() =>
      service.createPaymentUrl({ orderId: 'o', orderInfo: 'x', amount: 5000 }),
    ).toThrow(/VNP_HASH_SECRET/);
  });
});
