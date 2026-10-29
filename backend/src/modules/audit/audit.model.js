const mongoose = require('mongoose');
const logger = require('../../config/logger');

const auditSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditSchema.index({ entity: 1, entityId: 1 });

const AuditLog = mongoose.model('AuditLog', auditSchema);

async function audit(actorId, action, entity, entityId, meta) {
  try {
    await AuditLog.create({ actorId, action, entity, entityId, meta });
  } catch (err) {
    logger.error({ err }, 'Failed to write audit log');
  }
}

module.exports = { AuditLog, audit };
