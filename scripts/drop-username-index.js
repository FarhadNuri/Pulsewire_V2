const { MongoClient } = require('mongodb');

async function dropUsernameIndex() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pulsewire';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('users');

    // List all indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach((index) => {
      console.log(`- ${index.name}:`, index.key);
    });

    // Drop the username_1 index
    try {
      await collection.dropIndex('username_1');
      console.log('\n✅ Successfully dropped username_1 index');
    } catch (error) {
      if (error.codeName === 'IndexNotFound') {
        console.log('\n⚠️  Index username_1 not found (already removed)');
      } else {
        throw error;
      }
    }

    // List indexes after dropping
    const indexesAfter = await collection.indexes();
    console.log('\n📋 Indexes after cleanup:');
    indexesAfter.forEach((index) => {
      console.log(`- ${index.name}:`, index.key);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

dropUsernameIndex();
