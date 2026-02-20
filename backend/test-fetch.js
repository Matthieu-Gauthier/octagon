async function testFetch() {
    try {
        const response = await fetch('https://www.ufc.com/events', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        console.log('Status:', response.status);
        const html = await response.text();
        console.log('HTML Length:', html.length);

        // Find links
        const matches = html.match(/href="\/event\/([^"]+)"/g) || [];
        console.log('Found event links:', matches.slice(0, 5));

        // Sometimes the URL is absolute
        const absoluteMatches = html.match(/href="https:\/\/www.ufc.com\/event\/([^"]+)"/g) || [];
        console.log('Found absolute event links:', absoluteMatches.slice(0, 5));
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testFetch();
