const indexes = {
  users: [{ key: { email: 1 }, unique: true }],
  refreshtokens: [
    { key: { tokenHash: 1 }, unique: true },
    { key: { userId: 1 } },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ],
  customers: [{ key: { externalId: 1 }, unique: true }],
  orders: [{ key: { externalId: 1 }, unique: true }, { key: { customerId: 1, placedAt: -1 } }],
  invoices: [{ key: { externalId: 1 }, unique: true }, { key: { customerId: 1, dueDate: -1 } }],
  tickets: [
    { key: { number: 1 }, unique: true },
    { key: { status: 1, assignee: 1 } },
    { key: { customerId: 1, createdAt: -1 } },
  ],
  ticketmessages: [{ key: { ticketId: 1, createdAt: 1 } }],
  kbcategories: [{ key: { slug: 1 }, unique: true }],
  kbarticles: [{ key: { slug: 1 }, unique: true }],
  auditlogs: [{ key: { entity: 1, entityId: 1 } }],
};

module.exports = {
  async up(db) {
    for (const [collection, specs] of Object.entries(indexes)) {
      await db.collection(collection).createIndexes(specs);
    }
  },

  async down(db) {
    for (const [collection, specs] of Object.entries(indexes)) {
      for (const spec of specs) {
        await db.collection(collection).dropIndex(spec.key).catch(() => {});
      }
    }
  },
};
