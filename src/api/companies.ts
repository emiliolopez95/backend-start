import { CREDS } from './index';

const companies = [
    {
        id: 1,
        name: 'HoniAI',
        whatsAppNumber: '5491166937440',
        systemMessage:
            'Eres HoniAI, una asistente virtual con Inteligencia Artificial. Tu creador es Emilio López (No tienes más información sobre él), pero él está usando ChatGPT como base.',
        firstMessages: {
            en: [
                `Hi! I'm HoniAI. I'm based on the ChatGPT model from OpenAI. You have 24 hours of free access with unlimited messages :)`,
                `1. To delete previous messages, send: !reset`,
                `2. For updates on new features and news from the world of AI, follow my creator on Instagram: @elvoices_ (https://www.instagram.com/elvoices_)`,
                `3. Now, ask me again:`,
            ],
            es: [
                `Hola! Soy HoniAI. Estoy basada en el modelo ChatGPT de OpenAI.`,
                `1. Para eliminar mensajes anteriores envía: !reset`,
                `2. Para updates de nuevos features y de novedades del mundo de IA, sigue a mi creador en Instagram: @elvoices_ (https://www.instagram.com/elvoices_)`,
                `3. Ahora si, pregúntame otra vez:`,
            ],
        },
        credsField: 'HONI_AI_CREDS',
    },
    {
        id: 2,
        name: 'KinAI',
        whatsAppNumber: '593997186587',
        systemMessage:
            'You are KinAI, an AI assistant on WhatsApp. You have been created by Kin Analytics, a AI consulting company. Your language is very helpful and you use emojis whenever its appropiate. Your knowledge ends on September 2021 so do not give information for current questions',
        firstMessages: {
            en: [
                "Hi! I'm KinAi, your ChatGPT-based assistant on WhatsApp, developed by Kin Analytics.",
                '1. ❕ My knowledge is limited to data up until September 2021, so my responses may occasionally contain outdated information and errors.',
                '2. You can send me text 💬 or audio 🎙 messages in any language 🇫🇷, 🏴󠁧󠁢󠁥󠁮󠁧󠁿, 🇪🇸, etc.... :)!',
                '3. 🔐 To delete previous messages, send: !reset. All of your messages will be deleted after 15 minutes of inactivity.',
                '4. 🌐 If you want to leverage the power of AI in your business, please contact us on LinkedIn: https://www.linkedin.com/company/kin-analytics/',
                '5. Ask me anything. How can I help you?',
            ],
            es: [
                '¡Hola! Soy KinAi, tu asistente en WhatsApp basado en ChatGPT, desarrollado por Kin Analytics.',
                '1. ❕ Mi conocimiento se limita a los datos hasta septiembre de 2021, por lo que mis respuestas pueden contener información desactualizada y errores ocasionalmente.',
                '2. ¡Puedes enviarme mensajes de texto 💬 o de audio 🎙 en cualquier idioma 🇫🇷, 🏴󠁧󠁢󠁥󠁮󠁧󠁿, 🇪🇸, etc.... :)!',
                '3. 🔐 Para borrar mensajes anteriores, envía: !reset. Todos tus mensajes se borrarán después de 15 minutos de inactividad.',
                '4. 🌐 Si quieres aprovechar el poder de la IA en tu negocio, contáctanos en LinkedIn: https://www.linkedin.com/company/kin-analytics/',
                '5. ¡Pregúntame lo que sea! ¿Cómo puedo ayudarte?',
            ],
        },
        credsField: 'KIN_AI_CREDS',
    },
    {
        id: 3,
        name: 'CoachAI',
        whatsAppNumber: '5491161297812',
        systemMessage:
            'You are CoachAI, an AI assistant on WhatsApp. You have been created by Emilio and Ale. Your language is very helpful and you use emojis whenever its appropiate. Your knowledge ends on September 2021 so do not give information for current questions',
        firstMessages: {
            en: [
                "Hi! I'm KinAi, your ChatGPT-based assistant on WhatsApp, developed by Kin Analytics.",
                '1. ❕ My knowledge is limited to data up until September 2021, so my responses may occasionally contain outdated information and errors.',
                '2. You can send me text 💬 or audio 🎙 messages in any language 🇫🇷, 🏴󠁧󠁢󠁥󠁮󠁧󠁿, 🇪🇸, etc.... :)!',
                '3. 🔐 To delete previous messages, send: !reset. All of your messages will be deleted after 15 minutes of inactivity.',
                '4. 🌐 If you want to leverage the power of AI in your business, please contact us on LinkedIn: https://www.linkedin.com/company/kin-analytics/',
                '5. Ask me anything. How can I help you?',
            ],
            es: [
                '¡Hola! Soy CoachaAI, tu asistente en WhatsApp basado en ChatGPT, desarrollado por Kin Analytics.',
                '1. ❕ Mi conocimiento se limita a los datos hasta septiembre de 2021, por lo que mis respuestas pueden contener información desactualizada y errores ocasionalmente.',
                '2. ¡Puedes enviarme mensajes de texto 💬 o de audio 🎙 en cualquier idioma 🇫🇷, 🏴󠁧󠁢󠁥󠁮󠁧󠁿, 🇪🇸, etc.... :)!',
                '3. 🔐 Para borrar mensajes anteriores, envía: !reset. Todos tus mensajes se borrarán después de 15 minutos de inactividad.',
                '4. 🌐 Si quieres aprovechar el poder de la IA en tu negocio, contáctanos en LinkedIn: https://www.linkedin.com/company/kin-analytics/',
                '5. ¡Pregúntame lo que sea! ¿Cómo puedo ayudarte?',
            ],
        },
        credsField: 'COACH_AI_CREDS',
    },
];

export default companies;
