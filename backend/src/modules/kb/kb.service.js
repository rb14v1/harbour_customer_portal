const AppError = require('../../utils/AppError');
const { audit } = require('../audit/audit.model');
const { KbCategory, KbArticle } = require('./kb.model');

const isStaff = (user) => user.role === 'agent' || user.role === 'admin';

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

async function uniqueSlug(title, excludeId) {
  const base = slugify(title) || 'article';
  let slug = base;
  for (let i = 2; await KbArticle.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) }); i++) slug = `${base}-${i}`;
  return slug;
}

const listCategories = () => KbCategory.find().sort({ name: 1 }).lean();

async function listArticles(user, { page, limit, q, category, status }) {
  const filter = {};
  filter.status = isStaff(user) ? status : 'published';
  if (!filter.status) delete filter.status;
  if (category) {
    const cat = await KbCategory.findOne({ slug: category }).lean();
    if (!cat) return { data: [], page, limit, total: 0 };
    filter.categoryId = cat._id;
  }

  let query;
  let sort;
  if (q) {
    filter.$text = { $search: q };
    sort = { score: { $meta: 'textScore' } };
    query = KbArticle.find(filter, { score: { $meta: 'textScore' } });
  } else {
    sort = { helpful: -1, updatedAt: -1 };
    query = KbArticle.find(filter);
  }

  const [data, total] = await Promise.all([
    query.sort(sort).skip((page - 1) * limit).limit(limit).select('-body').populate('categoryId', 'name slug').lean(),
    KbArticle.countDocuments(filter),
  ]);
  return { data, page, limit, total };
}

async function getBySlug(user, slug) {
  const filter = { slug };
  if (!isStaff(user)) filter.status = 'published';
  const article = await KbArticle.findOneAndUpdate(filter, { $inc: { views: 1 } }, { new: true })
    .populate('categoryId', 'name slug')
    .populate('authorId', 'name')
    .lean();
  if (!article) throw new AppError(404, 'Article not found');
  return article;
}

async function vote(id, helpful) {
  const article = await KbArticle.findOneAndUpdate(
    { _id: id, status: 'published' },
    { $inc: helpful ? { helpful: 1 } : { notHelpful: 1 } },
    { new: true },
  ).lean();
  if (!article) throw new AppError(404, 'Article not found');
  return { helpful: article.helpful, notHelpful: article.notHelpful };
}

async function ensureCategory(categoryId) {
  if (categoryId && !(await KbCategory.exists({ _id: categoryId }))) throw new AppError(400, 'Category not found');
}

async function create(user, data) {
  await ensureCategory(data.categoryId);
  const article = await KbArticle.create({ ...data, slug: await uniqueSlug(data.title), authorId: user.id });
  await audit(user.id, 'kb.create', 'kbarticle', article._id, { title: article.title });
  return article.toObject();
}

async function update(user, id, changes) {
  await ensureCategory(changes.categoryId);
  const article = await KbArticle.findById(id);
  if (!article) throw new AppError(404, 'Article not found');
  if (changes.title && changes.title !== article.title) article.slug = await uniqueSlug(changes.title, article._id);
  Object.assign(article, changes);
  await article.save();
  await audit(user.id, 'kb.update', 'kbarticle', article._id, changes);
  return article.toObject();
}

async function remove(user, id) {
  const article = await KbArticle.findByIdAndDelete(id);
  if (!article) throw new AppError(404, 'Article not found');
  await audit(user.id, 'kb.delete', 'kbarticle', article._id, { title: article.title });
}

module.exports = { listCategories, listArticles, getBySlug, vote, create, update, remove, slugify };
