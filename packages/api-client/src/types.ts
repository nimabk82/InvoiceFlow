export type HealthResponse = Readonly<{
  environment: string;
  service: 'invoiceflow-api';
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}>;
