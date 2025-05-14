const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// إعداد `multer` لتحميل الصور إلى مجلد "uploads"
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads'));  // مجلد "uploads"
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));  // اسم الملف سيكون الوقت الحالي مع امتداد الملف
    }
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const ORDERS_FILE_PATH = path.join(__dirname, 'orders.json');
const PRODUCTS_FILE_PATH = path.join(__dirname, 'products.json');

if (!fs.existsSync(ORDERS_FILE_PATH)) {
    fs.writeFileSync(ORDERS_FILE_PATH, '[]', 'utf8');
}

if (!fs.existsSync(PRODUCTS_FILE_PATH)) {
    fs.writeFileSync(PRODUCTS_FILE_PATH, '[]', 'utf8');
}

function loadData(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveData(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// مسارات الطلبات (orders)
app.post('/orders', (req, res) => {
    try {
        const orders = loadData(ORDERS_FILE_PATH);
        const newOrder = { id: Date.now(), ...req.body };
        orders.push(newOrder);
        saveData(ORDERS_FILE_PATH, orders);
        res.status(201).json({ message: 'Order saved' });
    } catch (err) {
        console.error('Error saving order:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/orders', (req, res) => {
    try {
        const orders = loadData(ORDERS_FILE_PATH);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/orders/:id', (req, res) => {
    try {
        const orders = loadData(ORDERS_FILE_PATH);
        const filteredOrders = orders.filter(order => order.id != req.params.id);
        saveData(ORDERS_FILE_PATH, filteredOrders);
        res.json({ message: 'تم حذف الطلب بنجاح' });
    } catch (err) {
        console.error('Error deleting order:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// مسارات المنتجات (products)
app.post('/products', upload.array('images', 5), (req, res) => {  // نسمح بتحميل حتى 5 صور
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No images uploaded' });
    }
    try {
        const products = loadData(PRODUCTS_FILE_PATH);
        const imageUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];  // أخذ روابط الصور المحملة

        const newProduct = {
            id: Date.now(),
            name: req.body.name,
            category: req.body.category,
            price: req.body.price,
            Image: imageUrls[0],  // الصورة الرئيسية ستكون أول صورة في المصفوفة
            sizes: req.body.sizes ? JSON.parse(req.body.sizes) : [],
            status: req.body.status,
            gallery: imageUrls  // تخزين كل الصور في الـ gallery
        };

        products.push(newProduct);
        saveData(PRODUCTS_FILE_PATH, products);
        res.status(201).json({ message: 'Product added' });
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
app.post('/products/update/:id', upload.array('images', 5), (req, res) => {
    try {
        const products = loadData(PRODUCTS_FILE_PATH);
        const productId = parseInt(req.params.id);
        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).json({ message: 'المنتج غير موجود' });
        }

        const existingProduct = products[productIndex];

        const imageUrls = req.files.length > 0
            ? req.files.map(file => `/uploads/${file.filename}`)
            : existingProduct.gallery;

        const updatedProduct = {
            ...existingProduct,
            name: req.body.name || existingProduct.name,
            category: req.body.category || existingProduct.category,
            price: req.body.price || existingProduct.price,
            Image: imageUrls[0],  // أول صورة رئيسية
            sizes: req.body.sizes ? JSON.parse(req.body.sizes) : existingProduct.sizes,
            status: req.body.status || existingProduct.status,
            gallery: imageUrls
        };

        products[productIndex] = updatedProduct;
        saveData(PRODUCTS_FILE_PATH, products);

        res.json({ message: 'تم تعديل المنتج بنجاح', product: updatedProduct });

    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/products', (req, res) => {
    try {
        const products = loadData(PRODUCTS_FILE_PATH);
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/products/:id', (req, res) => {
    try {
        const products = loadData(PRODUCTS_FILE_PATH);
        const filteredProducts = products.filter(product => product.id != req.params.id);
        saveData(PRODUCTS_FILE_PATH, filteredProducts);
        res.json({ message: 'تم حذف المنتج بنجاح' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// خادم ثابت لخدمة الصور (في مجلد uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});