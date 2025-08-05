import { Request, Response } from "express";
import { ISlotLockController } from "../interface/IslotlockController.interface";
import { ISlotLockService } from "../../services/interface/ISlotLockService";

class SlotLockController implements ISlotLockController {
  constructor(private slotLockService: ISlotLockService) {}

  async lockSlot(req: Request, res: Response) {
    const userId = (req as any).userId; // set by authRole middleware
    const { docId, slotDate, slotTime } = req.body;
    const result = await this.slotLockService.lockSlot({ userId, docId, slotDate, slotTime });
    if (result.success) {
      res.status(200).json({ success: true, appointmentId: result.appointmentId });
    } else {
      res.status(409).json({ success: false, message: result.message });
    }
  }

  async releaseSlot(req: Request, res: Response) {
    const { appointmentId } = req.params;
    const result = await this.slotLockService.releaseSlot({ appointmentId });
    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(404).json({ success: false, message: result.message });
    }
  }

  async confirmAppointment(req: Request, res: Response) {
    const { appointmentId } = req.params;
    const result = await this.slotLockService.confirmAppointment({ appointmentId });
    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(404).json({ success: false, message: result.message });
    }
  }

  async cancelAppointment(req: Request, res: Response) {
    const { appointmentId } = req.params;
    const result = await this.slotLockService.cancelAppointment({ appointmentId });
    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(404).json({ success: false, message: result.message });
    }
  }
}

export default SlotLockController; 