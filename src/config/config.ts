import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config();

export interface ICreds {
    FIREBASE_API_KEY: string;
    FIREBASE_SERVICE_ACCOUNT: object;
    FIRESTORE_URL: string;
    MYSQL_CONFIG: any;
    GCP_SERVICE_ACCOUNT: object;
    SENDGRID_API_KEY: string;
    FROM_EMAIL: string;
    AURORA_DATABASE_URL: string;
    PRISMA_DATABASE_URL: string;
    PRISMA__SHADOW_DATABASE_URL: string;
    CLIENT_DOMAIN: string;
    BUCKET_NAME: string;
    OPENAI_API_KEY: string;
    AIRTABLE_API_KEY: string;
    PINECONE_CONFIG: any;
    COMPANIES_CREDS: object;
    REDIS_URL: string;
}
export const getCredentials = function (): ICreds {
    let creds: ICreds;

    // if (process.env.ENVIRONMENT === 'development' || process.argv[2] == 'prefill') {
    //     let credFileName = '.creds.json'; //CAMBIAR!!!!! -> QUITAR EL _prod
    //     if (process.argv[2] == 'prefill') {
    //         if (process.argv[3] === 'staging') {
    //             credFileName = '.creds_staging.json';
    //         } else if (process.argv[3] === 'prod') {
    //             credFileName = '.creds_prod.json';
    //         }
    //     }
    //
    //     console.log(`Prefilling file name: ${credFileName}`)
    //     const filePath = path.join(__dirname, `./${credFileName}`);
    //     let jsonText = fs.readFileSync(filePath, 'utf8');
    //     creds = JSON.parse(jsonText);
    // } else {
    //     const jsonText = await getSecretValue(process.env.CREDS_SECRET_NAME);
    //     creds = JSON.parse(jsonText);
    // }

    // let credFileName = '../../creds.json';
    // const filePath = path.join(__dirname, `./${credFileName}`);
    // if (fs.existsSync(filePath)) {
    //     let jsonText = fs.readFileSync(filePath, 'utf8');
    //     creds = JSON.parse(jsonText);
    // } else {
    //     creds = {
    //         FIREBASE_API_KEY: '',    //         FIREBASE_SERVICE_ACCOUNT: {},
    //         FIRESTORE_URL: '',
    //         GCP_SERVICE_ACCOUNT: {},
    //         MYSQL_CONFIG: '',
    //         SENDGRID_API_KEY: '',
    //         FROM_EMAIL: '',
    //         CLIENT_DOMAIN: '',
    //         BUCKET_NAME: '',
    //         AURORA_DATABASE_URL: '',
    //         PRISMA_DATABASE_URL: '',
    //         PRISMA__SHADOW_DATABASE_URL: '',
    //     };
    // }

    creds = JSON.parse(process.env.CREDS);
    return {
        FIREBASE_API_KEY: creds.FIREBASE_API_KEY,
        FIREBASE_SERVICE_ACCOUNT: creds.FIREBASE_SERVICE_ACCOUNT,
        FIRESTORE_URL: creds.FIRESTORE_URL,
        GCP_SERVICE_ACCOUNT: creds.GCP_SERVICE_ACCOUNT,
        MYSQL_CONFIG: creds.MYSQL_CONFIG,
        SENDGRID_API_KEY: creds.SENDGRID_API_KEY,
        FROM_EMAIL: creds.FROM_EMAIL,
        CLIENT_DOMAIN: creds.CLIENT_DOMAIN,
        BUCKET_NAME: creds.BUCKET_NAME,
        AURORA_DATABASE_URL: creds.AURORA_DATABASE_URL,
        PRISMA_DATABASE_URL: creds.PRISMA_DATABASE_URL,
        PRISMA__SHADOW_DATABASE_URL: creds.PRISMA__SHADOW_DATABASE_URL,
        OPENAI_API_KEY: creds.OPENAI_API_KEY,
        AIRTABLE_API_KEY: creds.AIRTABLE_API_KEY,
        PINECONE_CONFIG: creds.PINECONE_CONFIG,
        COMPANIES_CREDS: creds.COMPANIES_CREDS,
        REDIS_URL: creds.REDIS_URL,
    };
};
