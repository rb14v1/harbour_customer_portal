const objectId = { bsonType: 'objectId' };
const str = { bsonType: 'string' };
const num = { bsonType: ['double', 'int', 'long', 'decimal'] };
const date = { bsonType: 'date' };

const validators = {
  users: {
    required: ['email', 'passwordHash', 'name', 'role'],
    properties: {
      email: str,
      passwordHash: str,
      name: str,
      role: { enum: ['customer', 'agent', 'admin'] },
      customerId: objectId,
      isActive: { bsonType: 'bool' },
    },
  },
  refreshtokens: {
    required: ['userId', 'tokenHash', 'expiresAt'],
    properties: { userId: objectId, tokenHash: str, expiresAt: date },
  },
  customers: {
    required: ['name', 'externalId'],
    properties: { name: str, externalId: str },
  },
  orders: {
    required: ['externalId', 'number', 'customerId', 'placedAt'],
    properties: {
      externalId: str,
      number: str,
      customerId: objectId,
      status: { enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
      total: num,
      placedAt: date,
    },
  },
  invoices: {
    required: ['externalId', 'number', 'customerId', 'issuedAt', 'dueDate'],
    properties: {
      externalId: str,
      number: str,
      customerId: objectId,
      orderId: objectId,
      status: { enum: ['unpaid', 'paid', 'overdue'] },
      total: num,
      issuedAt: date,
      dueDate: date,
    },
  },
  tickets: {
    required: ['number', 'subject', 'customerId', 'createdBy'],
    properties: {
      number: num,
      subject: str,
      customerId: objectId,
      createdBy: objectId,
      assignee: objectId,
      status: { enum: ['open', 'pending', 'resolved', 'closed'] },
      priority: { enum: ['low', 'medium', 'high', 'urgent'] },
      category: { enum: ['billing', 'orders', 'account', 'technical', 'other'] },
    },
  },
  ticketmessages: {
    required: ['ticketId', 'authorId', 'body'],
    properties: { ticketId: objectId, authorId: objectId, body: str, internal: { bsonType: 'bool' } },
  },
  kbcategories: {
    required: ['name', 'slug'],
    properties: { name: str, slug: str },
  },
  kbarticles: {
    required: ['title', 'slug', 'body', 'categoryId'],
    properties: {
      title: str,
      slug: str,
      body: str,
      categoryId: objectId,
      status: { enum: ['draft', 'published'] },
    },
  },
  counters: { required: ['seq'], properties: { seq: num } },
  auditlogs: {
    required: ['action', 'entity'],
    properties: { action: str, entity: str },
  },
};

module.exports = {
  async up(db) {
    const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
    for (const [name, schema] of Object.entries(validators)) {
      const validator = { $jsonSchema: { bsonType: 'object', ...schema } };
      if (existing.has(name)) {
        await db.command({ collMod: name, validator, validationLevel: 'moderate' });
      } else {
        await db.createCollection(name, { validator, validationLevel: 'moderate' });
      }
    }
  },

  async down(db) {
    const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
    for (const name of Object.keys(validators)) {
      if (existing.has(name)) await db.collection(name).drop();
    }
  },
};
