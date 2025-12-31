# Kubernetes Manifests

This directory contains Kubernetes deployment manifests for all LeetCode Mentor services.

## Files

| File | Description | Replicas | Service Type |
|------|-------------|----------|--------------|
| `api-gateway.yaml` | WebSocket API Gateway | 2 | LoadBalancer |
| `pattern-processor.yaml` | Event pattern detection | 2 | ClusterIP |
| `hint-generator.yaml` | AI hint generation (Kafka + HTTP) | 2 | ClusterIP |
| `chat-service.yaml` | Chat service backend | 2 | LoadBalancer |
| `vertex-chat.yaml` | LangGraph agent service | 2 | LoadBalancer |

## Resource Limits

### API Gateway
- **Requests**: 256Mi RAM, 250m CPU
- **Limits**: 512Mi RAM, 500m CPU

### Pattern Processor
- **Requests**: 256Mi RAM, 250m CPU
- **Limits**: 512Mi RAM, 500m CPU

### Hint Generator
- **Requests**: 512Mi RAM, 500m CPU
- **Limits**: 1Gi RAM, 1000m CPU

### Chat Service
- **Requests**: 512Mi RAM, 500m CPU
- **Limits**: 1Gi RAM, 1000m CPU

### Vertex Chat
- **Requests**: 512Mi RAM, 500m CPU
- **Limits**: 1Gi RAM, 1000m CPU

## Secrets Required

All manifests reference these secrets:

### `vertex-ai-key`
```bash
kubectl create secret generic vertex-ai-key \
    --from-file=key.json=./vertex-ai-key.json \
    --namespace=leetcode-mentor
```

### `kafka-credentials`
```bash
kubectl create secret generic kafka-credentials \
    --from-literal=KAFKA_BOOTSTRAP_SERVERS='your-server' \
    --from-literal=KAFKA_API_KEY='your-key' \
    --from-literal=KAFKA_API_SECRET='your-secret' \
    --namespace=leetcode-mentor
```

## ConfigMaps Required

### `app-config`
```bash
kubectl create configmap app-config \
    --from-literal=GOOGLE_CLOUD_PROJECT='leetcode-mentor-482308' \
    --from-literal=VERTEX_AI_LOCATION='us-central1' \
    --from-literal=VERTEX_AI_MODEL='gemini-1.5-flash' \
    --from-literal=PORT='8000' \
    --from-literal=HOST='0.0.0.0' \
    --from-literal=HINT_GENERATOR_URL='http://hint-generator:8080' \
    --namespace=leetcode-mentor
```

## Deployment

### Deploy All Services
```bash
kubectl apply -f . -n leetcode-mentor
```

### Deploy Individual Service
```bash
kubectl apply -f api-gateway.yaml -n leetcode-mentor
```

### Check Status
```bash
kubectl get deployments -n leetcode-mentor
kubectl get pods -n leetcode-mentor
kubectl get services -n leetcode-mentor
```

## Health Checks

### API Gateway
- **Liveness**: `GET /health` on port 8000
- **Readiness**: `GET /health` on port 8000

### Hint Generator
- **Liveness**: `GET /health` on port 8080
- **Readiness**: `GET /health` on port 8080

## Service Communication

```
api-gateway (LoadBalancer)
    ↓
    → pattern-processor (ClusterIP)
    → hint-generator (ClusterIP)
           ↓
        Kafka (External)
           ↓
    hints.responses topic
           ↓
    api-gateway (consumes)
```

## Autoscaling

To enable horizontal pod autoscaling:

```bash
kubectl autoscale deployment api-gateway \
    --min=2 --max=10 \
    --cpu-percent=70 \
    -n leetcode-mentor
```

## Update Deployment

```bash
# Update image
kubectl set image deployment/api-gateway \
    api-gateway=ghcr.io/devansh-ops/leetcode-mentor-api-gateway:new-tag \
    -n leetcode-mentor

# Check rollout
kubectl rollout status deployment/api-gateway -n leetcode-mentor

# Rollback if needed
kubectl rollout undo deployment/api-gateway -n leetcode-mentor
```

## Monitoring

```bash
# View logs
kubectl logs -f deployment/api-gateway -n leetcode-mentor

# Describe deployment
kubectl describe deployment api-gateway -n leetcode-mentor

# Get events
kubectl get events -n leetcode-mentor --sort-by='.lastTimestamp'
```