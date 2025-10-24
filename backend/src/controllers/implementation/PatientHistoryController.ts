import { Request, Response } from "express";
import { IPatientHistoryController } from "../interface/IPatientHistoryController";
import { IPatientHistoryService } from "../../services/interface/IPatientHistoryService";
import { AuthRequest } from "../../types/customRequest";
import { IPatientHistoryPopulateService } from "../../services/interface/IPatientHistoryPopulateService";
import { HttpStatus } from "../../constants/status.constants";

export class PatientHistoryController implements IPatientHistoryController {
  constructor(
    private _patientHistoryService: IPatientHistoryService,
    private _populateService: IPatientHistoryPopulateService
  ) {}

  async getPatientHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const doctorId = (req as AuthRequest).docId;

      if (!doctorId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ 
          success: false, 
          message: "Doctor not authenticated" 
        });
        return;
      }

      if (!userId) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: "User ID is required" 
        });
        return;
      }

      let patientHistory = await this._patientHistoryService.getPatientHistoryForDoctor(doctorId, userId);

      
      if (!patientHistory) {
        try {
          patientHistory = await this._populateService.populatePatientHistoryFromAppointments(doctorId, userId);
        } catch (populateError) {
          console.error("Error populating patient history:", populateError);
        }
      }

      if (!patientHistory) {
        res.status(HttpStatus.NOT_FOUND).json({ 
          success: false, 
          message: "No patient history found for this user" 
        });
        return;
      }

      res.status(HttpStatus.OK).json({
        success: true,
        data: patientHistory,
        message: "Patient history retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting patient history:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  async getPatientsByDoctor(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as AuthRequest).docId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!doctorId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ 
          success: false, 
          message: "Doctor not authenticated" 
        });
        return;
      }

      const result = await this._patientHistoryService.getPatientsByDoctorId(doctorId, page, limit);

      res.status(HttpStatus.OK).json({
        success: true,
        data: result.data,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage
        },
        message: "Patients retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting patients by doctor:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  async searchPatients(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as AuthRequest).docId;
      const { query } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!doctorId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ 
          success: false, 
          message: "Doctor not authenticated" 
        });
        return;
      }

      if (!query || typeof query !== 'string') {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: "Search query is required" 
        });
        return;
      }

      const result = await this._patientHistoryService.searchPatients(doctorId, query, page, limit);

      res.status(HttpStatus.OK).json({
        success: true,
        data: result.data,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage
        },
        message: "Search results retrieved successfully"
      });
    } catch (error) {
      console.error("Error searching patients:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  async getMedicalHistoryByAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;

      if (!appointmentId) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: "Appointment ID is required" 
        });
        return;
      }

      const medicalHistory = await this._patientHistoryService.getMedicalHistoryByAppointmentId(appointmentId);

      if (!medicalHistory) {
        res.status(HttpStatus.NOT_FOUND).json({ 
          success: false, 
          message: "Medical history not found for this appointment" 
        });
        return;
      }

      res.status(HttpStatus.OK).json({
        success: true,
        data: medicalHistory,
        message: "Medical history retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting medical history by appointment:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  async updatePatientInfo(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      if (!userId) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: "User ID is required" 
        });
        return;
      }

      const updatedPatient = await this._patientHistoryService.updatePatientBasicInfo(userId, updateData);

      if (!updatedPatient) {
        res.status(HttpStatus.NOT_FOUND).json({ 
          success: false, 
          message: "Patient not found" 
        });
        return;
      }

      res.status(HttpStatus.OK).json({
        success: true,
        data: updatedPatient,
        message: "Patient information updated successfully"
      });
    } catch (error) {
      console.error("Error updating patient info:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  async updateMedicalHistoryEntry(req: Request, res: Response): Promise<void> {
    try {
      const { userId, appointmentId } = req.params;
      const updateData = req.body;

      if (!userId || !appointmentId) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: "User ID and Appointment ID are required" 
        });
        return;
      }

      const updatedHistory = await this._patientHistoryService.updateMedicalHistoryEntry(userId, appointmentId, updateData);

      if (!updatedHistory) {
        res.status(HttpStatus.NOT_FOUND).json({ 
          success: false, 
          message: "Medical history entry not found" 
        });
        return;
      }

      res.status(HttpStatus.OK).json({
        success: true,
        data: updatedHistory,
        message: "Medical history entry updated successfully"
      });
    } catch (error) {
      console.error("Error updating medical history entry:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  async deleteMedicalHistoryEntry(req: Request, res: Response): Promise<void> {
    try {
      const { userId, appointmentId } = req.params;

      if (!userId || !appointmentId) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: "User ID and Appointment ID are required" 
        });
        return;
      }

      const updatedHistory = await this._patientHistoryService.deleteMedicalHistoryEntry(userId, appointmentId);

      if (!updatedHistory) {
        res.status(HttpStatus.NOT_FOUND).json({ 
          success: false, 
          message: "Medical history entry not found" 
        });
        return;
      }

      res.status(HttpStatus.OK).json({
        success: true,
        data: updatedHistory,
        message: "Medical history entry deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting medical history entry:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  async getMedicalHistoryByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      if (!userId) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: "User ID is required" 
        });
        return;
      }

      if (!startDate || !endDate) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: "Start date and end date are required" 
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: "Invalid date format" 
        });
        return;
      }

      const medicalHistory = await this._patientHistoryService.getPatientMedicalHistoryByDateRange(userId, start, end);

      res.status(HttpStatus.OK).json({
        success: true,
        data: medicalHistory,
        message: "Medical history retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting medical history by date range:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  async getRecentMedicalHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;

      if (!userId) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: "User ID is required" 
        });
        return;
      }

      const medicalHistory = await this._patientHistoryService.getRecentMedicalHistory(userId, limit);

      res.status(HttpStatus.OK).json({
        success: true,
        data: medicalHistory,
        message: "Recent medical history retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting recent medical history:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  async addMedicalHistoryFromAppointment(req: Request, res: Response): Promise<void> {
    try {
      const appointmentData = req.body;

      // Validate required fields
      const requiredFields = ['appointmentId', 'userId', 'doctorId', 'doctorName', 'doctorSpeciality', 'appointmentDate', 'diagnosis'];
      const missingFields = requiredFields.filter(field => !appointmentData[field]);

      if (missingFields.length > 0) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
        return;
      }

      const result = await this._patientHistoryService.addMedicalHistoryFromAppointment(appointmentData);

      if (!result) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
          success: false, 
          message: "Failed to add medical history entry" 
        });
        return;
      }

      res.status(HttpStatus.CREATED).json({
        success: true,
        data: result,
        message: "Medical history entry added successfully"
      });
    } catch (error) {
      console.error("Error adding medical history from appointment:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
}
