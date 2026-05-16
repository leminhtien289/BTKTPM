#!/bin/bash
# log-rotate.sh — Rotate application logs, compress old ones
# Usage: ./log-rotate.sh /var/log/myapp
# Cronjob: 0 0 * * * /opt/scripts/log-rotate.sh /var/log/myapp >> /var/log/logrotate-custom.log 2>&1

set -euo pipefail

LOG_DIR="${1:-/var/log/myapp}"
MAX_SIZE_MB=100       # rotate if log exceeds this size
COMPRESS_AFTER_DAYS=1 # compress logs older than N days
RETAIN_DAYS=30        # delete compressed logs older than N days

echo "[$(date)] Log rotation started for: ${LOG_DIR}"

# ── Rotate large logs ─────────────────────────────────────────────────────────
find "${LOG_DIR}" -name "*.log" -not -name "*.gz" | while read -r logfile; do
    SIZE_MB=$(du -m "${logfile}" | cut -f1)
    if [ "${SIZE_MB}" -ge "${MAX_SIZE_MB}" ]; then
        ROTATED="${logfile}.$(date +%Y%m%d_%H%M%S)"
        mv "${logfile}" "${ROTATED}"
        touch "${logfile}"           # recreate empty log
        # Signal app to reopen log file (if applicable)
        pkill -USR1 -f "myapp" 2>/dev/null || true
        echo "  Rotated: ${logfile} (${SIZE_MB}MB) → ${ROTATED}"
    fi
done

# ── Compress old plain-text logs ──────────────────────────────────────────────
find "${LOG_DIR}" -name "*.log.*" -not -name "*.gz" \
     -mtime +${COMPRESS_AFTER_DAYS} | while read -r f; do
    gzip "${f}"
    echo "  Compressed: ${f}"
done

# ── Delete very old compressed logs ──────────────────────────────────────────
find "${LOG_DIR}" -name "*.gz" -mtime +${RETAIN_DAYS} -delete
echo "[$(date)] Deleted logs older than ${RETAIN_DAYS} days"

# ── Report disk usage ─────────────────────────────────────────────────────────
USED=$(du -sh "${LOG_DIR}" | cut -f1)
FILES=$(find "${LOG_DIR}" -type f | wc -l)
echo "[$(date)] Log rotation done. ${FILES} files, ${USED} total"
