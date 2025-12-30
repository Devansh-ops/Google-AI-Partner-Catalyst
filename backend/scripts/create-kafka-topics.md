# Creating Kafka Topics for Flink Integration

## Required Topics

You need to create the following new topics in your Confluent Cloud Kafka cluster:

### 1. `hints.requests.normal`
- **Purpose**: Flink produces hint requests here when stuck patterns are detected
- **Consumers**: Hint Generator (normal-pool)
- **Producers**: Flink Pattern Detection Job
- **Partitions**: 3
- **Retention**: 7 days

### 2. `analytics` (optional)
- **Purpose**: Analytics events for monitoring and debugging
- **Consumers**: Future analytics service
- **Producers**: Flink Pattern Detection Job
- **Partitions**: 3
- **Retention**: 30 days

## Creating Topics via Confluent Cloud UI

1. Log in to [Confluent Cloud](https://confluent.cloud)
2. Navigate to your Cluster
3. Go to "Topics" in the left sidebar
4. Click "Create topic"

### For `hints.requests.normal`:
- Topic name: `hints.requests.normal`
- Partitions: 3
- Retention time: 7 days (604800000 ms)
- Other settings: Default

### For `analytics`:
- Topic name: `analytics`
- Partitions: 3
- Retention time: 30 days (2592000000 ms)
- Other settings: Default

## Creating Topics via Confluent CLI

```bash
# Install Confluent CLI if not already installed
# https://docs.confluent.io/confluent-cli/current/install.html

# Login
confluent login

# Set environment and cluster
confluent environment use <env-id>
confluent kafka cluster use <cluster-id>

# Create hints.requests.normal topic
confluent kafka topic create hints.requests.normal \
  --partitions 3 \
  --config retention.ms=604800000

# Create analytics topic
confluent kafka topic create analytics \
  --partitions 3 \
  --config retention.ms=2592000000

# Verify topics
confluent kafka topic list
```

## Existing Topics (No Changes Needed)

These topics already exist and should continue working:

- `events.realtime` - API Gateway → Flink (existing)
- `hints.responses` - Hint Generator → API Gateway (existing)

## Data Flow After Flink Integration

```
Frontend
   ↓
[API Gateway]
   ↓
events.realtime (existing)
   ↓
[Flink Pattern Detection] ← NEW
   ↓
hints.requests.normal (NEW)
   ↓
[Hint Generator]
   ↓
hints.responses (existing)
   ↓
[API Gateway]
   ↓
Frontend
```

## Verification

After creating topics, verify they exist:

```bash
confluent kafka topic list
```

You should see:
- events.realtime
- hints.requests.normal ← NEW
- hints.responses
- analytics ← NEW (optional)
