# Runbook: Database Point-in-Time Restore

**App:** harbour-customer-port-txv  
**Database:** Azure Cosmos DB for MongoDB  
**Backup type:** Continuous (30-day / 720 h retention)  
**Last restore test date:** _(update after each test)_

---

## Overview

Azure Cosmos DB Continuous backup automatically captures every write so that any moment within the 30-day retention window can be restored. Backups are stored geo-redundantly in the **secondary region** configured in Terraform (`var.secondary_location`), which is separate from the primary database region (`var.primary_location`).

Continuous backup with the `Continuous30Days` tier provides:
- **Recovery Point Objective (RPO):** < 1 minute  
- **Recovery Time Objective (RTO):** typically 1–3 hours depending on database size

---

## Prerequisites

| Requirement | Detail |
|---|---|
| Azure CLI | `>= 2.55` (`az --version`) |
| Permissions | `Cosmos DB Operator` + `Contributor` on the resource group |
| Target resource group | Must exist before restore (can be the same or a new RG) |

---

## 1. Identify the Restore Point

List available continuous backup timestamps for the account:

```bash
az cosmosdb restorable-database-account list \
  --name <cosmosdb_account_name> \
  --query "[].{id:id, oldestRestoreTime:oldestRestorableTimestamp, location:location}"
```

Choose a UTC timestamp in ISO-8601 format, e.g. `2026-10-28T14:30:00Z`.

---

## 2. Restore to a New Account

> **Important:** Continuous-backup restores always create a **new** Cosmos DB account. The original account is unaffected.

```bash
RESTORE_TIMESTAMP="2026-10-28T14:30:00Z"   # Replace with your target time
SOURCE_ACCOUNT="<cosmosdb_account_name>"
TARGET_ACCOUNT="${SOURCE_ACCOUNT}-restored"
RESOURCE_GROUP="<resource_group_name>"
LOCATION="<primary_location>"               # e.g. eastus

az cosmosdb restore \
  --account-name          "${SOURCE_ACCOUNT}" \
  --target-database-account-name "${TARGET_ACCOUNT}" \
  --restore-timestamp     "${RESTORE_TIMESTAMP}" \
  --location              "${LOCATION}" \
  --resource-group        "${RESOURCE_GROUP}"
```

The command returns immediately; the restore runs asynchronously. Monitor progress:

```bash
az cosmosdb show \
  --name "${TARGET_ACCOUNT}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "restoreParameters.restoreTimestampInUtc"
```

Wait until `provisioningState` shows `Succeeded`:

```bash
az cosmosdb show \
  --name "${TARGET_ACCOUNT}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "provisioningState" -o tsv
```

---

## 3. Validate Restored Data

Connect to the restored account and verify data integrity:

```bash
# Retrieve connection string from the restored account
CONN_STR=$(az cosmosdb keys list \
  --name "${TARGET_ACCOUNT}" \
  --resource-group "${RESOURCE_GROUP}" \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" -o tsv)

# Spot-check document counts in the app database
mongosh "${CONN_STR}" --eval "
  use customer_portal;
  printjson({
    customers: db.customers.countDocuments(),
    orders:    db.orders.countDocuments(),
    users:     db.users.countDocuments()
  });
"
```

Compare counts against known good values or a recent export.

---

## 4. Promote the Restored Account (if performing a full cutover)

1. Update the app's `MONGODB_URI` environment variable / Key Vault secret to point to the **restored account** connection string.
2. Redeploy the application (or trigger a rolling restart) so it picks up the new connection string.
3. Run the application smoke-test suite to confirm full functionality.
4. Delete the original (compromised/corrupt) account only after a soaking period of at least 24 hours.

---

## 5. Post-Restore Checklist

- [ ] Restore completed with `provisioningState = Succeeded`
- [ ] Document counts match expected values
- [ ] Application smoke tests pass against the restored account
- [ ] Incident ticket updated with restore timestamp, RTO achieved, and data loss window (RPO)
- [ ] New account's backup continuity confirmed (Continuous30Days active on restored account)
- [ ] Update **Last restore test date** at the top of this runbook

---

## Terraform Re-apply After Cutover

After promoting the restored account, re-apply Terraform so that IaC state tracks the new account:

```bash
cd infra/
terraform import azurerm_cosmosdb_account.main \
  /subscriptions/<subscription_id>/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.DocumentDB/databaseAccounts/${TARGET_ACCOUNT}
terraform apply
```

---

## References

- [Azure Cosmos DB continuous backup documentation](https://learn.microsoft.com/azure/cosmos-db/continuous-backup-restore-introduction)
- [az cosmosdb restore CLI reference](https://learn.microsoft.com/cli/azure/cosmosdb#az-cosmosdb-restore)
- [Terraform azurerm_cosmosdb_account backup block](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/cosmosdb_account#backup)
