import { Request, Response } from "express";
import { IMetricsService } from "../../services/interface/IMetricsService";
import { HttpStatus } from "../../constants/status.constants";

export class DoctorMetricsController {
  private _metricsService: IMetricsService;

  constructor(metricsService: IMetricsService) {
    this._metricsService = metricsService;
  }

  public async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const rangeParam = (req.query.range as string) || "monthly";
      const range = ["daily", "weekly", "monthly"].includes(rangeParam) ? (rangeParam as "daily" | "weekly" | "monthly") : "monthly";

      const docId = (req as any).docId;
      if (!docId) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Doctor id not found in token" });
        return;
      }

      const metrics = await this._metricsService.getDoctorMetrics(range, docId);

      res.status(HttpStatus.OK).json({ success: true, data: metrics });
    } catch (error) {
      console.error("Error in DoctorMetricsController:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to load metrics" 
      });
    }
  }
}


