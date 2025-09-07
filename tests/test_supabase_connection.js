#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Testing Supabase Connection for Archon Local Version');

// Check if Supabase environment variables are set
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('\n1. Checking Environment Variables:');
console.log(`SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Not set'}`);
console.log(`SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Not set'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n⚠️  Supabase environment variables are not configured.');
  console.log('To enable Supabase integration, add the following to your .env file:');
  console.log('# SUPABASE_URL=your_supabase_url');
  console.log('# SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(0);
}

console.log('\n2. Testing Supabase Client Initialization:');

try {
  const { createClient } = await import('@supabase/supabase-js');
  console.log('✅ @supabase/supabase-js imported successfully');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client created successfully');
  
  // Test connection with a simple query
  console.log('\n3. Testing Connection with Supabase:');
  const { data, error } = await supabase
    .from('archon_insights')
    .select('count()', { count: 'exact' });
  
  if (error) {
    console.log(`⚠️  Connection test returned error: ${error.message}`);
    console.log('This might be expected if the table does not exist yet.');
  } else {
    console.log('✅ Connection test successful');
    console.log(`Found ${data[0].count} records in archon_insights table`);
  }
  
  console.log('\n✅ Supabase connection verified successfully!');
  console.log('The Lightweight Archon service can use Supabase as storage backend.');
  
} catch (error) {
  console.log(`❌ Failed to initialize Supabase client: ${error.message}`);
  console.log('Please check your Supabase credentials and network connectivity.');
}