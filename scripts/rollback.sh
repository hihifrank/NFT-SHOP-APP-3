#!/bin/bash

# Rollback script for HK Retail NFT Platform
set -e

NAMESPACE="hk-retail-nft-platform"
DEPLOYMENT_NAME="hk-retail-nft-api"

echo "🔄 Rolling back HK Retail NFT Platform deployment..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ Error: kubectl is not installed or not in PATH"
    exit 1
fi

# Show current rollout history
echo "📋 Current rollout history:"
kubectl rollout history deployment/$DEPLOYMENT_NAME -n $NAMESPACE

# Get the previous revision
PREVIOUS_REVISION=$(kubectl rollout history deployment/$DEPLOYMENT_NAME -n $NAMESPACE --revision=0 | tail -2 | head -1 | awk '{print $1}')

if [[ -z "$PREVIOUS_REVISION" ]]; then
    echo "❌ Error: No previous revision found"
    exit 1
fi

echo "🔄 Rolling back to revision $PREVIOUS_REVISION..."

# Perform rollback
kubectl rollout undo deployment/$DEPLOYMENT_NAME -n $NAMESPACE

# Wait for rollback to complete
echo "⏳ Waiting for rollback to complete..."
kubectl rollout status deployment/$DEPLOYMENT_NAME -n $NAMESPACE --timeout=300s

# Verify rollback
echo "✅ Verifying rollback..."
kubectl get pods -n $NAMESPACE -l app=hk-retail-nft-api

# Run health check
echo "🏥 Running health check..."
sleep 10
if kubectl exec -n $NAMESPACE deployment/$DEPLOYMENT_NAME -- curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Health check passed after rollback"
else
    echo "❌ Health check failed after rollback"
    kubectl logs -n $NAMESPACE deployment/$DEPLOYMENT_NAME --tail=50
    exit 1
fi

echo "🎉 Rollback completed successfully!"