const mongoose = require('mongoose')
const orderSchema = new mongoose.Schema({
  // الحقول القديمة للتوافق مع الطلبات السابقة
  name: String,
  phone: String,
  address: String,
  products: Array,
  total: Number,
  
  // الحقول الجديدة
  customer: {
    name: String,
    phone: String,
    address: String
  },
  items: [{
    name: String,
    selectedSize: String,
    quantity: Number,
    price: Number,
    Image: String
  }],
  totalAmount: Number,
  status: {
    type: String,
    default: "pending"
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { strict: false }); // strict: false تسمح بحفظ حقول غير محددة في الموديل
module.exports = mongoose.model('Order', orderSchema);
