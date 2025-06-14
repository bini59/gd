// Simple test runner to check basic functionality
const { execSync } = require('child_process');

console.log('🚀 Starting test execution...\n');

try {
  // Run single test file first
  console.log('📋 Running EligibilityEngine tests...');
  const result = execSync('npx jest tests/unit/services/eligibilityEngine.test.js --verbose', {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log(result);
  console.log('✅ EligibilityEngine tests completed successfully!\n');

} catch (error) {
  console.error('❌ Test failed:');
  console.error('STDOUT:', error.stdout);
  console.error('STDERR:', error.stderr);
  console.error('Exit code:', error.status);
  
  // Create GitHub issue content
  console.log('\n📋 GitHub Issue Content:');
  console.log('---');
  console.log('Title: Fix test execution errors');
  console.log('Description:');
  console.log('```');
  console.log('Error Output:');
  console.log(error.stdout);
  console.log(error.stderr);
  console.log('```');
  console.log('---');
}

console.log('🏁 Test execution completed.');