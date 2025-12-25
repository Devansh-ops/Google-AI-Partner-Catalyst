#!/bin/bash

PROJECT_ID="leetcode-mentor-482308"
REGION="us-central1"

echo "Building and deploying services..."

# Build and push API Gateway
echo "Building API Gateway..."
cd ../../
docker build -t gcr.io/$PROJECT_ID/leetcode-mentor-api-gateway:latest -f services/api-gateway/Dockerfile .
docker push gcr.io/$PROJECT_ID/leetcode-mentor-api-gateway:latest

# Build and push Hint Generator
echo "Building Hint Generator..."
docker build -t gcr.io/$PROJECT_ID/leetcode-mentor-hint-generator:latest -f services/hint-generator/normal-pool/Dockerfile .
docker push gcr.io/$PROJECT_ID/leetcode-mentor-hint-generator:latest

# Deploy to Kubernetes
echo "Deploying to Kubernetes..."
kubectl apply -f deployment/kubernetes/secrets.yaml
kubectl apply -f deployment/kubernetes/api-gateway/
kubectl apply -f deployment/kubernetes/hint-generator/

echo "Deployment complete!"
echo ""
echo "Check status with:"
echo "kubectl get pods"
echo "kubectl get services"