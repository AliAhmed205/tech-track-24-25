
async function fetchPosts() {
  // const url = "https://jsonplaceholder.typicode.com/posts";
  const url = "https://cdn.jsdelivr.net/npm/@tcgdex/sdk@2/dist/tcgdex.browser.js";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    return json; // Return de JSON-data
  } catch (error) {
    console.error(error.message);
  }
}


export { fetchPosts }