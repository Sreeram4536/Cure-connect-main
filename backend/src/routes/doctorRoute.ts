import express, { NextFunction, Request, Response } from "express";
import upload from "../middlewares/multer";
import authRole from "../middlewares/authRole";
import {doctorController,slotLockController,slotRuleController} from "../dependencyhandler/doctor.dependency"
import { DoctorMetricsController } from "../controllers/implementation/DoctorMetricsController";
import { doctorMetricsService, prescriptionController, appointmentCompletionController } from "../dependencyhandler/doctor.dependency";

const doctorRouter = express.Router();
const doctorMetricsController = new DoctorMetricsController(doctorMetricsService);

function asyncHandler(fn: any) {
  return function(req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

doctorRouter.get("/", doctorController.getDoctorsPaginated.bind(doctorController));
doctorRouter.post(
  "/register",
  upload.single("image"),
  doctorController.registerDoctor.bind(doctorController)
);
doctorRouter.patch(
  "/availability",
  authRole(["doctor"]),
  doctorController.changeAvailability.bind(doctorController)
);
doctorRouter.post(
  "/login",
  doctorController.loginDoctor.bind(doctorController)
);

doctorRouter.post(
  "/refresh-token",
  doctorController.refreshDoctorToken.bind(doctorController)
);

doctorRouter.post(
  "/logout",
  doctorController.logoutDoctor.bind(doctorController)
);

doctorRouter.get(
  "/appointments",
  authRole(["doctor"]),
  doctorController.appointmentsDoctorPaginated.bind(doctorController)
);
doctorRouter.patch(
  "/appointments/:appointmentId/confirm",
  authRole(["doctor"]),
  doctorController.appointmentConfirm.bind(doctorController)
);

doctorRouter.patch(
  "/appointments/:appointmentId/cancel",
  authRole(["doctor"]),
  doctorController.appointmentCancel.bind(doctorController)
);

doctorRouter.get(
  "/profile",
  authRole(["doctor"]),
  doctorController.doctorProfile.bind(doctorController)
);

doctorRouter.get(
  "/dashboard",
  authRole(["doctor"]),
  doctorController.doctorDashboard.bind(doctorController)
);

doctorRouter.get(
  "/dashboard/metrics",
  authRole(["doctor"]),
  doctorMetricsController.getMetrics.bind(doctorMetricsController)
);

doctorRouter.patch(
  "/profile/update",
  authRole(["doctor"]),
  upload.single("image"),
  doctorController.updateDoctorProfile.bind(doctorController)
);

doctorRouter.get(
  "/slots",
  authRole(["doctor"]),
  doctorController.getMonthlySlots.bind(doctorController)
);

doctorRouter.get(
  "/slots/date",
  authRole(["doctor"]),
  doctorController.getSlotsForDate.bind(doctorController)
);

doctorRouter.post(
  "/slots",
  authRole(["doctor"]),
  doctorController.updateDaySlot.bind(doctorController)
);

doctorRouter.get(
  "/slot-rule",
  authRole(["doctor"]),
  slotRuleController.getRule.bind(slotRuleController)
);
doctorRouter.post(
  "/slot-rule",
  authRole(["doctor"]),
  slotRuleController.setRule.bind(slotRuleController)
);
doctorRouter.patch(
  "/slot-rule/custom-slot",
  authRole(["doctor"]),
  asyncHandler(slotRuleController.updateCustomSlot.bind(slotRuleController))
);
doctorRouter.patch(
  "/slot-rule/cancel-slot",
  authRole(["doctor"]),
  asyncHandler(slotRuleController.cancelCustomSlot.bind(slotRuleController))
);

// New leave management routes
doctorRouter.post(
  "/leave/set",
  authRole(["doctor"]),
  asyncHandler(slotRuleController.setDayAsLeave.bind(slotRuleController))
);

doctorRouter.delete(
  "/leave/remove/:date",
  authRole(["doctor"]),
  asyncHandler(slotRuleController.removeDayLeave.bind(slotRuleController))
);

doctorRouter.post(
  "/slot/lock",
  authRole(["doctor", "user"]),
  slotLockController.lockSlot.bind(slotLockController)
);

doctorRouter.patch(
  "/slot/release/:appointmentId",
  authRole(["doctor", "user"]),
  slotLockController.releaseSlot.bind(slotLockController)
);

doctorRouter.patch(
  "/appointment/confirm/:appointmentId",
  authRole(["doctor"]),
  slotLockController.confirmAppointment.bind(slotLockController)
);

doctorRouter.patch(
  "/appointment/cancel/:appointmentId",
  authRole(["doctor", "user"]),
  slotLockController.cancelAppointment.bind(slotLockController)
);

doctorRouter.get("/top", doctorController.getTopDoctors.bind(doctorController));

export default doctorRouter;
// Prescription & complete routes (doctor)
doctorRouter.post(
  "/appointments/:appointmentId/prescription",
  authRole(["doctor"]),
  prescriptionController.create.bind(prescriptionController)
);
doctorRouter.patch(
  "/appointments/:appointmentId/complete",
  authRole(["doctor"]),
  asyncHandler(appointmentCompletionController.complete.bind(appointmentCompletionController))
);

doctorRouter.get(
  "/patients/:userId/history",
  authRole(["doctor"]),
  prescriptionController.listByDoctor.bind(prescriptionController)
);
