import axios from "axios";
import * as cheerio from "cheerio";
import cron from 'node-cron';

const PAGE = 1;
const MAX_PAGES = 5;

const SCRAPE_URL = (page) => `https://krisha.kz/prodazha/kvartiry/almaty/?page=${page}`;
const TIMEOUT = 30000;
const MAX_RETRIES = 5;
const BACKOFF_FACTOR = 1000;

export const properties = [];

async function scrapePage(url, retries = 0) {
    try {
        const response = await axios.get(url, {timeout: TIMEOUT});
        const html = response.data;
        const $ = cheerio.load(html);

        $('.a-card').each((index, element) => {
            const title = $(element).find('.a-card__title').text().trim();
            const price = $(element).find('.a-card__price').text().trim().replace(/\s+/g, ' ');
            const location = $(element).find('.a-card__subtitle').text().trim();
            const description = $(element).find('.a-card__text-preview').text().trim();
            const link = $(element).find('.a-card__image a').attr('href');
            const views = $(element).find('.a-view-count').text().trim();

            properties.push({
                title,
                price,
                location,
                description,
                views,
                link: link ? `https://krisha.kz${link}` : null
            });
        });

        console.log(`Page ${url}`, properties);

    } catch (err) {
        if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
            if (retries < MAX_RETRIES) {
                const delay = BACKOFF_FACTOR * Math.pow(2, retries);
                console.log(`Timeout error on ${url}, retrying in ${delay / 1000} seconds (${retries + 1}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                await scrapePage(url, retries + 1);
            } else {
                console.error(`Failed to scrape ${url} after ${MAX_RETRIES} retries:`, err);
            }
        } else {
            console.error(`Failed to scrape ${url}:`, err);
        }
    }
}

async function scrapeWebSite() {
    for (let page = 1; page <= MAX_PAGES; page++) {
        const url = SCRAPE_URL(page);
        await scrapePage(url);
    }
}

export const job = cron.schedule('0 12 * * *', () => {
    console.log('Running cron job to scrape website...');
    properties.length = 0;
    scrapeWebSite();
});

(async () => {
    await scrapeWebSite();
})();
