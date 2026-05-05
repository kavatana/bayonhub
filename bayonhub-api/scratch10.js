const axios = require('axios');

async function testSMS() {
  const username = "zkaskxnpupm4333";
  const password = "[(RQF1jd4k=A=tQ=";
  const apiUrl = "https://cloudapi.plasgate.com/v1/sms/send";
  const phone = "855963131281";

  try {
    const res = await axios.post(
      apiUrl,
      {
        to: phone,
        content: "Test SMS from BayonHub",
        sender: "970",
      },
      {
        auth: {
          username: username,
          password: password
        }
      }
    );
    console.log(`Success:`, res.data);
  } catch (error) {
    console.log(`Error:`, error.response ? error.response.status + ' ' + error.response.statusText : error.message);
  }
}

testSMS();
