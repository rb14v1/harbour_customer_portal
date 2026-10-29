terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.110"
    }
  }
}

provider "azurerm" {
  features {}
}

# ---------------------------------------------------------------------------
# Resource group
# ---------------------------------------------------------------------------
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.primary_location
}

# ---------------------------------------------------------------------------
# Cosmos DB account (MongoDB API)
# Continuous backup – Continuous30Days tier (720 h / 30 days)
# Geo-redundant failover replica in a secondary region
# ---------------------------------------------------------------------------
resource "azurerm_cosmosdb_account" "main" {
  name                = var.cosmosdb_account_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  offer_type          = "Standard"
  kind                = "MongoDB"

  mongo_server_version = "6.0"

  # Enforce HTTPS / TLS only
  is_virtual_network_filter_enabled = false
  enable_automatic_failover         = true

  capabilities {
    name = "EnableMongo"
  }

  # Primary region
  geo_location {
    location          = var.primary_location
    failover_priority = 0
    zone_redundant    = true
  }

  # Secondary region – backup replica stored here (cross-region)
  geo_location {
    location          = var.secondary_location
    failover_priority = 1
    zone_redundant    = false
  }

  consistency_policy {
    consistency_level       = "Session"
    max_interval_in_seconds = 5
    max_staleness_prefix    = 100
  }

  # Continuous backup with 30-day (720 h) retention and geo-redundant storage
  backup {
    type = "Continuous"
    tier = "Continuous30Days"
  }

  tags = var.tags
}

# ---------------------------------------------------------------------------
# MongoDB database
# ---------------------------------------------------------------------------
resource "azurerm_cosmosdb_mongo_database" "app" {
  name                = var.mongodb_database_name
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
}
