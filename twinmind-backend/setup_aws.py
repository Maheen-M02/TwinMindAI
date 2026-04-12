"""
Setup script for AWS DynamoDB table creation.
Run this once to initialize your DynamoDB table.
"""
from aws_db import init_db

if __name__ == "__main__":
    print("Initializing AWS DynamoDB table...")
    try:
        init_db()
        print("✓ DynamoDB table setup complete!")
        print("\nYour TwinMind backend is ready to use AWS DynamoDB.")
    except Exception as e:
        print(f"✗ Error setting up DynamoDB: {e}")
        print("\nMake sure you have:")
        print("1. Valid AWS credentials in .env file")
        print("2. Proper IAM permissions for DynamoDB")
        print("3. boto3 installed (pip install boto3)")
