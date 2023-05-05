import metascraperFn from 'metascraper';
import author from 'metascraper-author';
import date from 'metascraper-date';
import description from 'metascraper-description';
import title from 'metascraper-title';
import url from 'metascraper-url';
import image from 'metascraper-image';
import axios from 'axios';

import { htmlToText } from 'html-to-text';
import { getCredentials } from '../config/config';
export const CREDS = getCredentials();

const metascraper = metascraperFn([author(), date(), description(), title(), url(), image()]);

export const scrapeMetadata = async (targetUrl) => {
    try {
        const { data: html, headers } = await axios.get(targetUrl);
        const metadata = await metascraper({ html, url: targetUrl });

        console.log('Title:', metadata.title);
        console.log('Author:', metadata.author);
        console.log('Date Published:', metadata.date);
        console.log('Description:', metadata.description);
        console.log('Image:', metadata.image);
    } catch (error) {
        console.log('Error fetching and parsing the page:', error.message);
    }
};

export const scrapeArticleText = async (targetUrl) => {
    try {
        const { data: html } = await axios.get(targetUrl, {
            maxRedirects: 10, // Set the maximum number of allowed redirects
        });
        // Convert the entire HTML content to plain text
        const articleText = htmlToText(html, {
            wordwrap: false,
            ignoreHref: true,
            ignoreImage: true,
            preserveNewlines: true,
        });

        console.log('Article Text:', articleText);
    } catch (error) {
        console.log('Error fetching and parsing the page:', error.message);
    }
};

export const scrapeArticleDataPaid = async (targetUrl) => {
    const options = {
        method: 'GET',
        url: 'https://lexper.p.rapidapi.com/v1.1/extract',
        params: {
            url: targetUrl,
            js_timeout: '30',
            media: 'true',
        },
        headers: {
            'X-RapidAPI-Key': CREDS.RAPIDAPI_API_KEY,
            'X-RapidAPI-Host': 'lexper.p.rapidapi.com',
        },
    };

    try {
        const response = await axios.request(options);
        return response.data.article;
    } catch (error) {
        console.error(error);
    }
};
