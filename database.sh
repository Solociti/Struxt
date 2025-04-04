#!/bin/bash

# Backup and Restore for mariadb
# example: ./database.sh backup
# example: ./database.sh restore

# Database credentials from .env file
DB_USER=root
DB_PASS=$(grep MARIADB_ROOT_PASSWORD .env | cut -d '=' -f2)

# Database name
DB_NAME=$(grep PRIMARY_DB .env | cut -d '=' -f2)

# Backup directory
BACKUP_DIR=uploads/backup/database

# Backup file
BACKUP_FILE=$BACKUP_DIR/$DB_NAME-$(date +"%Y-%m-%d").sql


# Backup database
backup() {
  mkdir -p $BACKUP_DIR
  docker exec -i struxt-mariadb-1 mariadb-dump --password=$DB_PASS $DB_NAME > $BACKUP_FILE
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
            # docker cp $FILE struxt-mariadb-1:/dump.sql
            docker exec -i struxt-mariadb-1 mariadb --user=$DB_USER --password=$DB_PASS $DB_NAME < $FILE
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