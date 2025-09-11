import { Request, Response } from "express";
import { IMetricsService } from "../../services/interface/IMetricsService";

export class DoctorMetricsController {
  private metricsService: IMetricsService;

  constructor(metricsService: IMetricsService) {
    this.metricsService = metricsService;
  }

  public async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const rangeParam = (req.query.range as string) || "monthly";
      const range = ["daily", "weekly", "monthly"].includes(rangeParam) ? (rangeParam as "daily" | "weekly" | "monthly") : "monthly";

      const docId = (req as any).docId;
      if (!docId) {
        res.status(400).json({ success: false, message: "Doctor id not found in token" });
        return;
      }

      const metrics = await this.metricsService.getDoctorMetrics(range, docId);

      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      console.error("Error in DoctorMetricsController:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to load metrics" 
      });
    }
  }
}


