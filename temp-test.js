const fetch = require('node-fetch');

const CREDS_URL = 'https://ani-cli-arabic-analytics.talego4955.workers.dev/credentials';
const CREDS_AUTH = '8GltlSgyTHwNJ-77n8R4T2glZ_EDQHcU4AB4Wjuu75M';

async function test() {
    try {
        const res = await fetch(CREDS_URL, {
            headers: { 'X-Auth-Key': CREDS_AUTH, 'User-Agent': 'AniCliAr/2.0' },
        });
        const creds = await res.json();
        console.log('Creds fetched:', JSON.stringify(creds, null, 2));
        
        const base = creds.ANI_CLI_AR_API_BASE;
        const token = creds.ANI_CLI_AR_TOKEN;

        if (!base) {
            console.error('Base URL not found in creds.');
            return;
        }

        const form = new URLSearchParams({ UserId: '0', Language: 'Arabic', From: '0', Token: token });
        const apiRes = await fetch(base + 'anime/load_latest_anime.php', {
            method: 'POST',
            body: form,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const data = await apiRes.json();
        
        if (data && data.length > 0) {
            console.log('First Item Snippet:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No data returned for Language: Arabic');
        }

    } catch (err) {
        console.error(err);
    }
}

test();
