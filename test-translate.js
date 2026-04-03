async function translateToArabic(text) {
    if (!text || /[\u0600-\u06FF]/.test(text)) return text;
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        return data[0].map((item) => item[0]).join('');
    } catch (err) {
        console.error('Translation error:', err);
        return text;
    }
}

async function test() {
    console.log('Testing title translation...');
    const result = await translateToArabic('Frieren: Beyond Journey\'s End Season 2');
    console.log('Result:', result);
}

test();
