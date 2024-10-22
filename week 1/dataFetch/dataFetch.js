import { fetchPosts } from './apiUtil.js';

async function displayPosts() {
  const posts = await fetchPosts(); 
  
  posts.slice(0, 5).forEach((post) => {
    console.log(`Title: ${post.title}`);
    console.log(`Body: ${post.body}`);
  });
}

displayPosts();
