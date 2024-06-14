import express from 'express';
import {job, properties} from "./bacgroundTask.js";

const app = express();

job.start();

app.get('/apartments', (req, res) => {
    const {page = 1, limit = 10} = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
        return res.status(400).send('Invalid pagination parameters');
    }

    try {
        const startIndex = (pageNumber - 1) * limitNumber;
        const endIndex = startIndex + limitNumber;
        res.json(properties.slice(startIndex, endIndex));
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/apartments/analysis', (req, res) => {
    try {
        const totalProperties = properties.length;
        const averagePrice = properties.reduce((sum, prop) => {
            const price = parseInt(prop.price.replace(/[^\d]/g, ''));
            return sum + (isNaN(price) ? 0 : price);
        }, 0) / totalProperties;

        const districtCounts = properties.reduce((counts, prop) => {
            const district = prop.location.split(',')[0];
            counts[district] = (counts[district] || 0) + 1;
            return counts;
        }, {});

        res.json({
            totalProperties,
            averagePrice: Math.round(averagePrice),
            districtCounts
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
