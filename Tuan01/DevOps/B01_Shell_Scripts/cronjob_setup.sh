#!/bin/bash
# cronjob_setup.sh — Install all cron jobs for backup, log-rotate, monitor
# Run once as root: sudo ./cronjob_setup.sh

SCRIPTS_DIR="/opt/scripts"
mkdir -p "${SCRIPTS_DIR}"

# Copy scripts
cp backup.sh log-rotate.sh monitor.sh "${SCRIPTS_DIR}/"
chmod +x "${SCRIPTS_DIR}"/*.sh

# Install cron jobs (append to crontab, avoid duplicates)
CRON_FILE=$(mktemp)
crontab -l 2>/dev/null | grep -v "opt/scripts" > "${CRON_FILE}" || true

cat >> "${CRON_FILE}" <<'EOF'
# DevOps B1 — System Maintenance Scripts
# backup.sh   — every day at 02:00 AM
0 2 * * * /opt/scripts/backup.sh myapp >> /var/log/backup.log 2>&1
# log-rotate  — every day at midnight
0 0 * * * /opt/scripts/log-rotate.sh /var/log/myapp >> /var/log/logrotate-custom.log 2>&1
# monitor.sh  — every 5 minutes
*/5 * * * * /opt/scripts/monitor.sh >> /var/log/monitor.log 2>&1
EOF

crontab "${CRON_FILE}"
rm "${CRON_FILE}"

echo "Cron jobs installed:"
crontab -l | grep "opt/scripts"
