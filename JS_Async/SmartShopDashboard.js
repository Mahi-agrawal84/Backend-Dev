// Function to fetch user details
function fetchUser(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ name: "Rahul", isPremium: true });
    }, 1000);
  });
}

// Function to fetch orders
function fetchOrders(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { item: "Laptop", price: 1000, status: "delivered" },
        { item: "Phone", price: 500, status: "pending" }
      ]);
    }, 2000);
  });
}

// Async function to display dashboard
async function displayDashboard(id) {
  try {
    const user = await fetchUser(id);
    const orders = await fetchOrders(id);

    // Filter delivered orders
    const deliveredOrders = orders.filter(
      order => order.status === "delivered"
    );

    // Apply 10% discount if user is premium
    const finalTotal = deliveredOrders
      .map(order => {
        if (user.isPremium) {
          return order.price * 0.9;
        }
        return order.price;
      })
      .reduce((sum, price) => sum + price, 0);

    console.log(`Welcome ${user.name}!`);
    console.log(`Total Amount after Discount: $${finalTotal}`);
  } catch (error) {
    console.log("Error:", error);
  }
}

// Test
displayDashboard(1);
