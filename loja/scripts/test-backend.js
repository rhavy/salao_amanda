const fetch = require('node-fetch'); // Ensure node-fetch is available or use native fetch in Node 18+

// Use native fetch if available (Node 18+), otherwise try require.
// Since user environment looks modern, native fetch should be there.

const BASE_URL = 'http://localhost:3000';
let token = '';
let userEmail = `test_${Date.now()}@example.com`;

async function runTests() {
    console.log('🚀 Starting Backend Verification Tests...\n');

    try {
        // 1. REGISTER
        console.log('1. Testing Registration...');
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: userEmail,
                password: 'password123',
                gender: 'Feminino',
                phone: '11999999999',
                cpf: '12345678900',
                birthDate: '1990-01-01'
            })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.message);
        console.log('   ✅ Registration successful:', regData.message);

        // 2. LOGIN
        console.log('\n2. Testing Login...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, password: 'password123' })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.message);
        token = loginData.token;
        console.log('   ✅ Login successful. Token received.');

        // 3. GET PROFILE
        console.log('\n3. Testing Get Profile...');
        const profileRes = await fetch(`${BASE_URL}/user/profile/${userEmail}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        if (!profileRes.ok) throw new Error(profileData.message);
        if (profileData.email !== userEmail) throw new Error('Profile email mismatch');
        console.log('   ✅ Profile fetched:', profileData.name);

        // 4. UPDATE PROFILE
        console.log('\n4. Testing Update Profile (Settings)...');
        const updateRes = await fetch(`${BASE_URL}/user`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ email: userEmail, notifications_reminders: true })
        });
        const updateData = await updateRes.json();
        if (!updateRes.ok) throw new Error(updateData.message);
        console.log('   ✅ Profile updated:', updateData.message);

        // 5. BOOK APPOINTMENT
        console.log('\n5. Testing Appointment Booking...');
        const today = new Date().toISOString().split('T')[0];
        const bookRes = await fetch(`${BASE_URL}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                user_email: userEmail,
                serviceName: 'Corte de Cabelo',
                date: today,
                time: '14:00',
                price: 50
            })
        });
        const bookData = await bookRes.json();
        if (!bookRes.ok) throw new Error(bookData.message);
        console.log('   ✅ Appointment booked:', bookData.message);

        // 6. LIST APPOINTMENTS
        console.log('\n6. Testing List Appointments...');
        const listRes = await fetch(`${BASE_URL}/appointments/${userEmail}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const listData = await listRes.json();
        if (!listRes.ok) throw new Error(listData.message);
        if (listData.length === 0) throw new Error('No appointments found');
        console.log(`   ✅ Found ${listData.length} appointments.`);

        // 7. SEND CHAT MESSAGE
        console.log('\n7. Testing Chat...');
        const chatRes = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                email: userEmail,
                content: 'Hello World',
                sender: 'user'
            })
        });
        const chatData = await chatRes.json();
        if (!chatRes.ok) throw new Error(chatData.message);
        console.log('   ✅ Message sent:', chatData.message);

        console.log('\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        process.exit(1);
    }
}

runTests();
