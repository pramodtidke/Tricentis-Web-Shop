# infrastructure/eks.tf
# Day 20 — EKS cluster + managed node group.
# Placed in the private subnets created in vpc.tf (aws_subnet.private[*]),
# reusing the same VPC as the RDS/ElastiCache resources from data.tf.

# ---------------------------------------------------------------------------
# SECURITY GROUP — cluster control plane <-> node communication
# ---------------------------------------------------------------------------

resource "aws_security_group" "eks_cluster" {
  name        = "shopwave-eks-cluster-sg"
  description = "Controls access to the EKS control plane"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "shopwave-eks-cluster-sg"
    Project = "shopwave"
  }
}

# ---------------------------------------------------------------------------
# EKS CLUSTER
# ---------------------------------------------------------------------------

resource "aws_eks_cluster" "shopwave" {
  name     = "shopwave-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.30"

  vpc_config {
    # Private subnets only — matches our data-tier isolation pattern from
    # Day 19 (RDS/Redis also live here, not in the public subnets).
    subnet_ids              = aws_subnet.private[*].id
    security_group_ids      = [aws_security_group.eks_cluster.id]
    endpoint_private_access = true
    endpoint_public_access  = true          # kept true so kubectl works from a local machine without a bastion/VPN
    public_access_cidrs     = ["0.0.0.0/0"] # TODO(follow-up): restrict to office/VPN CIDR before go-live
  }

  # Ensures IAM role + policy attachments exist before the cluster tries to use them.
  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]

  tags = {
    Project = "shopwave"
    Env     = "dev"
  }
}

# ---------------------------------------------------------------------------
# EKS MANAGED NODE GROUP
# ---------------------------------------------------------------------------

resource "aws_eks_node_group" "shopwave_general" {
  cluster_name    = aws_eks_cluster.shopwave.name
  node_group_name = "shopwave-general-ng"
  node_role_arn   = aws_iam_role.eks_node.arn

  # Worker nodes live in the private subnets — same isolation reasoning as
  # the cluster control plane above and RDS/Redis in data.tf.
  subnet_ids = aws_subnet.private[*].id

  instance_types = ["t3.medium"]
  capacity_type  = "ON_DEMAND"

  scaling_config {
    desired_size = 2 # per Day 20 requirement
    min_size     = 1
    max_size     = 3 # small headroom for rolling deploys; adjust once real load data exists
  }

  update_config {
    max_unavailable = 1
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_ecr_readonly,
  ]

  tags = {
    Project = "shopwave"
    Env     = "dev"
  }
}

# ---------------------------------------------------------------------------
# OUTPUTS — for kubeconfig setup once a real AWS account/apply exists
# ---------------------------------------------------------------------------

output "eks_cluster_name" {
  value = aws_eks_cluster.shopwave.name
}

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.shopwave.endpoint
}

output "eks_cluster_certificate_authority" {
  value     = aws_eks_cluster.shopwave.certificate_authority[0].data
  sensitive = true
}
