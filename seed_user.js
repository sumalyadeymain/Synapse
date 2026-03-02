const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/seed-local-user',
    method: 'GET',
};

const req = http.request(options, (res) => {
    let data = '';
    console.log('Status:', res.statusCode);
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Response:', data);
        try {
            const json = JSON.parse(data);
            if (json.id) console.log('\n✅ USE THIS UUID IN do-login route:', json.id);
        } catch (e) { }
    });
});

req.on('error', (e) => console.error('Error:', e));
req.end();
