import { Request, Response } from "express";
import { IPrescriptionController } from "../interface/IPrescriptionController";
import { IPrescriptionService } from "../../services/interface/IPrescriptionService";
import { HttpStatus } from "../../constants/status.constants";

export class PrescriptionController implements IPrescriptionController {
  constructor(private _service: IPrescriptionService) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params as any;
      const doctorId = (req as any).docId as string;
      const { userId, items, notes } = req.body;

      if (!appointmentId) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: "Appointment ID is required" 
        });
        return;
      }

      if (!doctorId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ 
          success: false, 
          message: "Doctor not authenticated" 
        });
        return;
      }

      if (!userId || !items || !Array.isArray(items)) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: "User ID and prescription items are required" 
        });
        return;
      }

      const saved = await this._service.addPrescription(appointmentId, doctorId, userId, items, notes);
      res.status(HttpStatus.CREATED).json({ 
        success: true, 
        prescription: saved,
        message: "Prescription created successfully"
      });
    } catch (e: any) {
      console.error("Error creating prescription:", e);
      res.status(HttpStatus.BAD_REQUEST).json({ 
        success: false, 
        message: e.message 
      });
    }
  }

  async getByAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params as any;
      
      if (!appointmentId) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: "Appointment ID is required" 
        });
        return;
      }

      const data = await this._service.getByAppointment(appointmentId);
      
      if (!data) {
        res.status(HttpStatus.NOT_FOUND).json({ 
          success: false, 
          message: "Prescription not found for this appointment" 
        });
        return;
      }

      res.status(HttpStatus.OK).json({ 
        success: true, 
        prescription: data,
        message: "Prescription retrieved successfully"
      });
    } catch (e: any) {
      console.error("Error getting prescription by appointment:", e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  }

  async listByUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId as string;
      
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ 
          success: false, 
          message: "User not authenticated" 
        });
        return;
      }

      const list = await this._service.listByUser(userId);
      res.status(HttpStatus.OK).json({ 
        success: true, 
        prescriptions: list,
        message: "Prescriptions retrieved successfully"
      });
    } catch (e: any) {
      console.error("Error listing prescriptions by user:", e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  }

  async listByDoctor(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).docId as string;
      const { userId } = req.params as any;
      
      if (!doctorId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ 
          success: false, 
          message: "Doctor not authenticated" 
        });
        return;
      }

      const list = await this._service.listByDoctor(doctorId, userId);
      res.status(HttpStatus.OK).json({ 
        success: true, 
        prescriptions: list,
        message: "Prescriptions retrieved successfully"
      });
    } catch (e: any) {
      console.error("Error listing prescriptions by doctor:", e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  }
}


