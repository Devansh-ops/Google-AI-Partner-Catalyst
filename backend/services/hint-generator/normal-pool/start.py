"""
Supervisor script to run both HTTP server and Kafka consumer
"""
import logging
import multiprocessing
import sys
import signal

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def run_http_server():
    """Run the HTTP server for TAB_SWITCH direct calls"""
    import uvicorn
    from http_server import app

    logger.info("Starting HTTP server on port 8080...")
    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="info")


def run_kafka_consumer():
    """Run the Kafka consumer for queue-based events"""
    from main import HintGeneratorService

    logger.info("Starting Kafka consumer...")
    service = HintGeneratorService()
    service.run()


def main():
    """Start both services in separate processes"""
    logger.info("Starting Hint Generator with HTTP + Kafka services...")

    # Create processes
    http_process = multiprocessing.Process(target=run_http_server, name="HTTP-Server")
    kafka_process = multiprocessing.Process(target=run_kafka_consumer, name="Kafka-Consumer")

    # Start processes
    http_process.start()
    kafka_process.start()

    # Graceful shutdown handler
    def signal_handler(signum, frame):
        logger.info("Shutdown signal received, stopping services...")
        http_process.terminate()
        kafka_process.terminate()
        http_process.join(timeout=5)
        kafka_process.join(timeout=5)
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Wait for processes
    try:
        http_process.join()
        kafka_process.join()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
        signal_handler(None, None)


if __name__ == "__main__":
    main()