const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testRegistration() {
    try {
        console.log('🧪 Testing registration endpoint...');
        
        // Create a simple test image file
        const testImagePath = path.join(__dirname, 'test-passport.jpg');
        if (!fs.existsSync(testImagePath)) {
            // Create a minimal test file
            fs.writeFileSync(testImagePath, Buffer.from('fake image data'));
        }
        
        const form = new FormData();
        
        // Add required fields
        form.append('full_name', 'Card Test Student');
        form.append('personal_email', 'cardtest@example.com');
        form.append('phone_number', '0934567890'); // Different phone number
        form.append('gender', 'Male');
        form.append('date_of_birth', '1998-03-10');
        form.append('nationality', 'Ethiopian');
        form.append('region', 'Oromia');
        form.append('zone', 'West Shewa');
        form.append('woreda', 'Ambo');
        form.append('address', '456 Card Street');
        form.append('university', 'Ambo University');
        form.append('campus', 'Main Campus');
        form.append('school', 'Natural Sciences');
        form.append('department', 'Information Technology');
        form.append('program', 'Regular');
        form.append('year', '4');
        form.append('semester', '2');
        form.append('section', 'C');
        form.append('emergency_contact_name', 'Test Parent');
        form.append('emergency_contact_relationship', 'Father');
        form.append('emergency_contact_phone', '0922345678');
        form.append('emergency_contact_address', '456 Parent Street');
        form.append('password', 'testpassword123');
        form.append('confirm_password', 'testpassword123');
        
        // Add files (optional)
        // form.append('passport_photo', fs.createReadStream(testImagePath));
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/register',
            method: 'POST',
            headers: form.getHeaders()
        };
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    if (res.statusCode === 200) {
                        console.log('✅ Registration successful!');
                        console.log('📋 Response:', result);
                    } else {
                        console.log('❌ Registration failed:', res.statusCode);
                        console.log('📋 Error:', result);
                    }
                } catch (e) {
                    console.log('❌ Failed to parse response:', body);
                }
                
                // Clean up test file
                if (fs.existsSync(testImagePath)) {
                    fs.unlinkSync(testImagePath);
                }
            });
        });
        
        req.on('error', (err) => {
            console.error('❌ Request failed:', err.message);
        });
        
        form.pipe(req);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testRegistration();