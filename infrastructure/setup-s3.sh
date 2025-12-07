#!/bin/bash

##############################################################################
# FrontDash S3 Bucket Setup Script
# Creates an S3 bucket for storing restaurant and menu item images
#
# Run this BEFORE setup-ec2.sh
##############################################################################

set -e  # Exit on any error

# Disable AWS CLI pager
export AWS_PAGER=""

# Configuration
BUCKET_NAME="frontdash-images"
REGION="us-east-1"

echo "================================================"
echo "FrontDash S3 Setup"
echo "================================================"

# Step 1: Create S3 bucket
echo ""
echo "Step 1: Creating S3 bucket..."

# Check if bucket already exists
if aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null; then
    echo "  Bucket '$BUCKET_NAME' already exists"
else
    # Create bucket (us-east-1 doesn't need LocationConstraint)
    if [ "$REGION" = "us-east-1" ]; then
        aws s3api create-bucket \
            --bucket $BUCKET_NAME \
            --region $REGION
    else
        aws s3api create-bucket \
            --bucket $BUCKET_NAME \
            --region $REGION \
            --create-bucket-configuration LocationConstraint=$REGION
    fi
    echo "  ✓ Bucket created: $BUCKET_NAME"
fi

# Step 2: Disable "Block Public Access" for the bucket
# (Required for public read access to images)
echo ""
echo "Step 2: Configuring public access settings..."

aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo "  ✓ Public access block disabled"

# Step 3: Set bucket policy for public read access
echo ""
echo "Step 3: Setting bucket policy for public image access..."

cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy file:///tmp/bucket-policy.json

rm /tmp/bucket-policy.json

echo "  ✓ Bucket policy applied (public read for images)"

# Step 4: Configure CORS for browser uploads
echo ""
echo "Step 4: Configuring CORS for browser uploads..."

cat > /tmp/cors-config.json << EOF
{
    "CORSRules": [
        {
            "AllowedOrigins": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST"],
            "AllowedHeaders": ["*"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3600
        }
    ]
}
EOF

aws s3api put-bucket-cors \
    --bucket $BUCKET_NAME \
    --cors-configuration file:///tmp/cors-config.json

rm /tmp/cors-config.json

echo "  ✓ CORS configured for browser uploads"

# Step 5: Create IAM policy for EC2 to upload to S3
echo ""
echo "Step 5: Creating IAM policy for S3 uploads..."

POLICY_NAME="frontdash-s3-upload-policy"

# Check if policy already exists
EXISTING_POLICY_ARN=$(aws iam list-policies \
    --query "Policies[?PolicyName=='${POLICY_NAME}'].Arn" \
    --output text 2>/dev/null)

if [ -n "$EXISTING_POLICY_ARN" ] && [ "$EXISTING_POLICY_ARN" != "None" ]; then
    echo "  Policy already exists: $EXISTING_POLICY_ARN"
    POLICY_ARN=$EXISTING_POLICY_ARN
else
    cat > /tmp/s3-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
        }
    ]
}
EOF

    POLICY_ARN=$(aws iam create-policy \
        --policy-name $POLICY_NAME \
        --policy-document file:///tmp/s3-policy.json \
        --query 'Policy.Arn' \
        --output text)

    rm /tmp/s3-policy.json
    echo "  ✓ IAM policy created: $POLICY_ARN"
fi

# Step 6: Create IAM role for EC2
echo ""
echo "Step 6: Creating IAM role for EC2..."

ROLE_NAME="frontdash-ec2-role"

# Check if role already exists
if aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
    echo "  Role already exists: $ROLE_NAME"
else
    # Trust policy allows EC2 to assume this role
    cat > /tmp/trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "Role for FrontDash EC2 instance to access S3" \
        > /dev/null

    rm /tmp/trust-policy.json
    echo "  ✓ IAM role created: $ROLE_NAME"
fi

# Step 7: Attach S3 policy to role
echo ""
echo "Step 7: Attaching S3 policy to role..."

aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn $POLICY_ARN 2>/dev/null || echo "  Policy may already be attached"

echo "  ✓ Policy attached to role"

# Step 8: Create instance profile
echo ""
echo "Step 8: Creating instance profile..."

INSTANCE_PROFILE_NAME="frontdash-ec2-profile"

if aws iam get-instance-profile --instance-profile-name $INSTANCE_PROFILE_NAME 2>/dev/null; then
    echo "  Instance profile already exists: $INSTANCE_PROFILE_NAME"
else
    aws iam create-instance-profile \
        --instance-profile-name $INSTANCE_PROFILE_NAME \
        > /dev/null

    echo "  ✓ Instance profile created: $INSTANCE_PROFILE_NAME"

    # Add role to instance profile
    aws iam add-role-to-instance-profile \
        --instance-profile-name $INSTANCE_PROFILE_NAME \
        --role-name $ROLE_NAME

    echo "  ✓ Role added to instance profile"

    # Wait for instance profile to propagate
    echo "  Waiting 10 seconds for IAM propagation..."
    sleep 10
fi

# Save configuration for other scripts
cat > s3-config.txt << EOF
S3_BUCKET=$BUCKET_NAME
S3_REGION=$REGION
IAM_ROLE_NAME=$ROLE_NAME
IAM_POLICY_ARN=$POLICY_ARN
INSTANCE_PROFILE_NAME=$INSTANCE_PROFILE_NAME
EOF

echo ""
echo "================================================"
echo "S3 Setup Complete!"
echo "================================================"
echo ""
echo "Bucket Details:"
echo "  Bucket Name: $BUCKET_NAME"
echo "  Region: $REGION"
echo "  Public URL Pattern: https://${BUCKET_NAME}.s3.amazonaws.com/{key}"
echo ""
echo "IAM Configuration:"
echo "  Role: $ROLE_NAME"
echo "  Instance Profile: $INSTANCE_PROFILE_NAME"
echo ""
echo "Next Steps:"
echo "  1. Run: ./setup-database.sh (if not done)"
echo "  2. Run: ./setup-ec2.sh (will use the instance profile)"
echo "================================================"
