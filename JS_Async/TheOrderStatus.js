function checkOrderStatus(orderId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (typeof orderId === "number") {
        resolve("Order Shipped");
      } else {
        reject("Invalid Order ID");
      }
    }, 1000);
  });
}

// Async function to call the promise
async function getOrderStatus(orderId) {
  try {
    const result = await checkOrderStatus(orderId);
    console.log(result);
  } catch (error) {
    console.log(error);
  }
}

// Test cases
getOrderStatus(101);      // Order Shipped
getOrderStatus("ABC");   // Invalid Order ID
