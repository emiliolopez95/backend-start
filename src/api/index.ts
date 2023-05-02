// @ts-ignore
import express from 'express';
import cors from 'cors';
// @ts-ignore
import bodyParser from 'body-parser';
import * as firebaseAdmin from 'firebase-admin';
import { initializeApp as adminInitializeApp } from 'firebase-admin/app';
import { getCredentials } from '../config/config';
import { Message, PrismaClient } from '@prisma/client';
export const usePrisma = new PrismaClient();
import fetch from 'node-fetch';
import axios from 'axios';
import dotenv from 'dotenv';
import Airtable from 'airtable';
import fs from 'fs';
import formidable from 'formidable';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import getMP3Duration from 'get-mp3-duration';
import Redis from 'ioredis';

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfmpegPath(ffmpegPath.path);

dotenv.config();
import { Configuration, OpenAIApi } from 'openai';
import companies from './companies';
import systemMessages from './systemMessages';
import { isGeneratorFunction } from 'util/types';

export const CREDS = getCredentials();
const base = new Airtable({ apiKey: CREDS.AIRTABLE_API_KEY }).base('appt0uaa6bw7gg6OP');

let redisClient = new Redis(CREDS.REDIS_URL);

const configuration = new Configuration({
    apiKey: CREDS.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();
const PORT = 4000;

const corsConfig = {
    // origin: isProduction ? 'https://example.com' : '*',
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'PUT', 'POST'],
};

//Firebase

function getNowSeconds() {
    return Math.round(Date.now() / 1000);
}
// @ts-ignore
let adminApp = adminInitializeApp({ credential: firebaseAdmin.credential.cert(CREDS.GCP_SERVICE_ACCOUNT) });

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors(corsConfig));

app.use(express.json());

app.get('/alive', async (req, res) => {
    res.send({ success: `Keeps alive` });
});

app.get('/reset', async (req, res) => {});

app.get('/wa-webhooks/:id', async (req, res) => {
    if (req.query) {
        if (req.query['hub.challenge']) {
            res.send(req.query['hub.challenge']);
            return;
        }
    }
    res.send({ error: 'No Query on request' });
});

async function resetSessions() {
    await usePrisma.session.updateMany({
        where: { isActive: true, lastActiveAt: { lt: new Date(new Date().getTime() - 10 * 60 * 1000) } },
        data: {
            isActive: false,
        },
    });

    let activeSessions = await usePrisma.session.findMany({
        where: { isActive: true, lastActiveAt: { lt: new Date(new Date().getTime() - 10 * 60 * 1000) } },
    });
}

function getPhoneLanguage(phone) {
    let useLanguage = 'es';
    if (phone.toString().indexOf(1) === 0) {
        useLanguage = 'en';
    }
    return useLanguage;
}
async function start({ company, whatsAppId, inputMessage, timestamp }) {
    let useLanguage = getPhoneLanguage(whatsAppId);
    if (!whatsAppId) {
        return null;
    }

    let user = await usePrisma.user.findFirst({ where: { companyId: company.id, whatsAppId: whatsAppId } });

    // if (!user.subscribed) {
    //     let timeSinceCreated =
    //         Math.round(new Date().getTime() / 1000) - Math.round(new Date(user.createdAt).getTime() / 1000);

    //     if (timeSinceCreated > 60 * 60 * 72) {
    //         await sendMessage({
    //             toNumber: userId,
    //             message: `Se acabó tu prueba gratis! Para tener mensajes ilimitados regístrate aquí: https://buy.stripe.com/fZe8AAdIB19x6xGaEE`,
    //         });
    //     }
    // }

    if (user) {
        let usersLast24HoursMessages = await usePrisma.message.count({
            where: {
                session: { userId: user.id },
                createdAt: {
                    gte: new Date(new Date().setHours(0)),
                    lt: new Date(new Date().setHours(23, 59, 59)),
                },
                role: 'user',
            },
        });
    }

    // if (usersLast24HoursMessages === 5) {
    //     await sendMessage({
    //         toNumber: userId,
    //         message: `Has enviado 5 mensajes hoy! Envía mi link a tus contactos para que te quieran más: \n\nhttps://api.whatsapp.com/send?phone=5491166937440&text=Hola%20Honi!%20Dame%20un%20dato%20curioso%20de%20alg%C3%BAn%20latino%20famoso`,
    //     });
    // }

    if (!user) {
        user = await usePrisma.user.create({ data: { companyId: company.id, whatsAppId: whatsAppId } });

        for (let message of company.firstMessages[getPhoneLanguage(whatsAppId)]) {
            await sendMessage({
                toNumber: whatsAppId,
                message: message,
                company,
            });
        }
        return;
    }

    // if (inputMessage.indexOf('!verificar') > -1) {
    //     let splitted = inputMessage.split(' ');
    //     console.log(splitted.length == 2);
    //     if (user.subscribed) {
    //         await sendMessage({
    //             toNumber: whatsAppId,
    //             message: `Ya cuentas con una subscripción!`,
    //             company,
    //         });
    //         return;
    //     }
    //     if (splitted.length == 2) {
    //         let recordId = splitted[1];
    //         try {
    //             let record = await base('subscriptions').find(recordId);
    //             let email = record.get('email').toString();
    //             if (email) {
    //                 await usePrisma.user.update({
    //                     where: { id: user.id },
    //                     data: { email: email, subscribed: true, subscriptionId: recordId },
    //                 });
    //                 await sendMessage({
    //                     toNumber: whatsAppId,
    //                     message: `Has sido verificado con éxito! Ahora tienes acceso a mensajes ilimitados`,
    //                     company,
    //                 });
    //                 return;
    //             }
    //         } catch (e) {
    //             await sendMessage({
    //                 toNumber: whatsAppId,
    //                 message: `El código de verificación es incorrecto. Por favor contáctate con nosotros a info@honiai.com`,
    //                 company,
    //             });
    //             return;
    //         }
    //     }
    // }

    if (inputMessage === '!reset') {
        await usePrisma.message.updateMany({
            where: { role: 'user', session: { userId: user.id, isActive: true } },
            data: { content: 'DELETED' },
        });
        await usePrisma.session.updateMany({ where: { userId: user.id, isActive: true }, data: { isActive: false } });

        await sendMessage({ toNumber: whatsAppId, message: systemMessages.RESTART_CONV[useLanguage], company });
        return;
    }

    let activeSession: any = await usePrisma.session.findFirst({
        where: { userId: user.id, isActive: true },
        select: { id: true, userId: true, createdAt: true, messages: true, lastActiveAt: true },
    });

    let secondsSinceLastActive =
        activeSession && activeSession.lastActiveAt
            ? Math.round(new Date().getTime() / 1000) -
              Math.round(new Date(activeSession.lastActiveAt).getTime() / 1000)
            : 0;
    if (secondsSinceLastActive > 60 * 15) {
        await usePrisma.message.updateMany({
            where: { role: 'user', session: { userId: user.id, isActive: true } },
            data: { content: 'DELETED' },
        });
        await usePrisma.session.update({ where: { id: activeSession.id }, data: { isActive: false } });
        await sendMessage({
            toNumber: whatsAppId,
            message: systemMessages.RESTART_CONV_INACTIVITY[useLanguage],
            company,
        });
    }

    if (!activeSession) {
        activeSession = await usePrisma.session.create({ data: { userId: user.id, isActive: true } });
    }

    let sessionMessages = activeSession.messages ? activeSession.messages.sort((a, b) => a.id - b.id) : [];
    let aiMessages = [];
    let storeNewMessages = [];
    if (sessionMessages.length) {
        aiMessages = sessionMessages.map((m) => {
            return { role: m.role, content: m.content };
        });
    } else {
        let firstMessage = {
            sessionId: activeSession.id,
            role: 'system',
            content: company.systemMessage,
            timestamp: getNowSeconds(),
        };
        storeNewMessages.push(firstMessage);
        aiMessages.push({ role: firstMessage.role, content: firstMessage.content });
    }

    let newMessage = {
        sessionId: activeSession.id,
        role: 'user',
        content: `${inputMessage}`,
        timestamp: +timestamp || getNowSeconds(),
    };

    storeNewMessages.push(newMessage);
    aiMessages.push({ role: newMessage.role, content: newMessage.content });

    let aiNewMessage = await getAIMessage({ messages: aiMessages });
    storeNewMessages.push({
        sessionId: activeSession.id,
        role: 'assistant',
        content: aiNewMessage,
        timestamp: getNowSeconds(),
    });

    await sendMessage({ toNumber: whatsAppId, message: aiNewMessage, company });

    await usePrisma.message.createMany({ data: storeNewMessages });

    await usePrisma.session.update({ where: { id: activeSession.id }, data: { lastActiveAt: new Date() } });
}

app.post('/wa-webhooks/:id', async (req, res) => {
    console.log('req.body', JSON.stringify(req.body));

    let entries = req.body?.entry;

    if (entries && entries.length) {
        let useEntry = entries[0];
        if (useEntry.changes) {
            for (let change of useEntry.changes) {
                console.log('CHANGE', JSON.stringify(change));
                let company = null;
                if (change.value.metadata) {
                    let companyWhatsAppNumber = change.value.metadata.display_phone_number;
                    if (companyWhatsAppNumber != req.params.id) {
                        res.send('Message not for me!');
                        return;
                    }
                    company = companies.find((c) => c.whatsAppNumber == companyWhatsAppNumber);
                    console.log(`COMPANY FOUND: ${company.name}`);
                }

                if (company) {
                    if (change.value.messages && change.value.messages.length == 1) {
                        for (let message of change.value.messages) {
                            let messageId = message.id;
                            const messageExists = await redisClient.get(messageId);

                            if (messageExists) {
                                res.send();
                                return;
                            }
                            await redisClient.set(messageId, 1, 'EX', 60 * 60 * 2);

                            if (message.type === 'text') {
                                await start({
                                    whatsAppId: message.from,
                                    company,
                                    inputMessage: message.text.body,
                                    timestamp: message.timestamp,
                                });
                            } else if (message.type === 'audio') {
                                let textMessage = await getAudioMessage({ audioId: message.audio.id, company });
                                if (!!textMessage.message && !textMessage.error) {
                                    await start({
                                        whatsAppId: message.from,
                                        company,
                                        inputMessage: textMessage.message,
                                        timestamp: message.timestamp,
                                    });
                                } else {
                                    sendMessage({
                                        toNumber: message.from,
                                        message:
                                            textMessage.error && systemMessages[textMessage.error]
                                                ? systemMessages[textMessage.error][getPhoneLanguage(message.from)]
                                                : systemMessages.ERROR_PROCESSING_AUDIO[getPhoneLanguage(message.from)],
                                        company,
                                    });
                                }
                            } else if (message.type === 'document') {
                                let textMessage = await getWhatsAppFile({
                                    fileId: message.document.id,
                                    company,
                                });
                            }
                        }
                    }
                } else {
                    console.error(`NO COMPANY FOUND`);
                }
            }
        }
    }
    res.send({ success: `Test endpoint ${CREDS ? 'Working creds' : 'NO CREDS'}` });
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

async function getWhatsAppFile({ fileId, company }) {
    let graphToken = CREDS.COMPANIES_CREDS[company.credsField].FB_GRAPH_TOKEN;
    let url = `https://graph.facebook.com/v14.0/${fileId}`;

    let headers = {
        Authorization: `Bearer ${graphToken}`,
    };

    let returnObj = {
        message: '',
        error: null,
    };
    try {
        let response = await axios.get(url, { headers });
        let mediaUrl = response.data.url;

        let mediaResponse = await axios.get(mediaUrl, { headers, responseType: 'arraybuffer' });

        const buffer = Buffer.from(mediaResponse.data);

        // Guarda el archivo en el disco
        let fileName = `${fileId}`;
        let filePathPdf = `${fileName}.pdf`;
        fs.writeFileSync(filePathPdf, buffer);
        returnObj.message = 'ok';
    } catch (e) {
        console.log(e);
        returnObj.error = 'Error processing audio. Please try again.';
    }
}

async function getAudioMessage({ audioId, company }) {
    let graphToken = CREDS.COMPANIES_CREDS[company.credsField].FB_GRAPH_TOKEN;
    let url = `https://graph.facebook.com/v14.0/${audioId}`;

    let headers = {
        Authorization: `Bearer ${graphToken}`,
    };

    let returnObj = {
        message: '',
        error: null,
    };
    try {
        let response = await axios.get(url, { headers });
        let mediaUrl = response.data.url;

        let mediaResponse = await axios.get(mediaUrl, { headers, responseType: 'arraybuffer' });

        // Crear un buffer desde los datos de respuesta binarios
        const buffer = Buffer.from(mediaResponse.data);

        // Guarda el archivo en el disco
        let fileName = `${audioId}`;
        let filePathOgg = `${fileName}.ogg`;
        let filePathMp3 = `${fileName}.mp3`;
        fs.writeFileSync(filePathOgg, buffer);
        await convertOggToMp3(filePathOgg, filePathMp3);
        const readMP3File = fs.readFileSync(filePathMp3);
        const duration = getMP3Duration(readMP3File);
        let maxSeconds = 120;

        if (duration > maxSeconds * 1000) {
            returnObj.error = 'ERROR_AUDIO_TOO_LONG';
            return returnObj;
        }

        try {
            //ts-ignore
            let textResponse = await openai.createTranscription(fs.createReadStream(filePathMp3) as any, 'whisper-1');
            returnObj.message = textResponse.data.text;
        } catch (e) {
            console.error('Open AI request failed!');
            returnObj.error = 'ERROR_PROCESSING_AUDIO';
        } finally {
            if (fs.existsSync(filePathOgg)) {
                fs.unlinkSync(filePathOgg);
            }
            if (fs.existsSync(filePathMp3)) {
                fs.unlinkSync(filePathMp3);
            }
        }
    } catch (e) {
        console.log(`This is the error ${e}`);
        returnObj.error = 'Error processing audio. Please try again.';
    }
    return returnObj;
}

function convertOggToMp3(inputPath: string, outputPath: string) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .audioCodec('libmp3lame')
            .audioQuality(2)
            .on('error', (err: Error) => reject(err))
            .on('end', () => resolve('Conversion complete'))
            .save(outputPath);
    });
}

async function sendMessage({ toNumber, message, company }) {
    let token = CREDS.COMPANIES_CREDS[company.credsField].FB_GRAPH_TOKEN;
    let graphId = CREDS.COMPANIES_CREDS[company.credsField].FB_GRAPH_ID;
    let url = `https://graph.facebook.com/v16.0/${graphId}/messages`;

    let headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    let data = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toNumber,
        type: 'text',
        text: {
            preview_url: false,
            body: message,
        },
    };

    try {
        let response = await axios.post(url, data, { headers });
    } catch (e) {
        console.log(`This is the error ${e}`);
    }
}

async function getAIMessage({ messages }) {
    try {
        const newMessage = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: messages,
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
