# Wallet Implementation for Doctor and Admin with Revenue Sharing

## Overview
Successfully implemented wallet functionality for doctors and admins with 80/20 revenue sharing following SOLID principles and proper DTO mapping.

## Implementation Details

### 1. Enhanced Wallet Model (`/backend/src/models/walletModel.ts`)
- Added `userType` field to support 'user', 'doctor', 'admin'
- Created compound index for `userId` and `userType` for unique wallets per user type
- Maintains backward compatibility with existing user wallets

### 2. Extended Type Definitions (`/backend/src/types/wallet.d.ts`)
- Added `userType` to all wallet interfaces
- Created revenue sharing types:
  - `RevenueDistributionData`
  - `RevenueDistributionResult`
  - `CreateWalletData`

### 3. Revenue Distribution Service (NEW)
**Files Created:**
- `/backend/src/services/interface/IRevenueDistributionService.ts`
- `/backend/src/services/implementation/RevenueDistributionService.ts`
- `/backend/src/constants/revenue.constants.ts`

**Features:**
- Implements SOLID principles (SRP, OCP, DIP)
- Configurable revenue sharing percentages (80% doctor, 20% admin)
- Automatic wallet creation for doctor and admin
- Proper error handling and logging

### 4. Extended Wallet Repository (`/backend/src/repositories/implementation/WalletRepository.ts`)
**New Methods:**
- `createWalletByType(userId, userType)`
- `getWalletByUserIdAndType(userId, userType)`
- `updateWalletBalanceByType(userId, userType, amount, type)`
- `addTransactionByType(transactionData, userType)`
- `getTransactionsByUserIdAndType(userId, userType, page, limit, sortBy, sortOrder)`
- `getWalletBalanceByType(userId, userType)`

**Backward Compatibility:**
- All existing methods now delegate to type-aware versions with 'user' as default type

### 5. Extended Wallet Service (`/backend/src/services/implementation/WalletService.ts`)
**New Methods:**
- `createWalletByType(userId, userType)`
- `getWalletBalanceByType(userId, userType)`
- `getWalletTransactionsByType(userId, userType, page, limit, sortBy, sortOrder)`
- `getWalletDetailsByType(userId, userType)`
- `creditWallet(userId, userType, amount, appointmentId, description)`
- `debitWallet(userId, userType, amount, appointmentId, description)`

**Enhanced Methods:**
- `ensureWalletExists()` now accepts optional `userType` parameter

### 6. Payment Integration 
**WalletPaymentService (`/backend/src/services/implementation/WalletPaymentService.ts`):**
- Integrated revenue distribution into wallet payment flow
- Both `processWalletPayment()` and `finalizeWalletPayment()` now trigger revenue sharing

**UserService (`/backend/src/services/implementation/UserService.ts`):**
- Updated `verifyPayment()` method to include revenue distribution for Razorpay payments
- Ensures revenue sharing happens for both wallet and Razorpay payment methods
- Added proper error handling without breaking payment verification flow

### 7. Doctor Wallet Integration
**Controller Methods Added to DoctorController:**
- `getDoctorWalletDetails(req, res)`
- `getDoctorWalletTransactions(req, res)`
- `getDoctorWalletBalance(req, res)`

**Service Methods Added to DoctorService:**
- `getDoctorWalletDetails(doctorId)`
- `getDoctorWalletTransactions(doctorId, page, limit, sortBy, sortOrder)`
- `getDoctorWalletBalance(doctorId)`

**Routes Added to `/backend/src/routes/doctorRoute.ts`:**
- `GET /api/doctor/wallet/details` - Get doctor wallet details
- `GET /api/doctor/wallet/transactions` - Get doctor wallet transactions (paginated)
- `GET /api/doctor/wallet/balance` - Get doctor wallet balance

### 8. Admin Wallet Integration
**Controller Methods Added to AdminController:**
- `getAdminWalletDetails(req, res)`
- `getAdminWalletTransactions(req, res)`
- `getAdminWalletBalance(req, res)`

**Service Methods Added to AdminService:**
- `getAdminWalletDetails(adminId)`
- `getAdminWalletTransactions(adminId, page, limit, sortBy, sortOrder)`
- `getAdminWalletBalance(adminId)`

**Routes Added to `/backend/src/routes/adminRoute.ts`:**
- `GET /api/admin/wallet/details` - Get admin wallet details
- `GET /api/admin/wallet/transactions` - Get admin wallet transactions (paginated)
- `GET /api/admin/wallet/balance` - Get admin wallet balance

### 9. Dependency Injection Updates
**Updated Files:**
- `/backend/src/dependencyhandler/wallet.dependency.ts` - Added RevenueDistributionService
- `/backend/src/dependencyhandler/user.dependency.ts` - Integrated RevenueDistributionService into WalletPaymentService

### 10. Automatic Wallet Creation
- Doctor wallets are created when admin approves a doctor
- Admin wallets are created during admin login
- User wallets continue to be created during user registration (existing functionality)

## Revenue Sharing Flow

**For Wallet Payments:**
1. **User pays for appointment** → User wallet debited
2. **Payment processed** → Revenue distribution triggered immediately
3. **Doctor receives 80%** → Credited to doctor wallet
4. **Admin receives 20%** → Credited to admin (system) wallet

**For Razorpay Payments:**
1. **User pays via Razorpay** → External payment gateway
2. **Payment verified in verifyPayment()** → Revenue distribution triggered
3. **Doctor receives 80%** → Credited to doctor wallet  
4. **Admin receives 20%** → Credited to admin (system) wallet

**Revenue distribution happens for BOTH payment methods ensuring consistent earning distribution.**

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- `RevenueDistributionService` - Only handles revenue distribution
- `WalletService` - Only handles wallet operations
- `WalletPaymentService` - Only handles payment processing

### Open/Closed Principle (OCP)
- Revenue percentages configurable via constants
- Easy to extend for new user types
- Revenue calculation logic separated into utility class

### Liskov Substitution Principle (LSP)
- All services implement their respective interfaces
- Backward compatibility maintained

### Interface Segregation Principle (ISP)
- Separate interfaces for different services
- No forced implementation of unused methods

### Dependency Inversion Principle (DIP)
- Services depend on interfaces, not concrete implementations
- Dependency injection used throughout

## API Endpoints

### Doctor Wallet Endpoints
```
GET /api/doctor/wallet/details
GET /api/doctor/wallet/transactions?page=1&limit=10&sortBy=createdAt&sortOrder=desc
GET /api/doctor/wallet/balance
```

### Admin Wallet Endpoints
```
GET /api/admin/wallet/details
GET /api/admin/wallet/transactions?page=1&limit=10&sortBy=createdAt&sortOrder=desc
GET /api/admin/wallet/balance
```

## Database Schema Changes
- Added `userType` field to wallet documents
- Created compound index on `userId` and `userType`
- Maintains existing wallet data structure

## Testing Recommendations
1. Test revenue distribution with sample appointments
2. Verify doctor wallet creation on approval
3. Verify admin wallet creation on login
4. Test all new API endpoints
5. Verify backward compatibility with existing user wallets

## Next Steps
1. Install missing dependencies if needed: `npm install`
2. Run database migrations if required
3. Test the implementation with sample data
4. Add frontend integration for doctor and admin wallet views
5. Add environment variable for `SYSTEM_ADMIN_ID`

## Configuration
Add to your `.env` file:
```
SYSTEM_ADMIN_ID=your_system_admin_id_here
```

## Revenue Sharing Example
- Appointment fee: ₹1000
- Doctor receives: ₹800 (80%)
- Admin receives: ₹200 (20%)