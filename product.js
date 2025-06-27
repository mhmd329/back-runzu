const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  Image: String,
  sizes: [String],
  status: String,
  gallery: [String]
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
