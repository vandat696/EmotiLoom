const axios = require('axios');

const API_URL = 'http://localhost:5000';
let token = '';

async function test() {
  try {
    // 1. Login test
    console.log('1. Testing LOGIN...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      username: 'student1',
      password: 'password123',
    });
    console.log('Login response:', JSON.stringify(loginRes.data, null, 2));
    token = loginRes.data.token;

    if (!token) {
      console.log('❌ No token received!');
      return;
    }

    // 2. Counselors endpoint
    console.log('\n2. Testing COUNSELORS endpoint...');
    const counselorsRes = await axios.get(`${API_URL}/counselors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Counselors response:', JSON.stringify(counselorsRes.data, null, 2));

    // 3. Appointments endpoint
    console.log('\n3. Testing APPOINTMENTS endpoint...');
    const appointmentsRes = await axios.get(`${API_URL}/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Appointments response:', JSON.stringify(appointmentsRes.data, null, 2));

    // 4. Diary endpoint
    console.log('\n4. Testing DIARY endpoint...');
    const diaryRes = await axios.get(`${API_URL}/diary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Diary response:', JSON.stringify(diaryRes.data, null, 2));

    // 5. Community endpoint
    console.log('\n5. Testing COMMUNITY/POSTS endpoint...');
    const postsRes = await axios.get(`${API_URL}/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Posts response:', JSON.stringify(postsRes.data, null, 2));

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

test();
