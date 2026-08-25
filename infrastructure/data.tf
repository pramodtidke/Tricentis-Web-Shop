# --------------------------------------------------------------------------
# MANAGED DATABASES & STORAGE
# Per the System Design Doc (Section 5 / 13): Postgres backs User, Order,
# Payment, and Inventory; Redis backs Cart/Auth sessions; S3 backs the
# File/Media service's product images.
# --------------------------------------------------------------------------

# ============================== RDS (PostgreSQL) ===========================

resource "aws_db_subnet_group" "postgres" {
  name       = "shopwave-postgres-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "shopwave-postgres-subnet-group"
  }
}

resource "aws_security_group" "rds" {
  name        = "shopwave-rds-sg"
  description = "Allow Postgres traffic from within the VPC only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Postgres from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "shopwave-rds-sg"
  }
}

resource "aws_db_instance" "postgres" {
  identifier     = "shopwave-postgres"
  engine         = "postgres"
  engine_version = "16.3"
  instance_class = "db.t3.medium"

  allocated_storage     = 50
  max_allocated_storage = 200
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "shopwave"
  username = "shopwave_admin"
  # NOTE: For real deployment, replace with a Secrets Manager reference
  # (aws_secretsmanager_secret_version) instead of a plaintext password.
  password = "REPLACE_ME_WITH_SECRETS_MANAGER_ARN"

  # Multi-AZ per Section 13 of the System Design Doc, for 99.99% availability
  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 7
  skip_final_snapshot     = true # set false before real production use

  tags = {
    Name    = "shopwave-postgres"
    Project = "ShopWave"
  }
}

# ============================ ElastiCache (Redis) ===========================

resource "aws_elasticache_subnet_group" "redis" {
  name       = "shopwave-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "redis" {
  name        = "shopwave-redis-sg"
  description = "Allow Redis traffic from within the VPC only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Redis from VPC"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "shopwave-redis-sg"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "shopwave-redis"
  description          = "Redis for Cart and Auth sessions"

  engine         = "redis"
  engine_version = "7.1"
  node_type      = "cache.t3.medium"
  port           = 6379

  num_cache_clusters = local.az_count # one node per AZ for HA

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  automatic_failover_enabled = true

  tags = {
    Name    = "shopwave-redis"
    Project = "ShopWave"
  }
}

# ================================ S3 (Media) ================================

resource "aws_s3_bucket" "product_images" {
  bucket = "shopwave-product-images"

  tags = {
    Name    = "shopwave-product-images"
    Project = "ShopWave"
    Service = "file-service"
  }
}

resource "aws_s3_bucket_versioning" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
