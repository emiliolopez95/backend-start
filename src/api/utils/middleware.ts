// import * as admin from 'firebase-admin';
// import { usePrisma } from '..';

// let isProduction = false;

// import mysql from '../../common/mysql_worker';

// export function endRequest(status: 400 | 401 | 403, message: string, res: any): any {
//     return res.status(status).send({ message });
// }

// export function getTokenFromBearer(tokenBearer: string) {
//     let token;
//     if (tokenBearer && tokenBearer.toString().includes('Bearer')) {
//         token = tokenBearer.toString().substr(7);
//     } else {
//         token = tokenBearer;
//     }
//     return token;
// }

// export function schedulerAuthenticated() {
//     return async (req, res, next) => {
//         const tokenBearer = req.headers['authorization'];
//         const token = getTokenFromBearer(tokenBearer);

//         if (!token) {
//             return endRequest(403, 'No token provided.', res);
//         }
//         if (token !== process.env.LAMBDA_PROVIDER_SECRET) {
//             return endRequest(403, 'Invalid token.', res);
//         }
//         return next();
//     };
// }

// export function adminRequest() {
//     return async (req, res, next) => {
//         const aurora = mysql();
//         const tokenBearer = req.headers['authorization'];
//         const token = getTokenFromBearer(tokenBearer);
//         try {
//             if (!token) {
//                 return endRequest(401, 'No token provided.', res);
//             }
//             const decodedToken = await admin.auth().verifyIdToken(token);
//             const firebaseId = decodedToken.uid;
//             let q = `SELECT * FROM users WHERE firebaseId = ${aurora.escape(firebaseId)}`;
//             const users = await aurora.query(q);
//             const user = users[0];

//             if (!user) {
//                 return endRequest(401, 'Bad token provided.', res);
//             }
//             if (user.role !== 'admin') {
//                 return endRequest(401, 'Not enough credentials.', res);
//             }
//             req.userId = user.id;
//             return next();
//         } catch (err) {
//             console.log(err);
//             return endRequest(401, 'Error decoding token', res);
//         }
//     };
// }

// export function addUserId() {
//     return async (req, res, next) => {
//         const tokenBearer = req.headers['authorization'];
//         const token = getTokenFromBearer(tokenBearer);
//         try {
//             const decodedToken = await admin.auth().verifyIdToken(token);
//             const userId = decodedToken.uid;
//             req.userId = userId;
//             return next();
//         } catch (err) {
//             const userId = null;
//             req.userId = userId;
//             return next();
//         }
//     };
// }

// export function authenticatedRequest() {
//     return async (req, res, next) => {
//         const aurora = mysql();
//         const tokenBearer = req.headers['authorization'];
//         const token = getTokenFromBearer(tokenBearer);
//         try {
//             if (!token) {
//                 return endRequest(401, 'No token provided.', res);
//             }
//             console.log('AppName: ', admin.app().name);
//             const decodedToken = await admin.auth().verifyIdToken(token);
//             const firebaseId = decodedToken.uid;

//             let user = await usePrisma.user.findFirst({ where: { firebaseId } });

//             if (!user) {
//                 return endRequest(401, 'Bad token provided.', res);
//             }
//             req.userId = user.id;
//             req.accountId = user.accountId;
//             return next();
//         } catch (err) {
//             console.log(err);
//             return endRequest(401, 'Error decoding token', res);
//         }
//     };
// }
