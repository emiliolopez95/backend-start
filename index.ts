// @ts-ignore
import express from 'express';
import cors from 'cors';
// @ts-ignore

const app = express();
const PORT = 4000;

const corsConfig = {
    // origin: isProduction ? 'https://padel.com' : '*',
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'PUT', 'POST'],
};

//Firebase

app.use(cors(corsConfig));

app.use(express.json());

app.get('/test', async (req, res) => {
    res.send({ success: 'Hello Cloud Run World' });
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
