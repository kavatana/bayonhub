const axios = require('axios');
const querystring = require('querystring');

async function testSMS() {
  const username = "zkaskxnpupm4333";
  const password = "[(RQF1jd4k=A=tQ=";
  const apiUrl = "https://cloudapi.plasgate.com/api/send";
  const phone = "855963131281";

  try {
    const data = querystring.stringify({
      to: phone,
      content: "Test SMS from BayonHub",
      sender: "970",
      username: username,
      password: password
    });

    const res = await axios.post(apiUrl, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    console.log(`Success:`, res.data);
  } catch (error) {
    console.log(`Error:`, error.response ? error.response.data : error.message);
  }
}

testSMS();
