export interface NotificationSendResult {
  success: boolean;
  error?: string;
}

export interface NotificationProvider {
  send(recipient: string, subject: string, body: string): Promise<NotificationSendResult>;
}
