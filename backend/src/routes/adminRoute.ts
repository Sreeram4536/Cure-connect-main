import express from "express";
import upload from "../middlewares/multer";
import authRole from "../middlewares/authRole";
import {adminController,doctorController} from "../dependencyhandler/admin.dependency"


const adminRouter = express.Router();

adminRouter.post("/login", adminController.loginAdmin.bind(adminController));
adminRouter.post(
  "/refresh-token",
  adminController.refreshAdminToken.bind(adminController)
);

adminRouter.post(
  "/logout",
  adminController.logoutAdmin.bind(adminController)
);
adminRouter.get(
  "/users",
  authRole(["admin"]),
  adminController.getUsersPaginated.bind(adminController)
);
adminRouter.patch(
  "/users/:userId/block",
  authRole(["admin"]),
  adminController.toggleUserBlock.bind(adminController)
);
adminRouter.post(
  "/doctors",
  authRole(["admin"]),
  upload.single("image"),
  adminController.addDoctor.bind(adminController)
);
adminRouter.get(
  "/doctors",
  authRole(["admin"]),
  adminController.getDoctorsPaginated.bind(adminController)
);

adminRouter.patch(
  "/doctors/:id/approve",
  authRole(["admin"]),
  adminController.approveDoctor.bind(adminController)
);
adminRouter.patch(
  "/doctors/:id/reject",
  authRole(["admin"]),
  adminController.rejectDoctor.bind(adminController)
);

adminRouter.patch(
  "/doctors/:doctorId/availability",
  authRole(["admin"]),
  doctorController.changeAvailability.bind(doctorController)
);

adminRouter.patch(
  "/doctors/:doctorId/block",
  authRole(["admin"]),
  adminController.toggleDoctorBlock.bind(adminController)
);

adminRouter.get(
  "/appointments",
  authRole(["admin"]),
  adminController.appointmentsListPaginated.bind(adminController)
);

adminRouter.patch(
  "/appointments/:appointmentId/cancel",
  authRole(["admin"]),
  adminController.adminCancelAppointment.bind(adminController)
);

adminRouter.get(
  "/dashboard",
  authRole(["admin"]),
  adminController.adminDashboard.bind(adminController)
);

// Admin Wallet Routes
adminRouter.get(
  "/wallet/details",
  authRole(["admin"]),
  adminController.getAdminWalletDetails.bind(adminController)
);

adminRouter.get(
  "/wallet/transactions",
  authRole(["admin"]),
  adminController.getAdminWalletTransactions.bind(adminController)
);

adminRouter.get(
  "/wallet/balance",
  authRole(["admin"]),
  adminController.getAdminWalletBalance.bind(adminController)
);

export default adminRouter;
