const axios = require('axios');

async function testSMS(sender) {
  const username = "zkaskxnpupm4333";
  const password = "[(RQF1jd4k=A=tQ=";
  const apiUrl = "https://cloudapi.plasgate.com/api/send";
  const phone = "855963131281";

  try {
    const res = await axios.post(
      apiUrl,
      new URLSearchParams({
        to: phone,
        content: "Test SMS from BayonHub",
        sender: sender,
        username: username,
        password: password
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
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
