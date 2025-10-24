import { Router } from "express";
import { PatientHistoryController } from "../controllers/implementation/PatientHistoryController";
import { IPatientHistoryService } from "../services/interface/IPatientHistoryService";
import { IPatientHistoryPopulateService } from "../services/interface/IPatientHistoryPopulateService";
import  authDoctor  from "../middlewares/authDoctor";

const router = Router();


let patientHistoryController: PatientHistoryController;

export const initializePatientHistoryRoutes = (
  patientHistoryService: IPatientHistoryService,
  patientHistoryPopulateService: IPatientHistoryPopulateService
) => {
  patientHistoryController = new PatientHistoryController(
    patientHistoryService,
    patientHistoryPopulateService
  );
  
  // All routes require doctor authentication
  router.use(authDoctor);

  // Get patient history for a specific patient
  router.get("/patient/:userId", (req, res) => {
    console.log("URL:", req.url);
    console.log("Params:", req.params);
    console.log("Headers:", req.headers);
    console.log("=== END ROUTE DEBUG ===");
    patientHistoryController.getPatientHistory(req, res);
  });

 
  router.get("/patients", (req, res) => patientHistoryController.getPatientsByDoctor(req, res));

 
  router.get("/patients/search", (req, res) => patientHistoryController.searchPatients(req, res));

  
  router.get("/appointment/:appointmentId", (req, res) => patientHistoryController.getMedicalHistoryByAppointment(req, res));

  
  router.put("/patient/:userId", (req, res) => patientHistoryController.updatePatientInfo(req, res));

  
  router.put("/patient/:userId/appointment/:appointmentId", (req, res) => patientHistoryController.updateMedicalHistoryEntry(req, res));

  
  router.delete("/patient/:userId/appointment/:appointmentId", (req, res) => patientHistoryController.deleteMedicalHistoryEntry(req, res));

  
  router.get("/patient/:userId/date-range", (req, res) => patientHistoryController.getMedicalHistoryByDateRange(req, res));

  
  router.get("/patient/:userId/recent", (req, res) => patientHistoryController.getRecentMedicalHistory(req, res));

 
  router.post("/appointment", (req, res) => patientHistoryController.addMedicalHistoryFromAppointment(req, res));

  return router;
};

export default router;
