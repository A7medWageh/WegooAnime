import { getLatestAnime } from './src/lib/anicli.js';

async function test() {
    try {
        const latest = await getLatestAnime(0, 5);
        console.log(JSON.stringify(latest, null, 2));
    } catch (err) {
        console.error(err);
    }
}

test();
