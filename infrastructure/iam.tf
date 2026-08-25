# infrastructure/iam.tf
# Day 20 — IAM roles required for EKS cluster control plane + worker node group.
# NOTE: These are resource creations, not data sources, so they plan cleanly
# under the dummy-credential provider (same reasoning as vpc.tf/data.tf —
# see Section 3 of the Day 19 checkpoint: only *data source* lookups make
# live AWS calls during `plan`; resource blocks do not).

# ---------------------------------------------------------------------------
# 1. EKS CLUSTER (control plane) IAM ROLE
# ---------------------------------------------------------------------------

resource "aws_iam_role" "eks_cluster" {
  name = "shopwave-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Project = "shopwave"
    Layer   = "eks-control-plane"
  }
}

# Required managed policy for the EKS control plane to manage
# ENIs, load balancers, and other cluster-owned AWS resources.
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

# ---------------------------------------------------------------------------
# 2. EKS NODE GROUP (worker) IAM ROLE
# ---------------------------------------------------------------------------

resource "aws_iam_role" "eks_node" {
  name = "shopwave-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Project = "shopwave"
    Layer   = "eks-node-group"
  }
}

# Lets worker nodes join the cluster and let the kubelet call EKS APIs.
resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  role       = aws_iam_role.eks_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

# Required for the VPC CNI plugin to assign pod IPs from VPC subnets.
resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  role       = aws_iam_role.eks_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

# Lets nodes pull container images (our microservice images) from ECR.
resource "aws_iam_role_policy_attachment" "eks_ecr_readonly" {
  role       = aws_iam_role.eks_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}
