import { Request, Response } from "express";
import { IMetricsService } from "../../services/interface/IMetricsService";
import { HttpStatus } from "../../constants/status.constants";

export class AdminMetricsController  {
  private _metricsService: IMetricsService;

  constructor(metricsService: IMetricsService) {
    this._metricsService = metricsService;
  }

  public async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const rangeParam = (req.query.range as string) || "monthly";
      const range = ["daily", "weekly", "monthly"].includes(rangeParam) ? (rangeParam as "daily" | "weekly" | "monthly") : "monthly";

      const adminId = process.env.ADMIN_WALLET_ID || (req as any).adminId;
      const metrics = await this._metricsService.getAdminMetrics(range, adminId);

      res.status(HttpStatus.OK).json({ success: true, data: metrics });
    } catch (error) {
      console.error("Error in AdminMetricsController:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to load metrics" 
      });
    }
  }
}


