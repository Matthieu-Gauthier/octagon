async function main() {
    const urls = [
        'https://www.ufc.com/live-events-data/ufc-fight-night-february-28-2026.json',
        'https://www.ufc.com/api/v1/events/ufc-fight-night-february-28-2026/live',
        'https://dcfm.ufc.com/v1/event/ufc-fight-night-february-28-2026/live_stats.json',
        'https://www.ufc.com/matchup/ufc-fight-night-february-28-2026.json'
    ];
    for (const url of urls) {
        console.log('Fetching', url);
        const res = await fetch(url);
        if (res.ok) {
            console.log('SUCCESS:', url);
            console.log((await res.text()).substring(0, 200));
        } else {
            console.log('Failed:', res.status);
        }
    }
}
main();
