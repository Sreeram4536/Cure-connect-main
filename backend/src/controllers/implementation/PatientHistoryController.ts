import { Request, Response } from "express";
import { IPatientHistoryController } from "../interface/IPatientHistoryController";
import { IPatientHistoryService } from "../../services/interface/IPatientHistoryService";
import { AuthRequest } from "../../types/customRequest";
import { PatientHistoryPopulateService } from "../../services/implementation/PatientHistoryPopulateService";
import { IAppointmentRepository } from "../../repositories/interface/IAppointmentRepository";
import { IPrescriptionRepository } from "../../repositories/interface/IPrescriptionRepository";
import { IDoctorRepository } from "../../repositories/interface/IDoctorRepository";
import { IUserRepository } from "../../repositories/interface/IUserRepository";

export class PatientHistoryController implements IPatientHistoryController {
  private populateService: PatientHistoryPopulateService;

  constructor(
    private patientHistoryService: IPatientHistoryService,
    private appointmentRepository: IAppointmentRepository,
    private prescriptionRepository: IPrescriptionRepository,
    private doctorRepository: IDoctorRepository,
    private userRepository: IUserRepository
  ) {
    this.populateService = new PatientHistoryPopulateService(
      patientHistoryService,
      appointmentRepository,
      prescriptionRepository,
      doctorRepository,
      userRepository
    );
  }

  async getPatientHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const doctorId = (req as AuthRequest).docId;

      console.log("PatientHistoryController - getPatientHistory called");
      console.log("userId from params:", userId);
      console.log("doctorId from auth:", doctorId);
      console.log("req.user:", (req as any).user);

      if (!doctorId) {
        console.log("No doctorId found, returning 401");
        res.status(401).json({ success: false, message: "Doctor not authenticated" });
        return;
      }

      if (!userId) {
        console.log("No userId found, returning 400");
        res.status(400).json({ success: false, message: "User ID is required" });
        return;
      }

      console.log("Calling patientHistoryService.getPatientHistoryForDoctor with:", { doctorId, userId });
      let patientHistory = await this.patientHistoryService.getPatientHistoryForDoctor(doctorId, userId);

      // If no patient history exists, try to populate it from existing appointments
      if (!patientHistory) {
        console.log("No patient history found, attempting to populate from appointments...");
        try {
          patientHistory = await this.populateService.populatePatientHistoryFromAppointments(doctorId, userId);
        } catch (populateError) {
          console.error("Error populating patient history:", populateError);
        }
      }

      if (!patientHistory) {
        res.status(404).json({ success: false, message: "No patient history found for this user" });
        return;
      }

      res.status(200).json({
        success: true,
        data: patientHistory,
        message: "Patient history retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting patient history:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  async getPatientsByDoctor(req: Request, res: Response): Promise<void> {
    try {
    //   const doctorId = req.user?.id;
    const doctorId = (req as AuthRequest).docId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!doctorId) {
        res.status(401).json({ success: false, message: "Doctor not authenticated" });
        return;
      }

      const result = await this.patientHistoryService.getPatientsByDoctorId(doctorId, page, limit);

      res.status(200).json({
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
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  async searchPatients(req: Request, res: Response): Promise<void> {
    try {
    //   
    const doctorId = (req as AuthRequest).docId;
      const { query } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!doctorId) {
        res.status(401).json({ success: false, message: "Doctor not authenticated" });
        return;
      }

      if (!query || typeof query !== 'string') {
        res.status(400).json({ success: false, message: "Search query is required" });
        return;
      }

      const result = await this.patientHistoryService.searchPatients(doctorId, query, page, limit);

      res.status(200).json({
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
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  async getMedicalHistoryByAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;

      if (!appointmentId) {
        res.status(400).json({ success: false, message: "Appointment ID is required" });
        return;
      }

      const medicalHistory = await this.patientHistoryService.getMedicalHistoryByAppointmentId(appointmentId);

      if (!medicalHistory) {
        res.status(404).json({ success: false, message: "Medical history not found for this appointment" });
        return;
      }

      res.status(200).json({
        success: true,
        data: medicalHistory,
        message: "Medical history retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting medical history by appointment:", error);
      res.status(500).json({
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
        res.status(400).json({ success: false, message: "User ID is required" });
        return;
      }

      const updatedPatient = await this.patientHistoryService.updatePatientBasicInfo(userId, updateData);

      if (!updatedPatient) {
        res.status(404).json({ success: false, message: "Patient not found" });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedPatient,
        message: "Patient information updated successfully"
      });
    } catch (error) {
      console.error("Error updating patient info:", error);
      res.status(500).json({
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
        res.status(400).json({ success: false, message: "User ID and Appointment ID are required" });
        return;
      }

      const updatedHistory = await this.patientHistoryService.updateMedicalHistoryEntry(userId, appointmentId, updateData);

      if (!updatedHistory) {
        res.status(404).json({ success: false, message: "Medical history entry not found" });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedHistory,
        message: "Medical history entry updated successfully"
      });
    } catch (error) {
      console.error("Error updating medical history entry:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  async deleteMedicalHistoryEntry(req: Request, res: Response): Promise<void> {
    try {
      const { userId, appointmentId } = req.params;

      if (!userId || !appointmentId) {
        res.status(400).json({ success: false, message: "User ID and Appointment ID are required" });
        return;
      }

      const updatedHistory = await this.patientHistoryService.deleteMedicalHistoryEntry(userId, appointmentId);

      if (!updatedHistory) {
        res.status(404).json({ success: false, message: "Medical history entry not found" });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedHistory,
        message: "Medical history entry deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting medical history entry:", error);
      res.status(500).json({
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
        res.status(400).json({ success: false, message: "User ID is required" });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({ success: false, message: "Start date and end date are required" });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({ success: false, message: "Invalid date format" });
        return;
      }

      const medicalHistory = await this.patientHistoryService.getPatientMedicalHistoryByDateRange(userId, start, end);

      res.status(200).json({
        success: true,
        data: medicalHistory,
        message: "Medical history retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting medical history by date range:", error);
      res.status(500).json({
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
        res.status(400).json({ success: false, message: "User ID is required" });
        return;
      }

      const medicalHistory = await this.patientHistoryService.getRecentMedicalHistory(userId, limit);

      res.status(200).json({
        success: true,
        data: medicalHistory,
        message: "Recent medical history retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting recent medical history:", error);
      res.status(500).json({
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
        res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
        return;
      }

      const result = await this.patientHistoryService.addMedicalHistoryFromAppointment(appointmentData);

      if (!result) {
        res.status(500).json({ success: false, message: "Failed to add medical history entry" });
        return;
      }

      res.status(201).json({
        success: true,
        data: result,
        message: "Medical history entry added successfully"
      });
    } catch (error) {
      console.error("Error adding medical history from appointment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
}
