module.exports = {
  async up(db) {
    await db
      .collection('kbarticles')
      .createIndex({ title: 'text', body: 'text' }, { name: 'kb_text', weights: { title: 5, body: 1 } });
  },

  async down(db) {
    await db.collection('kbarticles').dropIndex('kb_text').catch(() => {});
  },
};
