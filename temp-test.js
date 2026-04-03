const fetch = require('node-fetch');

async function testAnimeSkip() {
  const query = `
    query {
      findShows(search: "Jujutsu") {
        id
        name
      }
    }
  `;

  try {
    const res = await fetch('https://api.anime-skip.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': 'wegooanime'
      },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

testAnimeSkip();
