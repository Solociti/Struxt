#!/bin/bash

# Backup and Restore for mariadb
# example: ./database.sh backup
# example: ./database.sh restore

# Exit on error
set -e

# Database credentials from .env file
DB_USER=struxt
DB_PASS=$(grep MONGODB_PASSWORD .env | cut -d '=' -f2)

# Database name
DB_NAME=$(grep MONGODB_PREFIX .env | cut -d '=' -f2)

# Backup directory
BACKUP_DIR="$(grep UPLOAD_DIR .env | cut -d '=' -f2)/backup/mongo"

# Backup file
BACKUP_FILE=$DB_NAME-$(date +"%Y-%m-%d").gz


# Backup database
backup() {
  mkdir -p $BACKUP_DIR

  docker exec -i struxt-mongo-1 \
    mongodump --host=localhost:27017 \
    --username=$DB_USER --password=$DB_PASS --authenticationDatabase=admin \
    --db=$DB_NAME --archive=/backups/$BACKUP_FILE --gzip

  echo "Backup created: $BACKUP_FILE"
}

# Restore database
restore() {
  # Allow to select one of the files in the directory
  select FILE in $BACKUP_DIR/*; do
    if [ -n "$FILE" ]; then
      read -p "Are you sure you want to restore the database? (y/n): " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then

        BASE_NAME="$(basename $FILE)"

        docker exec -i struxt-mongo-1 \
          mongorestore --host=localhost:27017 \
          --username=$DB_USER --password=$DB_PASS --authenticationDatabase=admin \
          --archive=/backups/$BASE_NAME --gzip \
          --nsExclude="sessions*" --drop


        echo "Database restored: $FILE"
        break
      else
        echo "Invalid selection"
      fi
    fi
  done
}

# Run backup or restore
if [ "$1" == "backup" ]; then
  backup
elif [ "$1" == "restore" ]; then
  restore
else
  echo "Usage: $0 backup|restore"
fi