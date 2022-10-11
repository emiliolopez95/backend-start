// @ts-ignore
import express from 'express';
import cors from 'cors';
// @ts-ignore
import bodyParser from 'body-parser';
import * as firebaseAdmin from 'firebase-admin';
import { initializeApp as adminInitializeApp } from 'firebase-admin/app';
import { getCredentials } from '../config/config';
import createAccount from './endpoints/accounts/createAccount';
import { PrismaClient } from '@prisma/client';
import createUser from './endpoints/users/createUser';
import getAccountAllUsers from './endpoints/accounts/getAccountAllUsers';
export const usePrisma = new PrismaClient();
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 4000;

const corsConfig = {
    // origin: isProduction ? 'https://example.com' : '*',
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'PUT', 'POST'],
};

//Firebase

export const CREDS = getCredentials();

// @ts-ignore
let adminApp = adminInitializeApp({ credential: firebaseAdmin.credential.cert(CREDS.GCP_SERVICE_ACCOUNT) });

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors(corsConfig));

app.use(express.json());

app.post('/createAccount', async (req, res) => {
    let response = await createAccount({ params: req.body });
    res.send(response);
});

app.get('/getAccountAllUsers', async (req, res) => {
    let response = await getAccountAllUsers({ accountId: +req.query.accountId });
    res.send(response);
});

app.post('/createUser', async (req, res) => {
    let response = await createUser({ accountId: +req.body.accountId, params: req.body });
    res.send(response);
});

app.get('/test', async (req, res) => {
    res.send({ success: `Test endpoint ${CREDS ? 'Working creds' : 'NO CREDS'}` });
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
