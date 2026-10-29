output "cosmosdb_endpoint" {
  description = "The endpoint used to connect to the Cosmos DB account."
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "cosmosdb_connection_strings" {
  description = "Connection strings for the Cosmos DB account (sensitive)."
  value       = azurerm_cosmosdb_account.main.connection_strings
  sensitive   = true
}

output "mongodb_database_id" {
  description = "Resource ID of the MongoDB database."
  value       = azurerm_cosmosdb_mongo_database.app.id
}
