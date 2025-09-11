import { Request, Response } from "express";
import { IMetricsService } from "../../services/interface/IMetricsService";

export class AdminMetricsController {
  private metricsService: IMetricsService;

  constructor(metricsService: IMetricsService) {
    this.metricsService = metricsService;
  }

  public async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const rangeParam = (req.query.range as string) || "monthly";
      const range = ["daily", "weekly", "monthly"].includes(rangeParam) ? (rangeParam as "daily" | "weekly" | "monthly") : "monthly";

      const adminId = process.env.ADMIN_WALLET_ID || (req as any).adminId;
      const metrics = await this.metricsService.getAdminMetrics(range, adminId);

      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      console.error("Error in AdminMetricsController:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to load metrics" 
      });
    }
  }
}


