const axios = require('axios');
const FormData = require('form-data');

async function testSMS() {
  const username = "zkaskxnpupm4333";
  const password = "[(RQF1jd4k=A=tQ=";
  const apiUrl = "https://cloudapi.plasgate.com/api/send";
  const phone = "855963131281";

  try {
    const form = new FormData();
    form.append('to', phone);
    form.append('content', 'Test SMS from BayonHub');
    form.append('sender', '970');
    form.append('username', username);
    form.append('password', password);

    const res = await axios.post(apiUrl, form, {
      headers: form.getHeaders()
    });
    console.log(`Success:`, res.data);
  } catch (error) {
    console.log(`Error:`, error.response ? error.response.data : error.message);
  }
}

testSMS();
