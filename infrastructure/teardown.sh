#!/bin/bash

##############################################################################
# FrontDash Teardown Script
# This script removes all AWS resources created for the FrontDash project
# WARNING: This will delete all data! Make sure you have backups if needed.
##############################################################################

set -e  # Exit on any error

REGION="us-east-1"

# Parse command line flags
RELEASE_EIP=false
for arg in "$@"; do
    case $arg in
        --release-eip)
            RELEASE_EIP=true
            shift
            ;;
    esac
done

echo "================================================"
echo "FrontDash Teardown"
echo "================================================"
echo ""
echo "⚠️  WARNING: This will delete ALL FrontDash resources!"
echo "   - EC2 instance"
echo "   - RDS database (all data will be lost)"
echo "   - S3 bucket and all images"
echo "   - IAM roles and policies"
echo "   - Security groups"
echo "   - SSH key pair"
if [ "$RELEASE_EIP" = true ]; then
    echo "   - Elastic IP (--release-eip flag detected)"
else
    echo "   - Elastic IP will be KEPT (use --release-eip to release)"
fi
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Teardown cancelled."
    exit 0
fi

echo ""
echo "Starting teardown process..."

# ============================================================================
# Step 1: Terminate EC2 Instance
# ============================================================================

echo ""
echo "Step 1: Terminating EC2 instance..."

if [ -f "ec2-instance-id.txt" ]; then
    INSTANCE_ID=$(cat ec2-instance-id.txt)
    
    echo "  Stopping instance: $INSTANCE_ID"
    aws ec2 terminate-instances \
        --instance-ids $INSTANCE_ID \
        --region $REGION \
        --output text > /dev/null 2>&1 || echo "  ⚠️  Instance may already be terminated"
    
    echo "  Waiting for instance termination..."
    aws ec2 wait instance-terminated \
        --instance-ids $INSTANCE_ID \
        --region $REGION 2>/dev/null || echo "  ⚠️  Instance already terminated"
    
    echo "  ✓ EC2 instance terminated"
else
    echo "  ⚠️  No EC2 instance ID found (ec2-instance-id.txt missing)"
fi

# ============================================================================
# Step 2: Delete S3 Bucket
# ============================================================================

echo ""
echo "Step 2: Deleting S3 bucket..."

S3_BUCKET="frontdash-images"

# Check if bucket exists
if aws s3api head-bucket --bucket $S3_BUCKET 2>/dev/null; then
    echo "  Emptying bucket first (required before deletion)..."
    aws s3 rm s3://$S3_BUCKET --recursive 2>/dev/null || echo "  ⚠️  Bucket may be empty"

    echo "  Deleting bucket..."
    aws s3api delete-bucket --bucket $S3_BUCKET --region $REGION 2>/dev/null || echo "  ⚠️  Could not delete bucket"
    echo "  ✓ S3 bucket deleted"
else
    echo "  ⚠️  S3 bucket not found or already deleted"
fi

# ============================================================================
# Step 3: Delete IAM Resources
# ============================================================================

echo ""
echo "Step 3: Deleting IAM resources..."

ROLE_NAME="frontdash-ec2-role"
POLICY_NAME="frontdash-s3-upload-policy"
INSTANCE_PROFILE_NAME="frontdash-ec2-profile"

# Remove role from instance profile
if aws iam get-instance-profile --instance-profile-name $INSTANCE_PROFILE_NAME 2>/dev/null; then
    echo "  Removing role from instance profile..."
    aws iam remove-role-from-instance-profile \
        --instance-profile-name $INSTANCE_PROFILE_NAME \
        --role-name $ROLE_NAME 2>/dev/null || echo "  ⚠️  Role may not be attached"

    echo "  Deleting instance profile..."
    aws iam delete-instance-profile \
        --instance-profile-name $INSTANCE_PROFILE_NAME 2>/dev/null || echo "  ⚠️  Could not delete instance profile"
    echo "  ✓ Instance profile deleted"
else
    echo "  ⚠️  Instance profile not found"
fi

# Detach policy from role and delete role
if aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
    # Get and detach all policies
    POLICY_ARN=$(aws iam list-attached-role-policies \
        --role-name $ROLE_NAME \
        --query "AttachedPolicies[?PolicyName=='${POLICY_NAME}'].PolicyArn" \
        --output text 2>/dev/null)

    if [ -n "$POLICY_ARN" ] && [ "$POLICY_ARN" != "None" ]; then
        echo "  Detaching policy from role..."
        aws iam detach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn $POLICY_ARN 2>/dev/null || echo "  ⚠️  Could not detach policy"
    fi

    echo "  Deleting IAM role..."
    aws iam delete-role --role-name $ROLE_NAME 2>/dev/null || echo "  ⚠️  Could not delete role"
    echo "  ✓ IAM role deleted"
else
    echo "  ⚠️  IAM role not found"
fi

# Delete the policy
POLICY_ARN=$(aws iam list-policies \
    --query "Policies[?PolicyName=='${POLICY_NAME}'].Arn" \
    --output text 2>/dev/null)

if [ -n "$POLICY_ARN" ] && [ "$POLICY_ARN" != "None" ]; then
    echo "  Deleting IAM policy..."
    aws iam delete-policy --policy-arn $POLICY_ARN 2>/dev/null || echo "  ⚠️  Could not delete policy"
    echo "  ✓ IAM policy deleted"
else
    echo "  ⚠️  IAM policy not found"
fi

# ============================================================================
# Step 4: Delete RDS Database
# ============================================================================

echo ""
echo "Step 4: Deleting RDS database..."

DB_INSTANCE_IDENTIFIER="frontdash-db"

# Check if database exists
if aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --region $REGION > /dev/null 2>&1; then
    
    echo "  Deleting database (this may take 5-10 minutes)..."
    aws rds delete-db-instance \
        --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
        --skip-final-snapshot \
        --region $REGION \
        --output text > /dev/null
    
    echo "  Waiting for database deletion to complete..."
    
    # Wait for database to be deleted (with timeout)
    WAIT_TIME=0
    MAX_WAIT=600  # 10 minutes
    
    while [ $WAIT_TIME -lt $MAX_WAIT ]; do
        if ! aws rds describe-db-instances \
            --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
            --region $REGION > /dev/null 2>&1; then
            echo "  ✓ RDS database deleted"
            break
        fi
        echo "  Waiting... ($WAIT_TIME seconds elapsed)"
        sleep 30
        WAIT_TIME=$((WAIT_TIME + 30))
    done
    
    if [ $WAIT_TIME -ge $MAX_WAIT ]; then
        echo "  ⚠️  Database deletion is taking longer than expected. It will complete in the background."
    fi
else
    echo "  ⚠️  Database not found or already deleted"
fi

# ============================================================================
# Step 5: Delete Security Groups
# ============================================================================

echo ""
echo "Step 5: Deleting security groups..."

# Wait a bit to ensure resources are fully terminated
echo "  Waiting 30 seconds for resources to fully terminate..."
sleep 30

# Delete EC2 security group
if [ -f "ec2-config.txt" ]; then
    source ec2-config.txt

    if [ ! -z "$EC2_SG_ID" ]; then
        echo "  Deleting EC2 security group: $EC2_SG_ID"

        # Retry up to 3 times with increasing delays
        RETRY_COUNT=0
        MAX_RETRIES=3
        DELETED=false

        while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
            if aws ec2 delete-security-group \
                --group-id $EC2_SG_ID \
                --region $REGION 2>/dev/null; then
                echo "  ✓ EC2 security group deleted"
                DELETED=true
                break
            fi

            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                WAIT_TIME=$((20 * RETRY_COUNT))
                echo "  ⚠️  Deletion failed, waiting ${WAIT_TIME} seconds before retry $RETRY_COUNT/$MAX_RETRIES..."
                sleep $WAIT_TIME
            fi
        done

        if [ "$DELETED" = false ]; then
            echo "  ❌ Failed to delete EC2 security group after $MAX_RETRIES attempts"
            echo "  Run this command manually:"
            echo "  aws ec2 delete-security-group --group-id $EC2_SG_ID --region $REGION"
        fi
    fi
else
    echo "  ⚠️  No EC2 config found"
fi

# Delete DB security group
if [ -f "db-config.txt" ]; then
    source db-config.txt

    if [ ! -z "$DB_SG_ID" ]; then
        echo "  Deleting database security group: $DB_SG_ID"

        # Retry up to 3 times with increasing delays
        RETRY_COUNT=0
        MAX_RETRIES=3
        DELETED=false

        while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
            if aws ec2 delete-security-group \
                --group-id $DB_SG_ID \
                --region $REGION 2>/dev/null; then
                echo "  ✓ Database security group deleted"
                DELETED=true
                break
            fi

            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                WAIT_TIME=$((20 * RETRY_COUNT))
                echo "  ⚠️  Deletion failed, waiting ${WAIT_TIME} seconds before retry $RETRY_COUNT/$MAX_RETRIES..."
                sleep $WAIT_TIME
            fi
        done

        if [ "$DELETED" = false ]; then
            echo "  ❌ Failed to delete database security group after $MAX_RETRIES attempts"
            echo "  Run this command manually:"
            echo "  aws ec2 delete-security-group --group-id $DB_SG_ID --region $REGION"
        fi
    fi
else
    echo "  ⚠️  No database config found"
fi

# ============================================================================
# Step 6: Delete Key Pair (Optional)
# ============================================================================

echo ""
echo "Step 6: Deleting SSH key pair..."

KEY_NAME="frontdash-key"

read -p "Do you want to delete the SSH key pair? (yes/no): " -r
echo

if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    aws ec2 delete-key-pair \
        --key-name $KEY_NAME \
        --region $REGION 2>/dev/null || echo "  ⚠️  Key pair may already be deleted"
    
    if [ -f "${KEY_NAME}.pem" ]; then
        rm ${KEY_NAME}.pem
        echo "  ✓ Local key file deleted"
    fi
    
    echo "  ✓ SSH key pair deleted"
else
    echo "  ⚠️  SSH key pair kept (you can delete it manually later)"
fi

# ============================================================================
# Step 7: Clean Up Local Files
# ============================================================================

echo ""
echo "Step 7: Cleaning up local configuration files..."

# List of files to clean up
FILES_TO_CLEAN=(
    "ec2-instance-id.txt"
    "ec2-config.txt"
    "db-config.txt"
    "db-sg-id.txt"
    "s3-config.txt"
    "elastic-ip.txt"
    "user-data.sh"
    "deploy-api.sh"
    "schema.sql"
    "../backend/api/FrontDash-API.postman_collection.json"
)

for file in "${FILES_TO_CLEAN[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo "  ✓ Removed $file"
    fi
done

# ============================================================================
# Step 8: Final Verification
# ============================================================================

echo ""
echo "Step 8: Verifying cleanup..."

# Check for any remaining FrontDash resources
echo ""
echo "Checking for any remaining resources..."

# Check EC2 instances
EC2_COUNT=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=frontdash-api-server" "Name=instance-state-name,Values=running,pending,stopping,stopped" \
    --region $REGION \
    --query 'Reservations[*].Instances[*].InstanceId' \
    --output text 2>/dev/null | wc -w)

if [ "$EC2_COUNT" -gt 0 ]; then
    echo "  ⚠️  Warning: Found $EC2_COUNT EC2 instance(s) still running"
else
    echo "  ✓ No EC2 instances found"
fi

# Check RDS instances
if aws rds describe-db-instances \
    --db-instance-identifier frontdash-db \
    --region $REGION > /dev/null 2>&1; then
    echo "  ⚠️  Warning: Database still exists (may be deleting in background)"
else
    echo "  ✓ No RDS instances found"
fi

# Check security groups
SG_COUNT=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=frontdash-*" \
    --region $REGION \
    --query 'SecurityGroups[*].GroupId' \
    --output text 2>/dev/null | wc -w)

if [ "$SG_COUNT" -gt 0 ]; then
    echo "  ⚠️  Warning: Found $SG_COUNT security group(s)"
else
    echo "  ✓ No security groups found"
fi

# ============================================================================
# Step 9: Handle Elastic IP
# ============================================================================

echo ""
echo "Step 9: Handling Elastic IP..."

# Find the FrontDash Elastic IP
EIP_ALLOCATION_ID=$(aws ec2 describe-addresses \
    --filters "Name=tag:Name,Values=frontdash-elastic-ip" \
    --region $REGION \
    --query 'Addresses[0].AllocationId' \
    --output text 2>/dev/null)

EIP_PUBLIC_IP=$(aws ec2 describe-addresses \
    --filters "Name=tag:Name,Values=frontdash-elastic-ip" \
    --region $REGION \
    --query 'Addresses[0].PublicIp' \
    --output text 2>/dev/null)

if [ "$EIP_ALLOCATION_ID" != "None" ] && [ -n "$EIP_ALLOCATION_ID" ]; then
    if [ "$RELEASE_EIP" = true ]; then
        echo "  Releasing Elastic IP: $EIP_PUBLIC_IP"
        aws ec2 release-address \
            --allocation-id $EIP_ALLOCATION_ID \
            --region $REGION 2>/dev/null || echo "  ⚠️  Could not release Elastic IP"
        echo "  ✓ Elastic IP released"
        EIP_STATUS="released"
    else
        echo "  ⚠️  Elastic IP $EIP_PUBLIC_IP was KEPT (use --release-eip to release)"
        EIP_STATUS="kept"
    fi
else
    echo "  ⚠️  No Elastic IP found"
    EIP_STATUS="not found"
fi

echo ""
echo "================================================"
echo "Teardown Complete!"
echo "================================================"
echo ""
echo "Summary:"
echo "  ✓ EC2 instance terminated"
echo "  ✓ RDS database deleted"
echo "  ✓ S3 bucket deleted"
echo "  ✓ IAM resources deleted"
echo "  ✓ Security groups removed"
echo "  ✓ Local configuration files cleaned up"
if [ "$EIP_STATUS" = "kept" ]; then
    echo "  ⚠️  Elastic IP kept: $EIP_PUBLIC_IP"
elif [ "$EIP_STATUS" = "released" ]; then
    echo "  ✓ Elastic IP released"
fi
echo ""
echo "IMPORTANT NOTES:"
echo "  1. If the database is still deleting, it will complete in the background"
echo "  2. Check your AWS Console to verify all resources are removed"
echo "  3. You may have incurred some charges during the time resources were active"
echo "  4. If you kept the SSH key, delete it manually: aws ec2 delete-key-pair --key-name $KEY_NAME"
if [ "$EIP_STATUS" = "kept" ]; then
    echo "  5. Elastic IP costs ~\$0.005/hr when not attached. Release with: ./teardown.sh --release-eip"
fi
echo ""
echo "To verify no resources remain, visit:"
echo "  EC2: https://console.aws.amazon.com/ec2/"
echo "  RDS: https://console.aws.amazon.com/rds/"
echo "================================================"