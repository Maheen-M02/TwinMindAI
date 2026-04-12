# TwinMind AI - Complete AWS Setup Guide

This guide covers the complete AWS infrastructure setup for TwinMind AI, including DynamoDB, S3, IAM, and CloudFormation deployment.

---

## Table of Contents

1. [Quick Start (CloudFormation)](#quick-start-cloudformation)
2. [Manual Setup](#manual-setup)
3. [Architecture Overview](#architecture-overview)
4. [Cost Estimation](#cost-estimation)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start (CloudFormation)

The fastest way to deploy all AWS resources is using CloudFormation.

### Prerequisites

- AWS Account
- AWS CLI installed and configured
- Appropriate IAM permissions to create resources

### Deploy the Stack

```bash
# Navigate to backend directory
cd twinmind-backend

# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name twinmind-production \
  --template-body file://cloudformation-template.yaml \
  --parameters \
    ParameterKey=ProjectName,ParameterValue=twinmind \
    ParameterKey=Environment,ParameterValue=production \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for stack creation to complete
aws cloudformation wait stack-create-complete \
  --stack-name twinmind-production \
  --region us-east-1

# Get stack outputs (credentials, resource names, etc.)
aws cloudformation describe-stacks \
  --stack-name twinmind-production \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### Configure Your Application

After deployment, update your `.env` file with the stack outputs:

```bash
# Get credentials from CloudFormation outputs
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<DeveloperAccessKeyId from outputs>
AWS_SECRET_ACCESS_KEY=<DeveloperSecretAccessKey from outputs>
DYNAMODB_TABLE_NAME=<DynamoDBTableName from outputs>
S3_ML_MODELS_BUCKET=<MLModelsBucketName from outputs>
S3_FRAMES_BUCKET=<FramesBucketName from outputs>
```

### Start Your Application

```bash
# Install dependencies
pip install -r requirements.txt

# Upload ML models to S3 (optional)
python upload_models_to_s3.py

# Start the backend
uvicorn main:app --reload --port 8000
```

---

## Manual Setup

If you prefer manual setup or need more control, follow these steps.

### Step 1: Create IAM User

1. Go to AWS Console → IAM → Users → Create User
2. User name: `twinmind-developer`
3. Attach policies directly → Create policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/twinmind-events",
        "arn:aws:dynamodb:*:*:table/twinmind-events/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::twinmind-ml-models-*",
        "arn:aws:s3:::twinmind-ml-models-*/*",
        "arn:aws:s3:::twinmind-frames-*",
        "arn:aws:s3:::twinmind-frames-*/*"
      ]
    }
  ]
}
```

4. Create Access Key → Copy credentials

### Step 2: Create DynamoDB Table

#### Option A: Using Python Script

```bash
# Update .env with your credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
DYNAMODB_TABLE_NAME=twinmind-events

# Run setup script
python setup_aws.py
```

#### Option B: Using AWS CLI

```bash
aws dynamodb create-table \
  --table-name twinmind-events \
  --attribute-definitions \
    AttributeName=machine_id,AttributeType=S \
    AttributeName=ts,AttributeType=N \
    AttributeName=status,AttributeType=S \
  --key-schema \
    AttributeName=machine_id,KeyType=HASH \
    AttributeName=ts,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    IndexName=status-ts-index,KeySchema=[{AttributeName=status,KeyType=HASH},{AttributeName=ts,KeyType=RANGE}],Projection={ProjectionType=ALL} \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --region us-east-1
```

#### Option C: Using AWS Console

1. Go to DynamoDB → Tables → Create table
2. Table name: `twinmind-events`
3. Partition key: `machine_id` (String)
4. Sort key: `ts` (Number)
5. Table settings: On-demand
6. Create global secondary index:
   - Index name: `status-ts-index`
   - Partition key: `status` (String)
   - Sort key: `ts` (Number)
7. Enable DynamoDB Streams (optional)
8. Create table

### Step 3: Create S3 Buckets

```bash
# Bucket for ML models
aws s3 mb s3://twinmind-ml-models-production-${AWS_ACCOUNT_ID} --region us-east-1

# Bucket for frame images (public read)
aws s3 mb s3://twinmind-frames-production-${AWS_ACCOUNT_ID} --region us-east-1

# Set public read policy for frames bucket
aws s3api put-bucket-policy \
  --bucket twinmind-frames-production-${AWS_ACCOUNT_ID} \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::twinmind-frames-production-'${AWS_ACCOUNT_ID}'/*"
    }]
  }'

# Enable CORS for frames bucket
aws s3api put-bucket-cors \
  --bucket twinmind-frames-production-${AWS_ACCOUNT_ID} \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }]
  }'
```

### Step 4: Upload ML Models to S3 (Optional)

```bash
# Upload models
aws s3 cp ml_models/ s3://twinmind-ml-models-production-${AWS_ACCOUNT_ID}/models/ --recursive

# Upload frames
aws s3 cp ../frames/ s3://twinmind-frames-production-${AWS_ACCOUNT_ID}/frames/ --recursive
```

### Step 5: Configure Application

Update `.env`:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
DYNAMODB_TABLE_NAME=twinmind-events
S3_ML_MODELS_BUCKET=twinmind-ml-models-production-123456789012
S3_FRAMES_BUCKET=twinmind-frames-production-123456789012

# API Keys
GEMINI_API_KEY=your_gemini_api_key
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com/
CONTRACT_ADDRESS=0x_deploy_your_contract_first
WALLET_PRIVATE_KEY=0x_use_throwaway_wallet_only
```

---

## Architecture Overview

### AWS Resources Created

1. **DynamoDB Table** (`twinmind-events`)
   - Stores machine events (WARNING, CRITICAL)
   - Partition key: `machine_id`
   - Sort key: `ts` (timestamp)
   - GSI: `status-ts-index` for cross-machine queries

2. **S3 Buckets**
   - `twinmind-ml-models-*`: Private bucket for ML model files
   - `twinmind-frames-*`: Public bucket for frame images

3. **IAM Resources**
   - Developer user with programmatic access
   - Backend application role (for EC2/ECS deployment)
   - Least-privilege policies

4. **CloudWatch Logs**
   - Application log group for monitoring

5. **Secrets Manager** (optional)
   - Secure storage for API keys

### Data Flow

```
Frontend (React)
    ↓ WebSocket
Backend (FastAPI)
    ↓ boto3
DynamoDB (Events) + S3 (Models/Frames)
```

### Table Schema

**Primary Keys:**
- `machine_id` (String): Machine identifier (e.g., "CNC-001")
- `ts` (Number): Unix timestamp

**Attributes:**
- `status`: "HEALTHY" | "WARNING" | "CRITICAL"
- `failure_prob`: Float (0.0 - 1.0)
- `rul_cycles`: Integer (remaining useful life)
- `top_driver`: String (primary sensor causing issue)
- `event_id`: String (unique identifier)

**Global Secondary Index:**
- `status-ts-index`: Query all CRITICAL/WARNING events across machines

---

## Cost Estimation

### Monthly Costs (Typical Usage)

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| DynamoDB | On-demand, ~1M reads, ~100K writes | $1.50 |
| S3 (ML Models) | 1 GB storage, minimal requests | $0.03 |
| S3 (Frames) | 5 GB storage, 10K GET requests | $0.12 |
| Data Transfer | 10 GB outbound | $0.90 |
| CloudWatch Logs | 1 GB ingestion, 1 month retention | $0.50 |
| **Total** | | **~$3.05/month** |

### Cost Optimization Tips

1. **Use On-Demand Billing**: Automatically scales with usage
2. **Enable S3 Lifecycle Policies**: Archive old frames to Glacier
3. **Set DynamoDB TTL**: Auto-delete old events
4. **Use CloudWatch Alarms**: Monitor unexpected cost spikes

---

## Troubleshooting

### "Unable to locate credentials"

**Solution:**
```bash
# Option 1: Configure AWS CLI
aws configure

# Option 2: Set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1

# Option 3: Use IAM role (for EC2/ECS)
# No credentials needed - role is automatically assumed
```

### "ResourceNotFoundException: Table not found"

**Solution:**
```bash
# Verify table exists
aws dynamodb describe-table --table-name twinmind-events --region us-east-1

# If not, create it
python setup_aws.py
```

### "AccessDeniedException"

**Solution:**
- Verify IAM user has correct permissions
- Check resource ARNs in IAM policy match your table/bucket names
- Ensure region matches in .env and IAM policy

### "ValidationException: One or more parameter values were invalid"

**Solution:**
- Check that all required attributes are provided
- Verify data types match schema (String, Number, etc.)
- Ensure `ts` is a numeric timestamp, not a string

### CloudFormation Stack Creation Failed

**Solution:**
```bash
# Get failure reason
aws cloudformation describe-stack-events \
  --stack-name twinmind-production \
  --region us-east-1 \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Delete failed stack
aws cloudformation delete-stack \
  --stack-name twinmind-production \
  --region us-east-1

# Fix issue and retry
```

### High DynamoDB Costs

**Solution:**
```bash
# Check table metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=twinmind-events \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum

# Enable TTL to auto-delete old events
aws dynamodb update-time-to-live \
  --table-name twinmind-events \
  --time-to-live-specification "Enabled=true, AttributeName=ttl"
```

---

## Migration from SQLite

If you have existing SQLite data:

```python
import sqlite3
from aws_db import log_event

# Connect to SQLite
con = sqlite3.connect("twinmind.db")
rows = con.execute("SELECT * FROM events").fetchall()

# Migrate to DynamoDB
for row in rows:
    _, machine_id, status, failure_prob, rul_cycles, top_driver, ts = row
    log_event(machine_id, status, failure_prob, rul_cycles, top_driver)

con.close()
print(f"✓ Migrated {len(rows)} events to DynamoDB")
```

---

## Production Deployment Checklist

- [ ] CloudFormation stack deployed successfully
- [ ] IAM credentials stored securely (use AWS Secrets Manager)
- [ ] DynamoDB table created with GSI
- [ ] S3 buckets created with proper permissions
- [ ] ML models uploaded to S3
- [ ] Frame images uploaded to S3 (if needed)
- [ ] Environment variables configured in `.env`
- [ ] Application tested locally with AWS resources
- [ ] CloudWatch alarms configured for monitoring
- [ ] Backup strategy implemented (DynamoDB PITR enabled)
- [ ] Cost alerts configured in AWS Billing

---

## Additional Resources

- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [AWS S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [AWS CloudFormation User Guide](https://docs.aws.amazon.com/cloudformation/)
- [boto3 Documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review AWS CloudWatch logs
3. Verify IAM permissions
4. Check AWS Service Health Dashboard
