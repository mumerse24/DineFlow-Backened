const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testUpload() {
    try {
        // 1. Get token
        const loginRes = await axios.post('http://localhost:5000/api/admin/auth/login', {
            email: 'admin@foodexpress.com',
            password: 'AdminPassword123!'
        });
        const token = loginRes.data.token;
        console.log("Got token.");

        // 2. Prepare file
        const filePath = path.join(__dirname, 'server.js'); // just use an arbitrary file
        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath), {
            filename: 'server.js',
            contentType: 'text/javascript'
        });

        // 3. Upload file
        console.log("Uploading...");
        const uploadRes = await axios.post('http://localhost:5000/api/upload', formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Success:", uploadRes.data);
    } catch (error) {
        console.error("Upload failed.");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testUpload();
