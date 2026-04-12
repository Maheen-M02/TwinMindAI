"""
TwinMind AI — AWS DynamoDB integration
Stores machine events in DynamoDB for scalable time-series storage.
"""
import os
import time
from typing import Optional
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key, Attr
from dotenv import load_dotenv

load_dotenv()

# AWS Configuration
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "twinmind-events")

# Initialize DynamoDB client
dynamodb = None
table = None


def _init_dynamodb():
    """Initialize DynamoDB client and table reference."""
    global dynamodb, table
    
    if dynamodb is not None:
        return
    
    # Create DynamoDB resource
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        dynamodb = boto3.resource(
            'dynamodb',
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY
        )
    else:
        # Use default credentials (IAM role, environment, etc.)
        dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    
    table = dynamodb.Table(TABLE_NAME)


def init_db():
    """
    Initialize DynamoDB table if it doesn't exist.
    Table schema:
    - Partition key: machine_id (String)
    - Sort key: ts (Number) - timestamp for time-series queries
    """
    global table
    _init_dynamodb()
    
    try:
        # Check if table exists
        table.load()
        print(f"[aws_db] Table {TABLE_NAME} already exists")
    except dynamodb.meta.client.exceptions.ResourceNotFoundException:
        # Create table
        print(f"[aws_db] Creating table {TABLE_NAME}...")
        new_table = dynamodb.create_table(
            TableName=TABLE_NAME,
            KeySchema=[
                {'AttributeName': 'machine_id', 'KeyType': 'HASH'},  # Partition key
                {'AttributeName': 'ts', 'KeyType': 'RANGE'}  # Sort key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'machine_id', 'AttributeType': 'S'},
                {'AttributeName': 'ts', 'AttributeType': 'N'},
                {'AttributeName': 'status', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'status-ts-index',
                    'KeySchema': [
                        {'AttributeName': 'status', 'KeyType': 'HASH'},
                        {'AttributeName': 'ts', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                    'ProvisionedThroughput': {
                        'ReadCapacityUnits': 5,
                        'WriteCapacityUnits': 5
                    }
                }
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            }
        )
        
        # Wait for table to be created
        new_table.wait_until_exists()
        table = new_table
        print(f"[aws_db] Table {TABLE_NAME} created successfully")


def log_event(machine_id: str, status: str, failure_prob: float, rul_cycles: int, top_driver: str):
    """Log a machine event to DynamoDB."""
    _init_dynamodb()
    
    ts = time.time()
    
    try:
        table.put_item(
            Item={
                'machine_id': machine_id,
                'ts': Decimal(str(ts)),
                'status': status,
                'failure_prob': Decimal(str(failure_prob)),
                'rul_cycles': rul_cycles,
                'top_driver': top_driver,
                'event_id': f"{machine_id}_{int(ts * 1000)}"  # Unique event ID
            }
        )
    except Exception as e:
        print(f"[aws_db] Error logging event: {e}")


def fetch_events(limit: int = 50, machine_id: Optional[str] = None) -> list[dict]:
    """
    Fetch recent events from DynamoDB.
    If machine_id is provided, fetch events for that machine only.
    Otherwise, fetch events across all machines.
    """
    _init_dynamodb()
    
    try:
        if machine_id:
            # Query by machine_id (partition key)
            response = table.query(
                KeyConditionExpression=Key('machine_id').eq(machine_id),
                ScanIndexForward=False,  # Sort descending by timestamp
                Limit=limit
            )
        else:
            # Scan all events (less efficient, but needed for cross-machine queries)
            response = table.scan(Limit=limit)
            # Sort by timestamp descending
            items = sorted(response.get('Items', []), key=lambda x: float(x['ts']), reverse=True)
            response['Items'] = items[:limit]
        
        # Convert Decimal to float for JSON serialization
        events = []
        for item in response.get('Items', []):
            events.append({
                'id': item.get('event_id', ''),
                'machine_id': item['machine_id'],
                'status': item['status'],
                'failure_prob': float(item['failure_prob']),
                'rul_cycles': int(item['rul_cycles']),
                'top_driver': item['top_driver'],
                'ts': float(item['ts'])
            })
        
        return events
    
    except Exception as e:
        print(f"[aws_db] Error fetching events: {e}")
        return []


def fetch_critical_events(limit: int = 20) -> list[dict]:
    """Fetch recent CRITICAL and WARNING events using GSI."""
    _init_dynamodb()
    
    try:
        # Query using the status-ts-index GSI
        critical_response = table.query(
            IndexName='status-ts-index',
            KeyConditionExpression=Key('status').eq('CRITICAL'),
            ScanIndexForward=False,
            Limit=limit
        )
        
        warning_response = table.query(
            IndexName='status-ts-index',
            KeyConditionExpression=Key('status').eq('WARNING'),
            ScanIndexForward=False,
            Limit=limit
        )
        
        # Combine and sort
        items = critical_response.get('Items', []) + warning_response.get('Items', [])
        items = sorted(items, key=lambda x: float(x['ts']), reverse=True)[:limit]
        
        events = []
        for item in items:
            events.append({
                'id': item.get('event_id', ''),
                'machine_id': item['machine_id'],
                'status': item['status'],
                'failure_prob': float(item['failure_prob']),
                'rul_cycles': int(item['rul_cycles']),
                'top_driver': item['top_driver'],
                'ts': float(item['ts'])
            })
        
        return events
    
    except Exception as e:
        print(f"[aws_db] Error fetching critical events: {e}")
        return []
