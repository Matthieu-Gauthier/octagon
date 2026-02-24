export const countryFlags: Record<string, { name: string; code: string }> = {
    'united states': { name: 'United States', code: 'us' },
    'brazil': { name: 'Brazil', code: 'br' },
    'russia': { name: 'Russia', code: 'ru' },
    'mexico': { name: 'Mexico', code: 'mx' },
    'england': { name: 'England', code: 'gb-eng' },
    'australia': { name: 'Australia', code: 'au' },
    'canada': { name: 'Canada', code: 'ca' },
    'france': { name: 'France', code: 'fr' },
    'georgia': { name: 'Georgia', code: 'ge' },
    'ireland': { name: 'Ireland', code: 'ie' },
    'serbia': { name: 'Serbia', code: 'rs' },
    'moldova': { name: 'Moldova', code: 'md' },
    'new zealand': { name: 'New Zealand', code: 'nz' },
    'spain': { name: 'Spain', code: 'es' },
    'poland': { name: 'Poland', code: 'pl' },
    'south africa': { name: 'South Africa', code: 'za' },
    'china': { name: 'China', code: 'cn' },
    'japan': { name: 'Japan', code: 'jp' },
    'south korea': { name: 'South Korea', code: 'kr' },
    'argentina': { name: 'Argentina', code: 'ar' },
    'colombia': { name: 'Colombia', code: 'co' },
    'peru': { name: 'Peru', code: 'pe' },
    'chile': { name: 'Chile', code: 'cl' },
    'italy': { name: 'Italy', code: 'it' },
    'germany': { name: 'Germany', code: 'de' },
    'netherlands': { name: 'Netherlands', code: 'nl' },
    'sweden': { name: 'Sweden', code: 'se' },
    'nigeria': { name: 'Nigeria', code: 'ng' },
    'cameroon': { name: 'Cameroon', code: 'cm' },
    'senegal': { name: 'Senegal', code: 'sn' },
    'kazakhstan': { name: 'Kazakhstan', code: 'kz' },
    'uzbekistan': { name: 'Uzbekistan', code: 'uz' },
    'tajikistan': { name: 'Tajikistan', code: 'tj' },
    'kyrgyzstan': { name: 'Kyrgyzstan', code: 'kg' },
    'ukraine': { name: 'Ukraine', code: 'ua' },
    'czech republic': { name: 'Czech Republic', code: 'cz' },
    'czechia': { name: 'Czechia', code: 'cz' },
    'slovakia': { name: 'Slovakia', code: 'sk' },
    'puerto rico': { name: 'Puerto Rico', code: 'pr' },
    'cuba': { name: 'Cuba', code: 'cu' },
    'dominican republic': { name: 'Dominican Republic', code: 'do' },
    'iceland': { name: 'Iceland', code: 'is' },
    'belgium': { name: 'Belgium', code: 'be' },
    'switzerland': { name: 'Switzerland', code: 'ch' },
    'austria': { name: 'Austria', code: 'at' },
    'croatia': { name: 'Croatia', code: 'hr' },
    'philippines': { name: 'Philippines', code: 'ph' },
    'thailand': { name: 'Thailand', code: 'th' },
    'morocco': { name: 'Morocco', code: 'ma' },
    'armenia': { name: 'Armenia', code: 'am' },
    'norway': { name: 'Norway', code: 'no' },
    'denmark': { name: 'Denmark', code: 'dk' },
    'finland': { name: 'Finland', code: 'fi' },
    'bulgaria': { name: 'Bulgaria', code: 'bg' },
    'romania': { name: 'Romania', code: 'ro' },
    'hungary': { name: 'Hungary', code: 'hu' },
    'turkey': { name: 'Turkey', code: 'tr' },
    'jamaica': { name: 'Jamaica', code: 'jm' },
    'venezuela': { name: 'Venezuela', code: 've' },
    'belarus': { name: 'Belarus', code: 'by' },
    'slovenia': { name: 'Slovenia', code: 'si' },
    'portugal': { name: 'Portugal', code: 'pt' },
    'greece': { name: 'Greece', code: 'gr' },
    'angola': { name: 'Angola', code: 'ao' },
    'egypt': { name: 'Egypt', code: 'eg' },
    'afghanistan': { name: 'Afghanistan', code: 'af' },
    'iraq': { name: 'Iraq', code: 'iq' },
    'iran': { name: 'Iran', code: 'ir' },
    'dr congo': { name: 'DR Congo', code: 'cd' },
    'democratic republic of the congo': { name: 'DR Congo', code: 'cd' },
    'congo': { name: 'Congo', code: 'cg' },
};

/**
 * Parses a raw hometown string (e.g., "Las Vegas, Nevada, United States" or "Makhachkala, Russia") 
 * and returns the best matching flag emoji, or undefined if no match is found.
 */
export function getFlagForHometown(hometown: string | null | undefined): string | undefined {
    if (!hometown) return undefined;

    const normalized = hometown.toLowerCase();

    // Check if any of our known countries exist within the string
    for (const [key, data] of Object.entries(countryFlags)) {
        if (normalized.includes(key)) {
            return data.code;
        }
    }

    // Explicit manual mappings for common variations or edge cases:
    if (normalized.includes('usa') || normalized.includes('u.s.a')) return 'us';
    if (normalized.includes('uk') || normalized.includes('u.k.') || normalized.includes('wales') || normalized.includes('scotland')) return 'gb';
    if (normalized.includes('nz')) return 'nz';
    if (normalized.includes('korea')) return 'kr';

    return undefined;
}
