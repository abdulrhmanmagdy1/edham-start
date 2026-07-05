/** واجهة مزوّد الرسائل النصية (SMS). */
export interface SmsProvider {
  readonly name: string;
  sendOtp(phone: string, code: string): Promise<void>;
}
