/** واجهة مزوّد البريد الإلكتروني. */
export interface EmailProvider {
  readonly name: string;
  send(to: string, subject: string, body: string): Promise<void>;
}
