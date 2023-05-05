export function findJsonFromString(str) {
    if (typeof str !== 'string') {
        console.error('The input is not a string:', str);
        return null;
    }

    const regex = /{[\s\S]*}|\[[\s\S]*]/;
    const match = str.match(regex);

    if (match) {
        try {
            let result = JSON.parse(match[0]);
            return result;
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return null;
        }
    }

    return null;
}
