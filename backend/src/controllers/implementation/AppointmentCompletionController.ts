import { Request, Response } from "express";
import { HttpStatus } from "../../constants/status.constants";
import { IAppointmentCompletionService } from "../../services/interface/IAppointmentCompletionService";

export class AppointmentCompletionController {
  constructor(private _service: IAppointmentCompletionService) {}

  async complete(req: Request, res: Response) {
    try {
      const { appointmentId } = req.params as any;
      await this._service.completeAppointment(appointmentId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: e.message });
    }
  }
}


