const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
  },
  { timestamps: true },
);

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    body: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'KbCategory', required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    helpful: { type: Number, default: 0 },
    notHelpful: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
);

articleSchema.index({ title: 'text', body: 'text' }, { weights: { title: 5, body: 1 }, name: 'kb_text' });

module.exports = {
  KbCategory: mongoose.model('KbCategory', categorySchema),
  KbArticle: mongoose.model('KbArticle', articleSchema),
};
