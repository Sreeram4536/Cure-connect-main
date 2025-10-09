import { Router } from "express";
import { PatientHistoryController } from "../controllers/implementation/PatientHistoryController";
import { IPatientHistoryService } from "../services/interface/IPatientHistoryService";
import { IAppointmentRepository } from "../repositories/interface/IAppointmentRepository";
import { IPrescriptionRepository } from "../repositories/interface/IPrescriptionRepository";
import { IDoctorRepository } from "../repositories/interface/IDoctorRepository";
import { IUserRepository } from "../repositories/interface/IUserRepository";
import  authDoctor  from "../middlewares/authDoctor";

const router = Router();

// This will be injected from dependency handler
let patientHistoryController: PatientHistoryController;

export const initializePatientHistoryRoutes = (
  patientHistoryService: IPatientHistoryService,
  appointmentRepository: IAppointmentRepository,
  prescriptionRepository: IPrescriptionRepository,
  doctorRepository: IDoctorRepository,
  userRepository: IUserRepository
) => {
  patientHistoryController = new PatientHistoryController(
    patientHistoryService,
    appointmentRepository,
    prescriptionRepository,
    doctorRepository,
    userRepository
  );
  
  // All routes require doctor authentication
  router.use(authDoctor);

  // Get patient history for a specific patient
  router.get("/patient/:userId", (req, res) => {
    console.log("=== PATIENT HISTORY ROUTE HIT ===");
    console.log("URL:", req.url);
    console.log("Params:", req.params);
    console.log("Headers:", req.headers);
    console.log("=== END ROUTE DEBUG ===");
    patientHistoryController.getPatientHistory(req, res);
  });

  // Get all patients seen by the doctor
  router.get("/patients", (req, res) => patientHistoryController.getPatientsByDoctor(req, res));

  // Search patients
  router.get("/patients/search", (req, res) => patientHistoryController.searchPatients(req, res));

  // Get medical history for a specific appointment
  router.get("/appointment/:appointmentId", (req, res) => patientHistoryController.getMedicalHistoryByAppointment(req, res));

  // Update patient basic information
  router.put("/patient/:userId", (req, res) => patientHistoryController.updatePatientInfo(req, res));

  // Update medical history entry
  router.put("/patient/:userId/appointment/:appointmentId", (req, res) => patientHistoryController.updateMedicalHistoryEntry(req, res));

  // Delete medical history entry
  router.delete("/patient/:userId/appointment/:appointmentId", (req, res) => patientHistoryController.deleteMedicalHistoryEntry(req, res));

  // Get patient's medical history by date range
  router.get("/patient/:userId/date-range", (req, res) => patientHistoryController.getMedicalHistoryByDateRange(req, res));

  // Get recent medical history for a patient
  router.get("/patient/:userId/recent", (req, res) => patientHistoryController.getRecentMedicalHistory(req, res));

  // Add medical history from appointment completion
  router.post("/appointment", (req, res) => patientHistoryController.addMedicalHistoryFromAppointment(req, res));

  return router;
};

export default router;
