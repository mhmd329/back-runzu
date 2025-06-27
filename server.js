const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");

const Product = require("./product");
const Order = require("./order");

const app = express();
const PORT = process.env.PORT || 3001;

mongoose.connect("mongodb+srv://mhmdkhaled092:VbprwGWAxbbgOLia@cluster0.8koea0u.mongodb.net/shopDB?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ Error:", err));

app.use(cors());
app.use(express.json());

// إعداد الصور
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/// ✅ منتجات

app.post('/products', upload.array('images', 5), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No images uploaded' });
  }
  try {
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    const newProduct = new Product({
    
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      Image: imageUrls[0],
      sizes: req.body.sizes ? JSON.parse(req.body.sizes) : [],
      status: req.body.status,
      gallery: imageUrls
    });
    await newProduct.save();
    res.status(201).json({ message: '✅ Product added', product: newProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '❌ Server error' });
  }
});

app.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error' });
  }
});

app.post('/products/update/:id', upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "❌ المنتج غير موجود" });

    const imageUrls = req.files.length > 0
      ? req.files.map(file => `/uploads/${file.filename}`)
      : product.gallery;

    product.name = req.body.name || product.name;
    product.category = req.body.category || product.category;
    product.price = req.body.price || product.price;
    product.status = req.body.status || product.status;
    product.sizes = req.body.sizes ? JSON.parse(req.body.sizes) : product.sizes;
    product.Image = imageUrls[0];
    product.gallery = imageUrls;

    await product.save();
    res.json({ message: "✅ تم تعديل المنتج", product });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error' });
  }
});
app.delete('/products/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: '❌ المنتج غير موجود' });
    res.json({ message: '✅ تم حذف المنتج' });
  } catch (err) {
    console.error(err); // عشان تعرف تفاصيل الخطأ
    res.status(500).json({ message: '❌ Server error' });
  }
});

/// ✅ الطلبات

app.post('/orders', async (req, res) => {
  try {
    const newOrder = new Order({
      customer: {
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address
      },
      items: req.body.products, // تأكد أن هذا يتطابق مع هيكل items في الموديل
      totalAmount: req.body.total,
      status: "pending",
      date: new Date()
    });
    
    await newOrder.save();
    res.status(201).json({ message: '✅ Order saved', order: newOrder });
  } catch (err) {
    console.error('Error saving order:', err);
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
});

app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    
    // تحويل البيانات لتكون متوافقة مع ما يتوقعه الفرونت-إند
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      customer: {
        name: order.customer?.name || order.name || 'غير معروف',
        phone: order.customer?.phone || order.phone || 'غير متوفر',
        address: order.customer?.address || order.address || 'غير متوفر'
      },
      items: order.items || order.products || [],
      totalAmount: order.totalAmount || order.total || 0,
      date: order.date?.toLocaleDateString() || new Date().toLocaleDateString(),
      status: order.status || 'pending'
    }));
    
    res.json(formattedOrders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
});

app.delete('/orders/:id', async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ 
        message: '❌ الطلب غير موجود',
        success: false
      });
    }
    res.json({ 
      message: '✅ تم حذف الطلب',
      success: true,
      deletedId: req.params.id
    });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ 
      message: '❌ Server error',
      error: err.message 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
