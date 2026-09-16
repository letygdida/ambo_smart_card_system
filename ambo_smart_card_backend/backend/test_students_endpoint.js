const fetch = require('node-fetch');

const testStudentsEndpoint = async () => {
    try {
        console.log('Testing students API endpoint without authentication...\n');
        
        const response = await fetch('http://localhost:5000/api/students');
        console.log('Status:', response.status);
        
        if (response.status === 401) {
            console.log('✓ Authentication required (expected behavior)');
        } else if (response.status === 200) {
            const data = await response.json();
            console.log('Students count:', data.length);
        } else {
            const text = await response.text();
            console.log('Response:', text);
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
};

testStudentsEndpoint();
