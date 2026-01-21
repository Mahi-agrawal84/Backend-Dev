// Step 1: Get User
function getUser(username) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ name: "Rahul", type: "Premium" });
    }, 1500);
  });
}

// Step 2: Check Subscription
function checkSubscription(user) {
  return new Promise((resolve, reject) => {
    if (user.type === "Premium") {
      resolve("Access Granted to Netflix");
    } else {
      reject("Please Subscribe");
    }
  });
}

// Consumer Function (Sequential Await)
async function authenticateUser(username) {
  try {
    const user = await getUser(username);           // First step
    const access = await checkSubscription(user);   // Second step
    console.log(access);
  } catch (error) {
    console.log(error);
  }
}

// Test
authenticateUser("Rahul");
