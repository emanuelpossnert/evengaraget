#!/bin/bash

# EventGaraget n8n Backup Script
# Usage: ./scripts/backup.sh

set -e

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

echo "💾 EventGaraget Backup"
echo "====================="

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Backup workflows
echo "📄 Backing up workflows..."
if [ -d "workflows" ]; then
    cp -r workflows "$BACKUP_PATH/"
    echo "   ✅ Workflows backed up"
else
    echo "   ⚠️  No workflows directory found"
fi

# Backup n8n data (if using Docker volume)
echo "📦 Backing up n8n data..."
if docker volume ls | grep -q "eventgaraget_n8n_data"; then
    docker run --rm \
        -v eventgaraget_n8n_data:/data \
        -v "$(pwd)/$BACKUP_PATH":/backup \
        alpine tar czf /backup/n8n_data.tar.gz -C /data .
    echo "   ✅ n8n data backed up"
else
    echo "   ⚠️  n8n data volume not found"
fi

# Backup environment template (NOT actual .env for security)
echo "⚙️  Backing up configuration templates..."
if [ -f ".env.example" ]; then
    cp .env.example "$BACKUP_PATH/"
    echo "   ✅ Environment template backed up"
fi

# Create backup info file
echo "📝 Creating backup info..."
cat > "$BACKUP_PATH/backup_info.txt" << EOF
Backup Created: $(date)
Hostname: $(hostname)
n8n Version: $(docker exec n8n-eventgaraget n8n --version 2>/dev/null || echo "n8n not running")

Contents:
- workflows/: n8n workflow JSON files
- n8n_data.tar.gz: n8n database and credentials (encrypted)
- .env.example: Environment variable template

Restore Instructions:
1. Copy workflows to workflows/ directory
2. Extract n8n_data.tar.gz to Docker volume
3. Configure .env with your credentials
4. Run: docker-compose up -d
5. Import workflows in n8n UI
EOF

# Create compressed archive
echo "🗜️  Compressing backup..."
cd "$BACKUP_DIR"
tar czf "backup_$TIMESTAMP.tar.gz" "backup_$TIMESTAMP"
rm -rf "backup_$TIMESTAMP"
cd ..

# Calculate size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" | cut -f1)

echo ""
echo "✅ Backup completed successfully!"
echo ""
echo "📦 Backup file: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
echo "📏 Size: $BACKUP_SIZE"
echo ""
echo "💡 Tip: Store backups securely and off-site!"
echo "   Consider uploading to cloud storage or external drive"
echo ""

# List all backups
echo "📋 Available backups:"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "   No backups found"
echo ""

# Cleanup old backups (keep last 7)
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 7 ]; then
    echo "🧹 Cleaning up old backups (keeping last 7)..."
    ls -t "$BACKUP_DIR"/*.tar.gz | tail -n +8 | xargs rm -f
    echo "   ✅ Cleanup complete"
fi

