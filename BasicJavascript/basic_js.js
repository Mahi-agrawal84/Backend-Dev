console.log("fetching user data from database...");
// let user;
// setTimeout(() => {
//     user={name:"Raj",email:"raj@example.com" }
//     console.log("user is fetched");
// }, 0);
// console.log(user);

console.log("first task");
Promise.resolve().then(() => console.log("second task"));
console.log("third task"); 
async function fetchData() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts/1");
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.log(error);
  }
}
fetchData();

const getUserData = async() => {
    try{
        const user = await fetchUser(4);
        console.log("user data:", user);
        }catch(e){
            console.log(e);
        }
};
getUserData();