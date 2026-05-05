const axios = require('axios');

async function testSMS() {
  const privateKey = "zkaskxnpupm4333";
  const secret = "[(RQF1jd4k=A=tQ=";
  const apiUrl = "https://cloudapi.plasgate.com/rest/send";
  const phone = "855963131281";

  try {
    const res = await axios.post(
      `${apiUrl}?private_key=${privateKey}`,
      {
        to: phone,
        content: "Test SMS from BayonHub",
        sender: "970",
      },
      {
        headers: {
          "X-Secret": secret,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`Success:`, res.data);
  } catch (error) {
    console.log(`Error:`, error.response ? error.response.data : error.message);
  }
}

testSMS();
