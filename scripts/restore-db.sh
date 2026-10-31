#!/bin/bash
# ====================================================================
# Disaster Recovery & Restore Script for Personal Organizer
# ====================================================================

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-dump-file> [optional-target-db-name]"
  exit 1
fi

DUMP_FILE="$1"
DB_NAME="${2:-${DB_NAME:-personal_organizer}}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

if [ ! -f "${DUMP_FILE}" ]; then
  echo "❌ Error: Backup file '${DUMP_FILE}' does not exist."
  exit 1
fi

echo "=========================================================="
echo "⚠️  Starting Database Restore Drill"
echo "Target DB: ${DB_NAME} on ${DB_HOST}:${DB_PORT}"
echo "Source:    ${DUMP_FILE}"
echo "=========================================================="

# Run pg_restore with clean (-c) and verbose (-v)
pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -v -c "${DUMP_FILE}"

echo "=========================================================="
echo "✅ Database restore completed! Running integrity checks..."
echo "=========================================================="

psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "
  SELECT 'categories' AS table_name, count(*) AS total_rows FROM categories
  UNION ALL
  SELECT 'entries', count(*) FROM entries
  UNION ALL
  SELECT 'entry_items', count(*) FROM entry_items
  UNION ALL
  SELECT 'entry_attachments', count(*) FROM entry_attachments;
"

echo "🎉 Restore verification successful!"
