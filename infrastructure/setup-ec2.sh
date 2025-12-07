#!/bin/bash

##############################################################################
# FrontDash EC2 Instance Setup Script
# This script creates an EC2 instance and configures it to connect to RDS
##############################################################################

set -e  # Exit on any error

# Disable AWS CLI pager to prevent script from pausing
export AWS_PAGER=""

# Configuration Variables
INSTANCE_NAME="frontdash-api-server"
INSTANCE_TYPE="t2.micro"  # Free tier eligible
AMI_ID="ami-0c7217cdde317cfec"  # Ubuntu 22.04 LTS in us-east-1 (change for your region)
REGION="us-east-1"
KEY_NAME="frontdash-key"

echo "================================================"
echo "FrontDash EC2 Setup"
echo "================================================"

# Step 1: Check if database config exists
echo ""
echo "Step 1: Checking for database configuration..."

if [ ! -f "db-config.txt" ]; then
    echo "❌ Error: db-config.txt not found!"
    echo "Please run setup-database.sh first."
    exit 1
fi

# Load database configuration
source db-config.txt
echo "✓ Database configuration loaded"

# Step 2: Create or use existing key pair
echo ""
echo "Step 2: Setting up SSH key pair..."

if aws ec2 describe-key-pairs --key-names $KEY_NAME --region $REGION &> /dev/null; then
    echo "✓ Key pair '$KEY_NAME' already exists"
else
    echo "Creating new key pair..."
    aws ec2 create-key-pair \
        --key-name $KEY_NAME \
        --region $REGION \
        --query 'KeyMaterial' \
        --output text > ${KEY_NAME}.pem
    
    chmod 400 ${KEY_NAME}.pem
    echo "✓ Key pair created and saved to ${KEY_NAME}.pem"
    echo "  IMPORTANT: Keep this file safe! You need it to SSH into the server."
fi

# Step 3: Create security group for EC2
echo ""
echo "Step 3: Creating security group for EC2 instance..."

EC2_SG_ID=$(aws ec2 create-security-group \
    --group-name frontdash-ec2-sg \
    --description "Security group for FrontDash API server" \
    --region $REGION \
    --output text \
    --query 'GroupId')

echo "✓ EC2 security group created: $EC2_SG_ID"

# Step 4: Configure security group rules
echo ""
echo "Step 4: Configuring security group rules..."

# Allow SSH from anywhere (port 22)
aws ec2 authorize-security-group-ingress \
    --group-id $EC2_SG_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region $REGION

echo "✓ SSH access (port 22) enabled"

# Allow HTTP API access (port 3000)
aws ec2 authorize-security-group-ingress \
    --group-id $EC2_SG_ID \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0 \
    --region $REGION

echo "✓ API access (port 3000) enabled"

# Step 5: Allow EC2 to access RDS
echo ""
echo "Step 5: Configuring database access from EC2..."

# Add ingress rule to database security group to allow EC2 access
aws ec2 authorize-security-group-ingress \
    --group-id $DB_SG_ID \
    --protocol tcp \
    --port 5432 \
    --source-group $EC2_SG_ID \
    --region $REGION

echo "✓ Database access configured for EC2"

# Step 6: Create user data script to set up the EC2 instance
echo ""
echo "Step 6: Creating EC2 initialization script..."

cat > user-data.sh << 'USERDATA_EOF'
#!/bin/bash

# Update system packages
apt-get update
apt-get upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PostgreSQL client
apt-get install -y postgresql-client

# Install git
apt-get install -y git

# Create application directory
mkdir -p /home/ubuntu/frontdash-api
chown ubuntu:ubuntu /home/ubuntu/frontdash-api

# Create a flag file to indicate setup is complete
touch /home/ubuntu/setup-complete
chown ubuntu:ubuntu /home/ubuntu/setup-complete

echo "EC2 instance setup complete!" > /home/ubuntu/setup-log.txt
USERDATA_EOF

echo "✓ Initialization script created"

# Step 7: Launch EC2 instance
echo ""
echo "Step 7: Launching EC2 instance..."
echo "This may take 2-3 minutes..."

INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $EC2_SG_ID \
    --user-data file://user-data.sh \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --region $REGION \
    --output text \
    --query 'Instances[0].InstanceId')

echo "✓ EC2 instance launched: $INSTANCE_ID"

# Save instance ID
echo $INSTANCE_ID > ec2-instance-id.txt

# Step 8: Wait for instance to be running
echo ""
echo "Step 8: Waiting for instance to be running..."

aws ec2 wait instance-running \
    --instance-ids $INSTANCE_ID \
    --region $REGION

echo "✓ Instance is now running!"

# Step 9: Get public IP address
echo ""
echo "Step 9: Retrieving instance details..."

PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "✓ Public IP: $PUBLIC_IP"

# Step 10: Create deployment script
echo ""
echo "Step 10: Creating deployment helper script..."

cat > deploy-api.sh << DEPLOY_EOF
#!/bin/bash

##############################################################################
# Deploy API to EC2 Instance
# This script uploads and starts the Node.js API on the EC2 server
##############################################################################

set -e

echo "================================================"
echo "Deploying FrontDash API"
echo "================================================"

# Wait a bit for EC2 to fully initialize
echo ""
echo "Waiting 30 seconds for EC2 initialization to complete..."
sleep 30

# Copy API files to EC2 (excluding node_modules and dist - they'll be rebuilt on server)
echo ""
echo "Step 1: Preparing EC2 and copying API files..."

ssh -i \${KEY_NAME}.pem -o StrictHostKeyChecking=no ubuntu@\${PUBLIC_IP} "mkdir -p /home/ubuntu/frontdash-api/api"

rsync -avz --exclude 'node_modules' --exclude 'dist' \\
    -e "ssh -i \${KEY_NAME}.pem -o StrictHostKeyChecking=no" \\
    ../backend/api/ ubuntu@\${PUBLIC_IP}:/home/ubuntu/frontdash-api/api/

echo "✓ API files uploaded (node_modules excluded)"

# Copy database configuration
echo ""
echo "Step 2: Copying database configuration..."

scp -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no db-config.txt ubuntu@${PUBLIC_IP}:/home/ubuntu/frontdash-api/

echo "✓ Database config uploaded"

# Copy and run the schema
echo ""
echo "Step 3: Setting up database schema..."

scp -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no schema.sql ubuntu@${PUBLIC_IP}:/home/ubuntu/

ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ubuntu@${PUBLIC_IP} << 'REMOTE_EOF'
    # Load database config
    cd /home/ubuntu/frontdash-api
    source db-config.txt
    
    # Apply schema
    echo "Applying database schema..."
    PGPASSWORD=\$DB_PASSWORD psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME -f /home/ubuntu/schema.sql
    
    echo "✓ Schema applied successfully"
REMOTE_EOF

# Install dependencies and start the API
echo ""
echo "Step 4: Installing dependencies and starting API..."

ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ubuntu@${PUBLIC_IP} << 'REMOTE_EOF'
    cd /home/ubuntu/frontdash-api/api

    # Install npm packages (including TypeScript dev dependencies)
    npm install

    # Build TypeScript to JavaScript
    echo "Building TypeScript..."
    npm run build

    # Install PM2 globally for process management
    sudo npm install -g pm2

    # Load database config
    source /home/ubuntu/frontdash-api/db-config.txt

    # Create .env file
    cat > .env << ENV_EOF
DB_HOST=\$DB_HOST
DB_PORT=\$DB_PORT
DB_NAME=\$DB_NAME
DB_USER=\$DB_USER
DB_PASSWORD=\$DB_PASSWORD
PORT=3000
ENV_EOF

    # Start the API with PM2 (using compiled dist/server.js)
    pm2 start dist/server.js --name frontdash-api
    pm2 save
    pm2 startup | tail -n 1 | bash

    echo "✓ API is now running!"
REMOTE_EOF

# Generate Postman collection with actual IP
echo ""
echo "Step 5: Generating Postman collection..."

if [ -f "../backend/api/FrontDash-API.postman_collection.template.json" ]; then
    sed "s/{{PUBLIC_IP}}/${PUBLIC_IP}/g" ../backend/api/FrontDash-API.postman_collection.template.json > ../backend/api/FrontDash-API.postman_collection.json
    echo "✓ Postman collection generated: backend/api/FrontDash-API.postman_collection.json"
    echo "  Import this into Postman to test all API endpoints"
else
    echo "⚠️  Postman template not found, skipping collection generation"
fi

echo ""
echo "================================================"
echo "Deployment Complete!"
echo "================================================"
echo ""
echo "API is accessible at:"
echo "  http://${PUBLIC_IP}:3000"
echo ""
echo "Test the API with:"
echo "  curl http://${PUBLIC_IP}:3000/health"
echo ""
echo "Postman Collection:"
echo "  backend/api/FrontDash-API.postman_collection.json"
echo "================================================"
DEPLOY_EOF

chmod +x deploy-api.sh

echo "✓ Deployment script created: deploy-api.sh"

# Save configuration
cat > ec2-config.txt << EOF
INSTANCE_ID=$INSTANCE_ID
PUBLIC_IP=$PUBLIC_IP
EC2_SG_ID=$EC2_SG_ID
KEY_NAME=$KEY_NAME
EOF

echo ""
echo "================================================"
echo "EC2 Setup Complete!"
echo "================================================"
echo ""
echo "Instance Details:"
echo "  Instance ID: $INSTANCE_ID"
echo "  Public IP: $PUBLIC_IP"
echo "  Key File: ${KEY_NAME}.pem"
echo ""
echo "Next Steps:"
echo "  1. Wait 1-2 minutes for the instance to fully initialize"
echo "  2. Run: ./deploy-api.sh"
echo "  3. Your API will be accessible at: http://${PUBLIC_IP}:3000"
echo ""
echo "To SSH into the server:"
echo "  ssh -i ${KEY_NAME}.pem ubuntu@${PUBLIC_IP}"
echo "================================================"