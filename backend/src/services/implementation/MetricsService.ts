import { IMetricsService, Range, TimeSeriesPoint, MetricsResponse } from "../interface/IMetricsService";
import { IWalletRepository } from "../../repositories/interface/IWalletRepository";
import { IAppointmentRepository } from "../../repositories/interface/IAppointmentRepository";
import { IAdminRepository } from "../../repositories/interface/IAdminRepository";

export class MetricsService implements IMetricsService {
  private walletRepository: IWalletRepository;
  private appointmentRepository: IAppointmentRepository;
  private adminRepository: IAdminRepository;

  constructor(
    walletRepository: IWalletRepository,
    appointmentRepository: IAppointmentRepository,
    adminRepository: IAdminRepository
  ) {
    this.walletRepository = walletRepository;
    this.appointmentRepository = appointmentRepository;
    this.adminRepository = adminRepository;
  }

  private getDateBuckets(range: Range): { starts: Date[]; labels: string[] } {
    const now = new Date();
    const starts: Date[] = [];
    const labels: string[] = [];
    
    if (range === "daily") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        starts.push(d);
        labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
      }
    } else if (range === "weekly") {
      const startOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = (d.getDay() + 6) % 7; // Monday=0
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        return d;
      };
      let start = startOfWeek(now);
      for (let i = 7; i >= 0; i--) {
        const d = new Date(start);
        d.setDate(d.getDate() - i * 7);
        starts.push(d);
        labels.push(`${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
      }
    } else {
      // monthly - last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        starts.push(d);
        labels.push(d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
      }
    }
    return { starts, labels };
  }

  async getAdminMetrics(range: Range, adminId?: string): Promise<MetricsResponse> {
    let resolvedAdminId = adminId;
    
    // If no adminId provided, try to find the first admin
    if (!resolvedAdminId) {
      const admin = await this.adminRepository.findFirstAdmin();
      if (!admin) {
        throw new Error("No admin found and no adminId provided");
      }
      resolvedAdminId = admin._id.toString();
    }

    // Get admin wallet and totals
    const adminWallet = await this.walletRepository.getWalletByUserId(resolvedAdminId, 'admin');
    const totalRevenue = adminWallet?.balance ?? 0;
    const totalAppointments = await this.appointmentRepository.countPaidAppointments();

    // Generate time series data
    const { starts, labels } = this.getDateBuckets(range);
    const ends: Date[] = starts.map((s, idx) => {
      const e = new Date(starts[idx]);
      if (range === "daily") e.setDate(e.getDate() + 1);
      else if (range === "weekly") e.setDate(e.getDate() + 7);
      else e.setMonth(e.getMonth() + 1);
      return e;
    });

    const series: number[] = new Array(labels.length).fill(0);
    if (adminWallet && adminWallet.transactions && adminWallet.transactions.length) {
      for (const tx of adminWallet.transactions) {
        if (tx.type !== "credit") continue;
        const t = new Date(tx.createdAt);
        for (let i = 0; i < starts.length; i++) {
          if (t >= starts[i] && t < ends[i]) {
            series[i] += tx.amount;
            break;
          }
        }
      }
    }

    const timeSeries: TimeSeriesPoint[] = labels.map((label, idx) => ({ label, value: series[idx] }));

    // Get latest activity
    const latestActivity = (adminWallet?.transactions || [])
      .slice(-10)
      .reverse()
      .map((t) => ({ 
        amount: t.amount, 
        type: t.type, 
        description: t.description, 
        createdAt: (t.createdAt as any as Date).toISOString() 
      }));

    return {
      totals: { totalRevenue, totalAppointments },
      timeSeries,
      latestActivity,
    };
  }

  async getDoctorMetrics(range: Range, doctorId: string): Promise<MetricsResponse> {
    // Get doctor wallet and totals
    const doctorWallet = await this.walletRepository.getWalletByUserId(doctorId, 'doctor');
    const totalEarnings = doctorWallet?.balance ?? 0;
    const totalAppointments = await this.appointmentRepository.countPaidAppointmentsByDoctor(doctorId);

    // Generate time series data
    const { starts, labels } = this.getDateBuckets(range);
    const ends: Date[] = starts.map((s, idx) => {
      const e = new Date(starts[idx]);
      if (range === "daily") e.setDate(e.getDate() + 1);
      else if (range === "weekly") e.setDate(e.getDate() + 7);
      else e.setMonth(e.getMonth() + 1);
      return e;
    });

    const series: number[] = new Array(labels.length).fill(0);
    if (doctorWallet && doctorWallet.transactions && doctorWallet.transactions.length) {
      for (const tx of doctorWallet.transactions) {
        if (tx.type !== "credit") continue;
        const t = new Date(tx.createdAt);
        for (let i = 0; i < starts.length; i++) {
          if (t >= starts[i] && t < ends[i]) {
            series[i] += tx.amount;
            break;
          }
        }
      }
    }

    const timeSeries: TimeSeriesPoint[] = labels.map((label, idx) => ({ label, value: series[idx] }));

    // Get latest activity
    const latestActivity = (doctorWallet?.transactions || [])
      .slice(-10)
      .reverse()
      .map((t) => ({ 
        amount: t.amount, 
        type: t.type, 
        description: t.description, 
        createdAt: (t.createdAt as any as Date).toISOString() 
      }));

    return {
      totals: { totalEarnings, totalAppointments },
      timeSeries,
      latestActivity,
    };
  }
}
