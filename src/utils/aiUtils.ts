// aiUtils.ts
import { Configuration, OpenAIApi } from 'openai';
import { getCredentials } from '../config/config';
import { findJsonFromString } from './stringUtils';
import urlUtils from './urlUtils';
export const CREDS = getCredentials();

const configuration = new Configuration({
    apiKey: CREDS.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// aiUtils.ts
export const stringSplitter = (input: string, tokens: number, overlap: number): string[] => {
    if (tokens <= 0 || overlap < 0 || overlap >= tokens) {
        throw new Error('Invalid tokens or overlap values');
    }

    const words = input.split(' ');
    const result: string[] = [];

    if (words.length <= tokens) {
        return [input];
    }

    for (let i = 0; i < words.length - tokens + 1; i += tokens - overlap) {
        const slice = words.slice(i, i + tokens);
        result.push(slice.join(' '));
    }

    return result;
};

export const getTextSummary = async (props: {
    input: string;
    lang?: string;
    tokens: number;
    overlap: number;
}): Promise<string> => {
    let { input, lang, tokens, overlap } = props;

    if (!lang) {
        lang = 'en';
    }

    input = urlUtils.replaceUrlsWithDomains(input);

    let pages = stringSplitter(input, tokens, overlap);

    let jsonFormat = `Respond in this format ((use the "${lang}" language for your response)): { "summary": "" // 2-3 sentence summary, "keyPoints": [""] //key points, "counterArguments": ""//counter arguments }`;
    let stringFormat = `'Respond in this format ((Important you respond in Spanish)): Summary: <2-3 sentence summary> \n\n Key Points: < 2 - 4 key points> \n\n Counter Arguments: <2- 4 counter arguments>'`;

    let useFormat = stringFormat;

    let pagesArray = [];
    let maxLength = pages.length <= 3 ? pages.length : 3;
    for (let i = 0; i < maxLength; i++) {
        let page = pages[i];
        let messages = [
            {
                role: 'system',
                content: `'Please give me a outline of this part of the article and a summary of each outlined part. Do it in the text of the article. ${useFormat}'`,
            },
            {
                role: 'user',
                content: page,
            },
        ];

        let aiMessage = await getAIMessage({ messages });

        // let json = findJsonFromString(aiMessage);

        pagesArray.push({
            index: i,
            text: page,
            // aiJson: json,
            aiText: aiMessage,
        });
    }

    if (pagesArray.length == 1) {
        return pagesArray[0].aiText;
    }

    let pagesText = '';

    pagesArray.forEach((page) => {
        pagesText += `Page ${page.index}: ${page.aiText}`;
    });

    let finalSumaryPrompt = [
        {
            role: 'system',
            content: `Ill send you the summarized pages of an article and its keypoints. ${useFormat}`,
        },
        {
            role: 'user',
            content: `This are the pages: ${pagesText}`,
        },
    ];

    let finalSumary = await getAIMessage({ messages: finalSumaryPrompt });

    return finalSumary;
};

export async function getAIMessage({ messages, model = 'gpt-3.5-turbo', temperature = 0 }) {
    try {
        const newMessage = await openai.createChatCompletion({
            model: model,
            messages: messages,
            temperature,
        });

        if (newMessage) {
            let useMessage = '';
            newMessage.data.choices.forEach((choice) => {
                let role = choice.message.role;
                let message = choice.message.content;
                if (role == 'assistant') {
                    useMessage = message;
                }
            });
            return useMessage;
        }
    } catch (e) {
        console.error('Error getting AI message', e);
        return 'Ha ocurrido un error generando la respuesta. Intenta de nuevo.';
    }
}
