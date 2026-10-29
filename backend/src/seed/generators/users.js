const { Types } = require('mongoose');

function generateCustomers(faker, count) {
  return Array.from({ length: count }, (_, i) => {
    const now = new Date();
    return {
      _id: new Types.ObjectId(),
      name: faker.company.name(),
      externalId: `ERP-C-${String(1001 + i)}`,
      email: faker.internet.email({ provider: 'example.com' }).toLowerCase(),
      phone: faker.phone.number({ style: 'national' }),
      address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state({ abbreviated: true })} ${faker.location.zipCode()}`,
      createdAt: now,
      updatedAt: now,
    };
  });
}

function generateUsers(faker, customers, passwordHash) {
  const now = new Date();
  const base = (email, name, role, customerId) => ({
    _id: new Types.ObjectId(),
    email,
    name,
    role,
    ...(customerId && { customerId }),
    passwordHash,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  const users = [base('admin@demo.local', 'Alex Admin', 'admin')];
  for (let i = 1; i <= 3; i++) users.push(base(`agent${i}@demo.local`, faker.person.fullName(), 'agent'));

  let n = 1;
  for (const customer of customers) {
    for (let j = 0; j < 2; j++) {
      users.push(base(`customer${n}@demo.local`, faker.person.fullName(), 'customer', customer._id));
      n++;
    }
  }
  return users;
}

module.exports = { generateCustomers, generateUsers };
