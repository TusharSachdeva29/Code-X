#!/bin/bash

# V-Code AKS Deployment Script
# Run from: deployment/v-code-deployment/

set -e

echo "🚀 V-Code AKS Deployment"
echo "========================"

# Step 1: Deploy PostgreSQL
echo ""
echo "📦 Step 1: Deploying PostgreSQL..."
kubectl apply -f postgres-deployment.yml
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres --timeout=180s || echo "⚠️ PostgreSQL still starting..."

# Step 2: Deploy secrets and configmap
echo ""
echo "🔐 Step 2: Deploying Secrets & ConfigMap..."
kubectl apply -f v-code-secret.yml
kubectl apply -f v-code-configmap.yml

# Step 3: Deploy V-Code backend
echo ""
echo "🖥️ Step 3: Deploying V-Code Backend..."
kubectl apply -f v-code-deployment.yml
kubectl apply -f v-code-service.yml

# Step 4: Deploy nginx config and update nginx
echo ""
echo "🌐 Step 4: Configuring NGINX routing..."
kubectl apply -f nginx-config.yml
kubectl apply -f nginx-deployment.yml

# Step 5: Restart deployments to pick up changes
echo ""
echo "🔄 Step 5: Restarting deployments..."
kubectl rollout restart deployment nginx
kubectl rollout restart deployment v-code-deployment

# Step 6: Show status
echo ""
echo "📊 Deployment Status:"
echo "====================="
kubectl get pods
echo ""
kubectl get services

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌍 Access your application at: http://20.204.187.189"
echo ""
echo "📋 Useful commands:"
echo "  - Check logs: kubectl logs -l app=v-code --tail=50"
echo "  - Check PostgreSQL: kubectl logs -l app=postgres --tail=50"
echo "  - Check nginx: kubectl logs -l app=nginx --tail=50"
