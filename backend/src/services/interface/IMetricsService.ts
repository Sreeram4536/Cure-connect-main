export type Range = 'daily' | 'weekly' | 'monthly';

export interface TimeSeriesPoint {
  label: string;
  value: number;
}

export interface MetricsResponse {
  totals: {
    totalRevenue?: number;
    totalEarnings?: number;
    totalAppointments: number;
  };
  timeSeries: TimeSeriesPoint[];
  latestActivity: Array<{
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    createdAt: string;
  }>;
}

export interface IMetricsService {
  getAdminMetrics(range: Range, adminId?: string): Promise<MetricsResponse>;
  getDoctorMetrics(range: Range, doctorId: string): Promise<MetricsResponse>;
}
