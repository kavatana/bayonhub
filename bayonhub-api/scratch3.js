const axios = require('axios');

async function testSMS(sender) {
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
        sender: sender,
      },
      {
        headers: {
          "X-Secret": secret,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`Success with sender ${sender}:`, res.data);
  } catch (error) {
    console.log(`Error with sender ${sender}:`, error.response ? error.response.data : error.message);
  }
}

testSMS("Verify");
testSMS("SMS Info");
