import asyncio
import websockets
import json
import sys

async def test_chat():
    uri = "ws://localhost:8002/ws/chat"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            
            # 1. Initialize
            init_msg = {
                "type": "init",
                "problem": "Two Sum",
                "code": "def twoSum(nums, target): pass",
                "hints": ["Use a hash map"]
            }
            await websocket.send(json.dumps(init_msg))
            print(f"> Sent Init: {init_msg}")
            
            response = await websocket.recv()
            print(f"< Received: {response}")

            # 2. Send Message
            msg = {
                "type": "message",
                "content": "Can you help me with the logic?"
            }
            await websocket.send(json.dumps(msg))
            print(f"> Sent Message: {msg}")
            
            # Wait for response
            while True:
                response = await websocket.recv()
                data = json.loads(response)
                print(f"< Received: {data}")
                if data.get("type") == "response":
                    break
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure the service is running (docker compose up chat-service)")

if __name__ == "__main__":
    # check for websockets
    try:
        import websockets
    except ImportError:
        print("Please install websockets: pip install websockets")
        sys.exit(1)
        
    asyncio.run(test_chat())
