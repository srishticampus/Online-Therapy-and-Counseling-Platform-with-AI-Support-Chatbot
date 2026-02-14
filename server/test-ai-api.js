const BASE_URL = 'http://127.0.0.1:5000/api';
let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODFlMWFiMWQyZmUzNjAyMTE2OTBiNSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzcwMTc1NjUxLCJleHAiOjE3NzAyNjIwNTF9.OaCy3Iht2DNEhf1jvy-mzJl1fNZLV0oSzZbCjFvIxzU";
let userId = '6981e1ab1d2fe360211690b5';

async function runTests() {
    console.log('🧪 Starting AI Chat API Tests...');

    // 1. REGISTER
    const email = `santhoshrajan81@gmail.com`;
    console.log(`\n1. Registering User (${email})...`);
    try {
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Setup',
                email,
                password: 'password123'
            })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.message || 'Registration failed');
        console.log('✅ Registration Successful');
    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('User exists, proceeding to login...');
        } else {
            console.error('❌ Registration Error:', err.message);
            return;
        }
    }

    // 2. LOGIN
    console.log('\n2. Logging in...');
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.message || 'Login failed');
        token = loginData.token;
        userId = loginData.user ? loginData.user._id : loginData._id; // Adjust based on actual response structure

        // Fallback if userId not in root or user obj
        if (!userId && loginData.data?.user?._id) userId = loginData.data.user._id;

        console.log(`✅ Login Successful. Token: ${token.substring(0, 15)}... UserID: ${userId}`);
    } catch (err) {
        console.error('❌ Login Error:', err.message);
        return;
    }

    if (!token) {
        console.error('❌ No token retrieved. Aborting.');
        return;
    }

    // 3. CHAT
    console.log('\n3. Testing POST /ai/chat...');
    try {
        const chatRes = await fetch(`${BASE_URL}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: "I'm feeling really stressed about work today.",
                context: []
            })
        });
        const chatData = await chatRes.json();
        if (!chatRes.ok) throw new Error(chatData.error || 'Chat failed');

        console.log('✅ Chat Response:', chatData.reply.substring(0, 50) + '...');
        console.log('   Sentiment:', chatData.sentiment);
        console.log('   Emotion:', chatData.detectedEmotion);
    } catch (err) {
        console.error('❌ Chat Error:', err.message);
    }

    // 4. HISTORY
    console.log('\n4. Testing GET /ai/history...');
    try {
        const histRes = await fetch(`${BASE_URL}/ai/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const histData = await histRes.json();
        if (!histRes.ok) throw new Error(histData.error || 'History failed');

        console.log(`✅ History Retrieved: ${histData.data.length} messages`);
        if (histData.data.length > 0) {
            console.log('   Last Message:', histData.data[histData.data.length - 1].content.substring(0, 30) + '...');
        }
    } catch (err) {
        console.error('❌ History Error:', err.message);
    }

    // 5. ANALYTICS
    console.log(`\n5. Testing GET /ai/analytics/${userId}...`);
    try {
        const anaRes = await fetch(`${BASE_URL}/ai/analytics/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const anaData = await anaRes.json();
        if (!anaRes.ok) throw new Error(anaData.error || 'Analytics failed');

        console.log('✅ Analytics Retrieved');
        console.log('   Top Emotions:', anaData.topEmotions);
        console.log('   Trend Data Points:', anaData.trend.length);
    } catch (err) {
        console.error('❌ Analytics Error:', err.message);
    }

    // 6. CLEAR HISTORY
    console.log('\n6. Testing DELETE /ai/history...');
    try {
        const delRes = await fetch(`${BASE_URL}/ai/history`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const delData = await delRes.json();
        if (!delRes.ok) throw new Error(delData.error || 'Clear History failed');

        console.log('✅ Clear History:', delData.message);

        // Verify empty
        const verifyRes = await fetch(`${BASE_URL}/ai/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const verifyData = await verifyRes.json();
        console.log(`   Verification: ${verifyData.data.length} messages remaining.`);
    } catch (err) {
        console.error('❌ Clear History Error:', err.message);
    }
}

runTests();
