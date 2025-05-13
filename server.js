const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

const FILE_PATH = path.join(__dirname, 'orders.json');

if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, '[]', 'utf8');
}

function loadOrders() {
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
}

function saveOrders(data) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

app.post('/orders', (req, res) => {
    try {
        const orders = loadOrders();
        const newOrder = { id: Date.now(), ...req.body };
        orders.push(newOrder);
        saveOrders(orders);
        res.status(201).json({ message: 'Order saved' });
    } catch (err) {
        console.error('Error saving order:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/orders', (req, res) => {
    try {
        const orders = loadOrders();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/orders/:id', (req, res) => {
    try {
        const orders = loadOrders();
        const filteredOrders = orders.filter(order => order.id != req.params.id);
        saveOrders(filteredOrders);
        res.json({ message: 'تم حذف الطلب بنجاح' });
    } catch (err) {
        console.error('Error deleting order:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
