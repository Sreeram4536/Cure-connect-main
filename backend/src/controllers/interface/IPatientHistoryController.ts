import { Request, Response } from "express";

export interface IPatientHistoryController {
  // Get patient history for a specific patient
  getPatientHistory(req: Request, res: Response): Promise<void>;

  // Get all patients seen by the doctor
  getPatientsByDoctor(req: Request, res: Response): Promise<void>;

  // Search patients
  searchPatients(req: Request, res: Response): Promise<void>;

  // Get medical history for a specific appointment
  getMedicalHistoryByAppointment(req: Request, res: Response): Promise<void>;

  // Update patient basic information
  updatePatientInfo(req: Request, res: Response): Promise<void>;

  // Update medical history entry
  updateMedicalHistoryEntry(req: Request, res: Response): Promise<void>;

  // Delete medical history entry
  deleteMedicalHistoryEntry(req: Request, res: Response): Promise<void>;

  // Get patient's medical history by date range
  getMedicalHistoryByDateRange(req: Request, res: Response): Promise<void>;

  // Get recent medical history for a patient
  getRecentMedicalHistory(req: Request, res: Response): Promise<void>;

  // Add medical history from appointment completion
  addMedicalHistoryFromAppointment(req: Request, res: Response): Promise<void>;
}

