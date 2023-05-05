// import { PDFLoader } from 'langchain/document_loaders';

import { mainModule } from 'process';
import { getTextSummary } from '../utils/aiUtils';
import { scrapeArticleDataPaid, scrapeArticleText, scrapeMetadata } from '../utils/scrapingUtils';
import urlUtils from '../utils/urlUtils';

// const loader = new PDFLoader('/Users/emiliolopez/Desktop/coding/backend-start/218285604136915.pdf', {
//     pdfjs: () => import('pdfjs-dist/legacy/build/pdf.js').then((mod) => mod.default),
// });

// async function getData() {
//     const docs = await loader.load();
//     console.log(docs);
// }
// getData();

async function main() {
    let inputMessage = `Puedes darme un resumen de esto? https://twitter.com/rachel_l_woods/status/1654274717845716992`;
    let url = urlUtils.getUrlsFromString(inputMessage)[0];

    // let url =
    //     'https://www.elcomercio.com/actualidad/negocios/ecuador-registra-mas-influencers-sri-buscara-tributen.html';

    let article: any = await scrapeArticleDataPaid(url);

    console.log(article);

    if (article.is_article && article.text) {
        let summary = await getTextSummary({
            input: article.text,
            lang: article.language,
            tokens: 1000,
            overlap: 250,
        });
        console.log('summary', summary);
    }

    console.log(`Not an article`);
    // let text = `'El Plan Todos Contribuimos será impulsado por el SRI para endurecer el control tributario a personas naturales y al comercio electrónico informal. Foto: Archivo / EL COMERCIO
    // Ecuador tiene 112 276 i  nfluencers o creadores de contenidos  , según un estudio de la empresa de marketing  Influencity  . El  Servicio de Rentas Internas (SRI)  busca incluirlos en el cobro de  impuestos este 2023  .
    // Francisco Briones, director del SRI,  no dio detalles de cómo se ejecutará el proyecto con el se busca endurecer el control tributario a personas naturales, como los  influencers, y al comercio electrónico informal  en este 2023. La iniciativa se denomina  Plan Todos Contribuimos.
    // Sin embargo, dijo: "El mundo de los influencers y redes sociales está generando cada vez más rentas, más movimiento económico y de la mano va el comercio electrónico informal, y no están pagando ningún tipo de impuestos".

    // PLAN TODOS CONTRIBUIMOS
    // Briones  señaló que  este plan será permanente  y que paulatinamente se irá localizando e incluyendo a todo el  comercio electrónico informal y a los influencers  . "A partir de ahí, se busca crear cultura tributaria, que la gente vaya entendiendo que debe declarar sus ingresos, sus ventas, etc.", agregó.
    // Ecuador  no sería el primer país que cobre impuestos a los  creadores de contenid  o.  En España, Chile, Perú, entre otros, ya están incluidos en el pago de impuestos.
    // En Colombia ya está en análisis una propuesta de  cobrar impuestos a influencers  .
    // La lógica para cobrar tributos a los  influencers  es que cualquier persona que desarrolle una actividad de manera recurrente y genere ingresos de forma continua debe declararlos y pagar renta por los mismos.
    // Por tanto, todos los instagrammers y  youtubers  que obtengan ganancias por Internet deben tributar.

    // LA META NO FUE DIFUNDIDA
    // Para Javier Bustos, experto en temas tributarios, no está claro c  ómo será el proceso para identificar a los creadores de contenidos en YouTube, Instagram, Tik Tok  y otras plataformas que monetizan, ya que estas empresas no tienen la obligación de entregar un reporte al Ecuador.
    // Mientras que los influencers que generan ingresos por prestar servicios a marcas o presentaciones entregan facturas por sus servicios y por ende pagan impuestos.
    // El  SRI no dio detalles de cuántos infuencers espera incluir este año  ni el monto que recaudaría con esta acción.
    // Sin embargo, señaló que el plan para este año es buscar justicia tributaria. Es decir, que todos paguen todo lo que deben pagar; el que vende sin factura; el que no reporta ingresos o el que infla gastos. Además, el que vende sin  IVA  ; el que no justifica incremento patrimonial...
    // -  Influencers y comercio electrónico informal están en la mira del SRI
    // -  El SRI actualiza el formulario para la declaración del Impuesto a la Renta
    // -  ¿Quiénes deben llenar el formulario de proyección de gastos?

    // VISITA NUESTROS PORTALES:
    // -  Las noticias de Quito en  www.ultimasnoticias.ec
    // -  Lo mejor del fútbol solo  www.benditofutbol.com
    // -  Negocios y emprendimientos  www.revistalideres.ec
    // -  Más sobre el hogar en  www.revistafamilia.ec'`;

    // let summary = await getTextSummary(text, 1000, 250);

    // console.log(summary);
}

main();
