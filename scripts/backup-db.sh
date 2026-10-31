#!/bin/bash
# ====================================================================
# Automated Backup Script for Personal Organizer
# Backs up PostgreSQL database and uploaded files with 7-day retention
# ====================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_NAME:-personal_organizer}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

mkdir -p "${BACKUP_DIR}"

DB_DUMP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump"
UPLOADS_ARCHIVE="${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"

echo "=========================================================="
echo "📦 Starting Backup: ${TIMESTAMP}"
echo "=========================================================="

# 1. PostgreSQL Database Dump (Custom Compressed Format)
echo "▶ [1/3] Dumping database '${DB_NAME}'..."
if [ -n "${PGPASSWORD:-}" ]; then
  export PGPASSWORD
fi

pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -F c -b -v -f "${DB_DUMP_FILE}" "${DB_NAME}"
echo "✅ Database dump created: ${DB_DUMP_FILE} ($(du -h "${DB_DUMP_FILE}" | cut -f1))"

# 2. Archive Uploads Directory
UPLOADS_SRC="${UPLOADS_PATH:-backend/uploads}"
if [ -d "${UPLOADS_SRC}" ]; then
  echo "▶ [2/3] Archiving uploads directory..."
  tar -czf "${UPLOADS_ARCHIVE}" -C "$(dirname "${UPLOADS_SRC}")" "$(basename "${UPLOADS_SRC}")"
  echo "✅ Uploads archive created: ${UPLOADS_ARCHIVE} ($(du -h "${UPLOADS_ARCHIVE}" | cut -f1))"
else
  echo "ℹ️ Uploads directory '${UPLOADS_SRC}' not found or empty. Skipping uploads archive."
fi

# 3. Clean up backups older than 7 days
echo "▶ [3/3] Rotating old backups (retention: 7 days)..."
find "${BACKUP_DIR}" -type f -name "${DB_NAME}_*.dump" -mtime +7 -delete || true
find "${BACKUP_DIR}" -type f -name "uploads_*.tar.gz" -mtime +7 -delete || true

echo "=========================================================="
echo "🎉 Backup completed successfully at $(date)"
echo "=========================================================="
