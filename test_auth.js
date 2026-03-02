const http = require('http');

const body = JSON.stringify({
    email: 'sumalyadey1@gmail.com',
    password: '9231629453Ab@'
});

const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    console.log('Status:', res.statusCode);
    console.log('Set-Cookie:', res.headers['set-cookie']);
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log('Body:', data));
});

req.on('error', (e) => console.error('Error:', e));
req.write(body);
req.end();
