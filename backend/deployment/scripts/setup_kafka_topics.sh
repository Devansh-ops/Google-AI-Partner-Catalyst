#!/bin/bash

# Setup Confluent Cloud Kafka Topics

echo "Creating Kafka topics..."

# Topic: events.realtime
confluent kafka topic create events.realtime \
  --partitions 3 \
  --config retention.ms=259200000

# Topic: hints.responses
confluent kafka topic create hints.responses \
  --partitions 3 \
  --config retention.ms=259200000

echo "Topics created successfully!"
echo ""
echo "List of topics:"
confluent kafka topic list