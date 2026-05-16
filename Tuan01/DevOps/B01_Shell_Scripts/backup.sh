#!/bin/bash
# backup.sh — Daily database + config backup to /backups/
# Usage: ./backup.sh [db_name]
# Cronjob: 0 2 * * * /opt/scripts/backup.sh myapp >> /var/log/backup.log 2>&1

set -euo pipefail

DB_NAME="${1:-myapp}"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETAIN_DAYS=7

# ── Database backup ───────────────────────────────────────────────────────────
DB_FILE="${BACKUP_DIR}/db_${DB_NAME}_${DATE}.sql.gz"
echo "[$(date)] Starting DB backup: ${DB_NAME} → ${DB_FILE}"

# Read credentials from environment — never hardcode
pg_dump -h "${DB_HOST:-localhost}" \
        -U "${DB_USER:-postgres}" \
        -d "${DB_NAME}" \
        | gzip > "${DB_FILE}"

echo "[$(date)] DB backup done: $(du -sh "${DB_FILE}" | cut -f1)"

# ── Config backup ─────────────────────────────────────────────────────────────
CFG_FILE="${BACKUP_DIR}/config_${DATE}.tar.gz"
tar -czf "${CFG_FILE}" \
    /etc/nginx/nginx.conf \
    /etc/nginx/sites-enabled/ \
    /etc/systemd/system/*.service \
    2>/dev/null || true

echo "[$(date)] Config backup done: ${CFG_FILE}"

# ── Remove old backups ────────────────────────────────────────────────────────
find "${BACKUP_DIR}" -name "db_${DB_NAME}_*.sql.gz" -mtime +${RETAIN_DAYS} -delete
find "${BACKUP_DIR}" -name "config_*.tar.gz"         -mtime +${RETAIN_DAYS} -delete
echo "[$(date)] Cleaned backups older than ${RETAIN_DAYS} days"

# ── Summary ───────────────────────────────────────────────────────────────────
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "*.gz" | wc -l)
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
echo "[$(date)] Backup complete. Total: ${BACKUP_COUNT} files, ${BACKUP_SIZE}"
