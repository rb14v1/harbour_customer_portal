const { Types } = require('mongoose');
const { kbCategories, kbArticles } = require('../data/catalog');
const { slugify } = require('../../modules/kb/kb.service');

function articleBody(faker, title) {
  const steps = Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, (_, i) => `${i + 1}. ${faker.lorem.sentence()}`);
  return [
    `## Overview`,
    `This article explains: **${title.toLowerCase()}**. ${faker.lorem.paragraph()}`,
    `## Steps`,
    steps.join('\n'),
    `## Still need help?`,
    `If these steps did not solve your issue, open a support ticket from the **Tickets** page and include any error messages you see.`,
  ].join('\n\n');
}

function generateKb(faker, staff) {
  const now = new Date();
  const categories = kbCategories.map((c) => ({ _id: new Types.ObjectId(), ...c, createdAt: now, updatedAt: now }));
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c._id]));

  const articles = kbArticles.map(([categorySlug, title], i) => {
    const updatedAt = new Date(now.getTime() - faker.number.int({ min: 1, max: 180 }) * 24 * 60 * 60 * 1000);
    return {
      _id: new Types.ObjectId(),
      title,
      slug: slugify(title),
      body: articleBody(faker, title),
      categoryId: bySlug[categorySlug],
      // Every 8th article stays a draft so the editor has something to publish.
      status: i % 8 === 7 ? 'draft' : 'published',
      authorId: faker.helpers.arrayElement(staff)._id,
      helpful: faker.number.int({ min: 0, max: 120 }),
      notHelpful: faker.number.int({ min: 0, max: 15 }),
      views: faker.number.int({ min: 50, max: 2000 }),
      createdAt: updatedAt,
      updatedAt,
    };
  });

  return { categories, articles };
}

module.exports = { generateKb };
