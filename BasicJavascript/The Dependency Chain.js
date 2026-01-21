async function getUserPostComments() {
  try {
    // Step 1: Fetch all posts for userId = 1
    const postsResponse = await fetch(
      "https://jsonplaceholder.typicode.com/posts?userId=1"
    );
    const posts = await postsResponse.json();

    // Step 2: Pick the first post
    const firstPost = posts[0];

    // Step 3: Fetch comments for that post
    const commentsResponse = await fetch(
      `https://jsonplaceholder.typicode.com/posts/${firstPost.id}/comments`
    );
    const comments = await commentsResponse.json();

    // Step 4: Filter comments containing the word "et"
    const filteredComments = comments.filter(comment =>
      comment.body.includes("et")
    );

    console.log(filteredComments);
  } catch (error) {
    console.error("Error:", error);
  }
}

getUserPostComments();
