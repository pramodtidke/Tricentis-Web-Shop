# --------------------------------------------------------------------------
# VPC & NETWORKING
# Single VPC spanning two Availability Zones for high availability.
# Public subnets  -> NAT gateways, load balancers, bastion (if any)
# Private subnets -> EKS nodes, RDS, ElastiCache (never internet-routable)
# --------------------------------------------------------------------------

locals {
  az_count = 2
  azs      = ["us-east-1a", "us-east-1b"]

  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name    = "shopwave-vpc"
    Project = "ShopWave"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "shopwave-igw"
  }
}

# ---------------------- Public subnets (one per AZ) -----------------------
resource "aws_subnet" "public" {
  count                   = local.az_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "shopwave-public-${local.azs[count.index]}"
    Tier = "public"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "shopwave-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = local.az_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# --------------------- Private subnets (one per AZ) ------------------------
resource "aws_subnet" "private" {
  count             = local.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = {
    Name = "shopwave-private-${local.azs[count.index]}"
    Tier = "private"
  }
}

# --------- NAT Gateway per AZ, so private subnets can reach the internet ---
# (e.g. EKS nodes pulling images, RDS/ElastiCache patching) without being
# publicly reachable themselves.
resource "aws_eip" "nat" {
  count  = local.az_count
  domain = "vpc"

  tags = {
    Name = "shopwave-nat-eip-${local.azs[count.index]}"
  }
}

resource "aws_nat_gateway" "main" {
  count         = local.az_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "shopwave-nat-${local.azs[count.index]}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "private" {
  count  = local.az_count
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "shopwave-private-rt-${local.azs[count.index]}"
  }
}

resource "aws_route_table_association" "private" {
  count          = local.az_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
