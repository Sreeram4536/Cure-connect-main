const mongoose = require('mongoose');

async function migrateWalletIndex() {
  try {
    console.log('Starting wallet index migration...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cureconnect');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('wallets');

    // Drop the old unique index on userId if it exists
    try {
      await collection.dropIndex({ userId: 1 });
      console.log('Dropped old unique index on userId');
    } catch (error) {
      console.log('Old index on userId not found or already dropped:', error.message);
    }

    // Create the new compound unique index
    try {
      await collection.createIndex({ userId: 1, userRole: 1 }, { unique: true });
      console.log('Created new compound unique index on userId and userRole');
    } catch (error) {
      console.log('Compound index already exists or error creating:', error.message);
    }

    // Update existing wallets to have userRole: 'user' if they don't have it
    const result = await collection.updateMany(
      { userRole: { $exists: false } },
      { $set: { userRole: 'user' } }
    );
    console.log(`Updated ${result.modifiedCount} wallets to have userRole: 'user'`);

    console.log('Wallet index migration completed successfully!');
  } catch (error) {
    console.error('Error during wallet index migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateWalletIndex()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateWalletIndex };
