const systemMessages = {
    RESTART_CONV: {
        en: '***Restarting conversation!***',
        es: '***¡Reiniciando conversación!***',
    },
    RESTART_CONV_INACTIVITY: {
        en: '***Restarting conversation. It resets by sending "!reset" or by 15 minutes of inactivty.***',
        es: '***Reiniciando conversación. Se reinicia enviando "!reset" o después de 15 minutos de inactividad.***',
    },
    ERROR_PROCESSING_AUDIO: {
        en: 'Error processing the audio. Please try again.',
        es: 'Error al procesar el audio. Por favor, inténtalo de nuevo.',
    },
    ERROR_AUDIO_TOO_LONG: {
        en: 'Audio is too long. Max length is 2 minutes.',
        es: 'El audio es demasiado largo. La duración máxima es de 2 minutos.',
    },
};

export default systemMessages;
