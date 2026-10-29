// Customers only ever see their own company's records.
function scopeFilter(user, filter = {}) {
  return user.role === 'customer' ? { ...filter, customerId: user.customerId } : filter;
}

module.exports = { scopeFilter };
