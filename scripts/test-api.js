// scripts/test-api.js
// Run this with: node scripts/test-api.js

const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testAPI() {
    console.log('🧪 Testing SuperCPE API Connection...\n');

    const tests = [
        {
            name: 'Health Check',
            url: '/health',
            method: 'GET'
        },
        {
            name: 'Root Endpoint',
            url: '/',
            method: 'GET'
        },
        {
            name: 'CPA Stats',
            url: '/api/cpas/stats/summary',
            method: 'GET'
        },
        {
            name: 'Get CPAs (first 5)',
            url: '/api/cpas/?limit=5',
            method: 'GET'
        }
    ];

    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}`);
            console.log(`${test.method} ${API_BASE_URL}${test.url}`);

            const response = await axios({
                method: test.method,
                url: `${API_BASE_URL}${test.url}`,
                timeout: 5000
            });

            console.log(`✅ Success (${response.status})`);
            console.log(`Response:`, JSON.stringify(response.data, null, 2));
            console.log('\n' + '─'.repeat(50) + '\n');
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
            if (error.response) {
                console.log(`Status: ${error.response.status}`);
                console.log(`Response:`, error.response.data);
            }
            console.log('\n' + '─'.repeat(50) + '\n');
        }
    }

    console.log('🏁 API Testing Complete');
}

// Test a specific CPA (if you know a license number)
async function testSpecificCPA(licenseNumber) {
    try {
        console.log(`\n🔍 Testing specific CPA: ${licenseNumber}`);
        const response = await axios.get(`${API_BASE_URL}/api/cpas/${licenseNumber}`);
        console.log('✅ CPA Found:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log(`❌ CPA ${licenseNumber} not found or error:`, error.message);
    }
}

// Run the tests
testAPI().then(() => {
    // Uncomment and replace with a real license number to test specific CPA lookup
    // testSpecificCPA('07308');
});

module.exports = { testAPI, testSpecificCPA };