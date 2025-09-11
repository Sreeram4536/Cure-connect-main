const mongoose = require('mongoose');
const walletModel = require('../../dist/models/walletModel').default;
const adminModel = require('../../dist/models/adminModel').default;

async function setupAdminWallet() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Find the first admin
    const admin = await adminModel.findOne().lean();
    if (!admin) {
      console.log('No admin found. Please create an admin first.');
      return;
    }

    console.log('Found admin:', admin.email);

    // Check if admin wallet already exists
    let adminWallet = await walletModel.findOne({ userId: admin._id.toString(), userRole: 'admin' });
    
    if (!adminWallet) {
      // Create admin wallet
      adminWallet = new walletModel({
        userId: admin._id.toString(),
        userRole: 'admin',
        balance: 0,
        transactions: []
      });
      await adminWallet.save();
      console.log('Created admin wallet');
    } else {
      console.log('Admin wallet already exists');
    }

    console.log('Admin Wallet ID:', admin._id.toString());
    console.log('Please set this as ADMIN_WALLET_ID in your environment variables:');
    console.log(`ADMIN_WALLET_ID=${admin._id.toString()}`);

  } catch (error) {
    console.error('Error setting up admin wallet:', error);
  } finally {
    await mongoose.disconnect();
  }
}

setupAdminWallet();
