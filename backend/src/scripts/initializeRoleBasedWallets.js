const mongoose = require('mongoose');
const walletModel = require('../models/walletModel');
const userModel = require('../models/userModel');
const doctorModel = require('../models/doctorModel');
const adminModel = require('../models/adminModel');

async function initializeRoleBasedWallets() {
  try {
    console.log('Starting wallet initialization for all roles...');

    // Initialize user wallets
    const users = await userModel.find({});
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      const existingWallet = await walletModel.findOne({ userId: user._id.toString(), userRole: 'user' });
      if (!existingWallet) {
        await walletModel.create({
          userId: user._id.toString(),
          userRole: 'user',
          balance: 0,
          transactions: []
        });
        console.log(`Created wallet for user: ${user.email}`);
      }
    }

    // Initialize doctor wallets
    const doctors = await doctorModel.find({});
    console.log(`Found ${doctors.length} doctors`);
    
    for (const doctor of doctors) {
      const existingWallet = await walletModel.findOne({ userId: doctor._id.toString(), userRole: 'doctor' });
      if (!existingWallet) {
        await walletModel.create({
          userId: doctor._id.toString(),
          userRole: 'doctor',
          balance: 0,
          transactions: []
        });
        console.log(`Created wallet for doctor: ${doctor.email}`);
      }
    }

    // Initialize admin wallets
    const admins = await adminModel.find({});
    console.log(`Found ${admins.length} admins`);
    
    for (const admin of admins) {
      const existingWallet = await walletModel.findOne({ userId: admin._id.toString(), userRole: 'admin' });
      if (!existingWallet) {
        await walletModel.create({
          userId: admin._id.toString(),
          userRole: 'admin',
          balance: 0,
          transactions: []
        });
        console.log(`Created wallet for admin: ${admin.email}`);
      }
    }

    // Create system admin wallet if it doesn't exist
    const systemAdminWallet = await walletModel.findOne({ userId: 'system-admin', userRole: 'admin' });
    if (!systemAdminWallet) {
      await walletModel.create({
        userId: 'system-admin',
        userRole: 'admin',
        balance: 0,
        transactions: []
      });
      console.log('Created system admin wallet for revenue sharing');
    }

    console.log('Wallet initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing wallets:', error);
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  // Connect to MongoDB (you'll need to set your connection string)
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cureconnect')
    .then(() => {
      console.log('Connected to MongoDB');
      return initializeRoleBasedWallets();
    })
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeRoleBasedWallets };
