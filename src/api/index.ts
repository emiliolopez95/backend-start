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

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfmpegPath(ffmpegPath.path);

dotenv.config();
import { Configuration, OpenAIApi } from 'openai';

export const CREDS = getCredentials();
const base = new Airtable({ apiKey: CREDS.AIRTABLE_API_KEY }).base('appt0uaa6bw7gg6OP');

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

app.get('/webhooks', async (req, res) => {
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

async function start({ userId, inputMessage, timestamp }) {
    if (!userId) {
        return null;
    }
    let user = await usePrisma.user.findUnique({ where: { id: userId } });

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

    let usersLast24HoursMessages = await usePrisma.message.count({
        where: {
            session: { userId: userId },
            createdAt: {
                gte: new Date(new Date().setHours(0)),
                lt: new Date(new Date().setHours(23, 59, 59)),
            },
            role: 'user',
        },
    });

    // if (usersLast24HoursMessages === 5) {
    //     await sendMessage({
    //         toNumber: userId,
    //         message: `Has enviado 5 mensajes hoy! Envía mi link a tus contactos para que te quieran más: \n\nhttps://api.whatsapp.com/send?phone=5491166937440&text=Hola%20Honi!%20Dame%20un%20dato%20curioso%20de%20alg%C3%BAn%20latino%20famoso`,
    //     });
    // }

    if (!user) {
        user = await usePrisma.user.create({ data: { id: userId } });
        await sendMessage({
            toNumber: userId,
            message: `Hola! Soy HoniAI. Estoy basada en el modelo GPT-3.5 de OpenAI. Tienes 24 horas gratis con mensajes ilimitados :)`,
        });
        await sendMessage({
            toNumber: userId,
            message: `1. Para eliminar mensajes anteriores envía: !reset`,
        });
        await sendMessage({
            toNumber: userId,
            message: `2. Para updates de nuevos features y de novedades del mundo de IA, sigue a mi creador en Instagram: @elvoices_ (https://www.instagram.com/elvoices_)`,
        });

        await sendMessage({
            toNumber: userId,
            message: `3. Ahora si, pregúntame otra vez:`,
        });
        return;
    }

    if (inputMessage.indexOf('!verificar') > -1) {
        let splitted = inputMessage.split(' ');
        console.log(splitted.length == 2);
        if (user.subscribed) {
            await sendMessage({
                toNumber: userId,
                message: `Ya cuentas con una subscripción!`,
            });
            return;
        }
        if (splitted.length == 2) {
            let recordId = splitted[1];
            try {
                let record = await base('subscriptions').find(recordId);
                let email = record.get('email').toString();
                if (email) {
                    await usePrisma.user.update({
                        where: { id: userId },
                        data: { email: email, subscribed: true, subscriptionId: recordId },
                    });
                    await sendMessage({
                        toNumber: userId,
                        message: `Has sido verificado con éxito! Ahora tienes acceso a mensajes ilimitados`,
                    });
                    return;
                }
            } catch (e) {
                await sendMessage({
                    toNumber: userId,
                    message: `El código de verificación es incorrecto. Por favor contáctate con nosotros a info@honiai.com`,
                });
                return;
            }
        }
    }

    if (inputMessage === '!reset') {
        await usePrisma.message.updateMany({
            where: { role: 'user', session: { userId: userId, isActive: true } },
            data: { content: 'DELETED' },
        });
        await usePrisma.session.updateMany({ where: { userId: userId, isActive: true }, data: { isActive: false } });

        await sendMessage({ toNumber: userId, message: `***Ok reiniciamos la conversación!***` });
        return;
    }

    let activeSession: any = await usePrisma.session.findFirst({
        where: { userId: userId, isActive: true },
        select: { id: true, userId: true, createdAt: true, messages: true, lastActiveAt: true },
    });

    let secondsSinceLastActive =
        activeSession && activeSession.lastActiveAt
            ? Math.round(new Date().getTime() / 1000) -
              Math.round(new Date(activeSession.lastActiveAt).getTime() / 1000)
            : 0;
    if (secondsSinceLastActive > 60 * 15) {
        await usePrisma.message.updateMany({
            where: { role: 'user', session: { userId: userId, isActive: true } },
            data: { content: 'DELETED' },
        });
        await usePrisma.session.update({ where: { id: activeSession.id }, data: { isActive: false } });
        await sendMessage({
            toNumber: userId,
            message:
                '***Empezamos una nueva conversación. Se reinician eviando "!reset" o por estar más de 15 min inactivo.***',
        });
    }

    if (!activeSession) {
        activeSession = await usePrisma.session.create({ data: { userId: userId, isActive: true } });
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
            content:
                'Eres HoniAI, una asistente virtual con Inteligencia Artificial. Tu creador es Emilio López (No tienes más información sobre él), pero él está usando ChatGPT como base.',
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

    await usePrisma.message.createMany({ data: storeNewMessages });

    await usePrisma.session.update({ where: { id: activeSession.id }, data: { lastActiveAt: new Date() } });

    await sendMessage({ toNumber: userId, message: aiNewMessage });
}

let vnAccessPhones = [
    '6281237650551',
    '491744042835',
    '573103565492',
    '593984589872',
    '593992953483',
    '593998139457',
    '17788599430',
    '6282145498805',
    '34600826255',
    '13057338641',
    '593991485099',
    '593999822097',
    '593999700610',
    '593991018023',
    '573208990920',
    '15177550013',
];

app.post('/webhooks', async (req, res) => {
    console.log('req.body', JSON.stringify(req.body));

    let entries = req.body?.entry;

    console.log('Entries', JSON.stringify(entries));

    if (entries && entries.length) {
        let useEntry = entries[0];
        if (useEntry.changes) {
            for (let change of useEntry.changes) {
                if (change.value.messages && change.value.messages.length == 1) {
                    for (let message of change.value.messages) {
                        if (message.type === 'text') {
                            await start({
                                userId: message.from,
                                inputMessage: message.text.body,
                                timestamp: message.timestamp,
                            });
                        } else if (message.type === 'audio' && vnAccessPhones.indexOf(message.from) > -1) {
                            let textMessage = await getAudioMessage({ audioId: message.audio.id });
                            if (!!textMessage.message && !textMessage.error) {
                                await start({
                                    userId: message.from,
                                    inputMessage: textMessage.message,
                                    timestamp: message.timestamp,
                                });
                            } else {
                                sendMessage({
                                    toNumber: message.from,
                                    message: textMessage.error || 'Error al procesar el audio. Intenta de nuevo.',
                                });
                            }
                        } else if (message.type === 'audio' && vnAccessPhones.indexOf(message.from) < 0) {
                            sendMessage({
                                toNumber: message.from,
                                message: 'Audio feature coming soon! Por ahora solo acepto texto :)',
                            });
                        }
                    }
                }
            }
        }
    }

    res.send({ success: `Test endpoint ${CREDS ? 'Working creds' : 'NO CREDS'}` });
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

async function getAudioMessage({ audioId }) {
    let url = `https://graph.facebook.com/v14.0/${audioId}`;

    let headers = {
        Authorization: `Bearer ${CREDS.FB_GRAPH_TOKEN}`,
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
            returnObj.error = 'Audio demasiado largo. Máximo puede ser 2 minuto.';
            return returnObj;
        }

        try {
            //ts-ignore
            let textResponse = await openai.createTranscription(fs.createReadStream(filePathMp3) as any, 'whisper-1');
            returnObj.message = textResponse.data.text;
        } catch (e) {
            console.error('Open AI request failed!');
            returnObj.error = 'Error al procesar el audio. Intenta de nuevo.';
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
        returnObj.error = 'Error al procesar el audio. Intenta de nuevo.';
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

async function sendMessage({ toNumber, message }) {
    let token = CREDS.FB_GRAPH_TOKEN;
    let url = `https://graph.facebook.com/v15.0/${CREDS.FB_GRAPH_ID}/messages`;

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
