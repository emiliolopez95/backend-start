function getSubDomain(url) {
    if (!url) return null;
    const regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/gim;
    const subDomain = regex.exec(url);
    return subDomain && subDomain.length >= 2 ? subDomain[1] : null;
}

function removeUrlParameters(url) {
    const urlObject = new URL(url);
    let hasPathName = urlObject.pathname && urlObject.pathname !== '/';
    return hasPathName ? urlObject.origin + urlObject.pathname : urlObject.origin;
}
function getDomain(url) {
    if (!url) return null;
    const subDomain = getSubDomain(url);
    if (!subDomain) return null;
    const regex = /(\w+)-?(\w+).(\w+)$/gim;
    const domain = regex.exec(subDomain);
    return domain && domain[0].toLowerCase();
}

function getUrlPath(url) {
    if (!url) return null;
    const domain = getDomain(url);
    if (!domain) return null;
    let indexOfDomain = domain ? url.indexOf(domain) + domain.length : 0;
    let afterDomain = url.substr(indexOfDomain);
    if (afterDomain.indexOf('?') > -1) {
        let justPathRegex = /(^.*)(?=\?)/gim;
        let [justPath] = justPathRegex.exec(afterDomain);
        return justPath;
    }

    return afterDomain;
}

function getTwitterHandle(url) {
    if (!url) return null;
    const regex = /(?<=twitter.com\/).[^\/]*/gim;
    const handle = regex.exec(url);
    return handle && handle.length ? handle[0].toLowerCase() : null;
}

const urlRegex =
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gm;

function trimAllUrls(str) {
    return str.replace(urlRegex, '');
}

function getUrlsFromString(str) {
    if (!str) return [];
    // const regex =
    //     /(?:(?:https?|ftp):\/\/|\b(?:[a-z\d]+\.))(?:(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))?\))+(?:\((?:[^\s()<>]+|(?:\(?:[^\s()<>]+\)))?\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))?/gm
    //

    const urls = str.match(urlRegex);
    return urls && urls.length ? urls : [];
}

function replaceUrlsWithDomains(text) {
    const urlRegex = /(?:www\.)?[\w-]+\.[\w-]+(?:\.[\w-]+)*(?:\/[^\s?#]*)?(?:\?[^\s?#]*)?(?:#[^\s]*)?/gim;
    // Check if there is a URL match in the text
    const matchedUrls = text.match(urlRegex);
    if (matchedUrls) {
        for (let url of matchedUrls) {
            const domain = getDomain(url);
            text = text.replace(url, domain ? `https://${domain}` : 'link sent');
        }

        return text;
    } else {
        // If there's no match, return the original text
        return text;
    }
}

export default {
    replaceUrlsWithDomains,
    getSubDomain,
    getDomain,
    getUrlPath,
    getTwitterHandle,
    getUrlsFromString,
    trimAllUrls,
    removeUrlParameters,
};
