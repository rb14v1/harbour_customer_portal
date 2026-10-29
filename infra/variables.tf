variable "resource_group_name" {
  description = "Name of the Azure resource group."
  type        = string
}

variable "primary_location" {
  description = "Azure region for the primary Cosmos DB replica (e.g. 'eastus')."
  type        = string
  default     = "eastus"
}

variable "secondary_location" {
  description = "Azure region for the secondary (cross-region) Cosmos DB replica used for backup storage (e.g. 'westus2')."
  type        = string
  default     = "westus2"
}

variable "cosmosdb_account_name" {
  description = "Globally unique name for the Cosmos DB account."
  type        = string
}

variable "mongodb_database_name" {
  description = "Name of the MongoDB database inside the Cosmos DB account."
  type        = string
  default     = "customer_portal"
}

variable "tags" {
  description = "Resource tags applied to all managed resources."
  type        = map(string)
  default = {
    environment = "production"
    app         = "harbour-customer-port-txv"
    managed_by  = "terraform"
  }
}
