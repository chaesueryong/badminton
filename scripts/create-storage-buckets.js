// This script creates the necessary storage buckets in Supabase

async function createBuckets() {
  try {
    console.log('Creating storage buckets...');

    // Call the API to create buckets
    const response = await fetch('http://localhost:3002/api/storage/create-bucket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Bucket created successfully:', result.message);
    } else {
      console.error('❌ Error creating bucket:', result.error);
    }
  } catch (error) {
    console.error('❌ Failed to create buckets:', error);
  }
}

// Run the script
createBuckets();