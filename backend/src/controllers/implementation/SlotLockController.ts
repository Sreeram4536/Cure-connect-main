import { Request, Response } from "express";
import { ISlotLockController } from "../interface/IslotlockController.interface";
import { ISlotLockService } from "../../services/interface/ISlotLockService";
import { AuthRequest } from "../../types/customRequest";
import { HttpStatus } from "../../constants/status.constants";

class SlotLockController implements ISlotLockController {
  constructor(private slotLockService: ISlotLockService) {}

  async lockSlot(req: Request, res: Response) {
    const userId = (req as AuthRequest).userId; 
    if (!userId) {
      res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "User not authenticated" });
      return;
    }
    const { docId, slotDate, slotTime } = req.body;
    const result = await this.slotLockService.lockSlot({ userId, docId, slotDate, slotTime });
    if (result.success) {
      res.status(HttpStatus.OK).json({ success: true, appointmentId: result.appointmentId });
    } else {
      res.status(HttpStatus.CONFLICT).json({ success: false, message: result.message });
    }
  }

  async releaseSlot(req: Request, res: Response) {
    const { appointmentId } = req.params;
    const result = await this.slotLockService.releaseSlot({ appointmentId });
    if (result.success) {
      res.status(HttpStatus.OK).json({ success: true, message: result.message });
    } else {
      res.status(HttpStatus.NOT_FOUND).json({ success: false, message: result.message });
    }
  }

  async confirmAppointment(req: Request, res: Response) {
    const { appointmentId } = req.params;
    const result = await this.slotLockService.confirmAppointment({ appointmentId });
    if (result.success) {
      res.status(HttpStatus.OK).json({ success: true, message: result.message });
    } else {
      res.status(HttpStatus.NOT_FOUND).json({ success: false, message: result.message });
    }
  }

  async cancelAppointment(req: Request, res: Response) {
    const { appointmentId } = req.params;
    const result = await this.slotLockService.cancelAppointment({ appointmentId });
    if (result.success) {
      res.status(HttpStatus.OK).json({ success: true, message: result.message });
    } else {
      res.status(HttpStatus.NOT_FOUND).json({ success: false, message: result.message });
    }
  }
}

export default SlotLockController; 