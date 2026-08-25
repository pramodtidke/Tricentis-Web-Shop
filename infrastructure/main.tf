terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# --------------------------------------------------------------------------
# OFFLINE / DUMMY PROVIDER CONFIG
# This block deliberately never calls AWS. It uses fake static credentials
# and tells the provider to skip every validation step that would normally
# require a real network call to AWS APIs. This lets `terraform plan` build
# and print the full dependency graph with zero AWS account required.
#
# DO NOT use this provider block against a real AWS account — it is for
# local syntax/dependency-graph validation only.
# --------------------------------------------------------------------------
provider "aws" {
  region = "us-east-1"

  access_key = "mock_access_key"
  secret_key = "mock_secret_key"

  # Stops Terraform from calling STS to verify the credentials are real
  skip_credentials_validation = true

  # Stops Terraform from calling STS GetCallerIdentity to resolve the account ID
  skip_requesting_account_id = true

  # Stops Terraform from trying to reach the EC2 instance metadata service
  # (relevant if this is ever run inside an EC2 instance / CI runner)
  skip_metadata_api_check = true

  # Stops Terraform from validating that "us-east-1" is a real/known region
  skip_region_validation = true
}
