#!/bin/bash

# Deployment script for HK Retail NFT Platform
set -e

# Configuration
NAMESPACE="hk-retail-nft-platform"
ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}

echo "🚀 Deploying HK Retail NFT Platform to $ENVIRONMENT environment..."

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Error: Environment must be 'staging' or 'production'"
    exit 1
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ Error: kubectl is not installed or not in PATH"
    exit 1
fi

# Check if we're connected to the right cluster
echo "📋 Current kubectl context:"
kubectl config current-context

read -p "Is this the correct cluster for $ENVIRONMENT? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Create namespace if it doesn't exist
echo "📦 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Apply configurations
echo "⚙️  Applying configurations..."
kubectl apply -f k8s/configmap.yaml

# Apply secrets (make sure they're properly configured)
echo "🔐 Applying secrets..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    kubectl apply -f k8s/secrets-prod.yaml 2>/dev/null || {
        echo "⚠️  Production secrets not found. Please configure k8s/secrets-prod.yaml"
        exit 1
    }
else
    kubectl apply -f k8s/secrets.yaml
fi

# Update deployment with new image
echo "🔄 Updating deployment with image tag: $IMAGE_TAG..."
kubectl set image deployment/hk-retail-nft-api api=ghcr.io/your-org/hk-retail-nft-platform:$IMAGE_TAG -n $NAMESPACE

# Apply all Kubernetes resources
echo "📋 Applying Kubernetes resources..."
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/hk-retail-nft-api -n $NAMESPACE --timeout=300s

# Verify deployment
echo "✅ Verifying deployment..."
kubectl get pods -n $NAMESPACE -l app=hk-retail-nft-api

# Run health check
echo "🏥 Running health check..."
sleep 10
if kubectl exec -n $NAMESPACE deployment/hk-retail-nft-api -- curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    kubectl logs -n $NAMESPACE deployment/hk-retail-nft-api --tail=50
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "📊 Deployment status:"
kubectl get deployment hk-retail-nft-api -n $NAMESPACE
echo "🌐 Service status:"
kubectl get service hk-retail-nft-api-service -n $NAMESPACE
echo "🔗 Ingress status:"
kubectl get ingress hk-retail-nft-ingress -n $NAMESPACE