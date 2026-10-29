const COUNTERS = ['ticketNumber', 'orderNumber', 'invoiceNumber'];

module.exports = {
  async up(db) {
    for (const name of COUNTERS) {
      await db.collection('counters').updateOne({ _id: name }, { $setOnInsert: { seq: 0 } }, { upsert: true });
    }
  },

  async down(db) {
    await db.collection('counters').deleteMany({ _id: { $in: COUNTERS } });
  },
};
