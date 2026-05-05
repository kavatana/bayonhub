const axios = require('axios');

async function testSMS() {
  const privateKey = "9WDLOKcRrVVMk7PJp8fTZB69nD4pWfolDTK2fXx5bqxNrTiO8wDr0V44xMcYtv6SczZP3Wj4_o1S5cpAWkLAIA";
  const secret = "$5$rounds=535000$hfT5yCz7SrWT1U0q$z8w6ZY1S428KQCVKos7fuBvj16PqN2nr5BHY9eOrWmC";
  const apiUrl = "https://cloudapi.plasgate.com/rest/send";
  const phone = "855963131281";

  try {
    const res = await axios.post(
      `${apiUrl}?private_key=${privateKey}`,
      {
        to: phone,
        content: "Test SMS from BayonHub",
        sender: "PlasGateUAT",
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
