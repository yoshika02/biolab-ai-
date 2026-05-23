const timestamp = Date.now();
const email = `newuser${timestamp}@example.com`;
const password = 'TestPass123!';

console.log('\n=== TESTING REGISTRATION AND LOGIN ===');
console.log('Email:', email);
console.log('Password:', password);

const regPayload = JSON.stringify({
    name: 'Test User ' + timestamp,
    email: email,
    password: password,
    department: 'Biology',
    institution: 'Test Lab',
    role: 'researcher'
});

fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: regPayload
})
    .then(res => {
        console.log('\n--- REGISTRATION RESPONSE ---');
        console.log('Status:', res.status);
        return res.json();
    })
    .then(data => {
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('\n✓ Registration successful!');
            console.log('\n--- TESTING LOGIN ---');

            const loginPayload = JSON.stringify({
                email: email,
                password: password
            });

            return fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: loginPayload
            });
        } else {
            throw new Error('Registration failed: ' + data.error);
        }
    })
    .then(res => {
        console.log('Status:', res.status);
        return res.json();
    })
    .then(data => {
        console.log('Response:', JSON.stringify(data, null, 2));
        if (data.success) {
            console.log('\n✓✓✓ SUCCESS! Registration and Login both work! ✓✓✓\n');
            process.exit(0);
        } else {
            console.log('\nLogin failed:', data.error);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('\nERROR:', err.message);
        process.exit(1);
    });
