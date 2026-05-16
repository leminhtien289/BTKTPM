#!/bin/bash
# monitor.sh — System health check: CPU, memory, disk, services
# Usage: ./monitor.sh
# Cronjob: */5 * * * * /opt/scripts/monitor.sh >> /var/log/monitor.log 2>&1

set -euo pipefail

ALERT_EMAIL="${ALERT_EMAIL:-admin@example.com}"
CPU_THRESHOLD=85      # alert if CPU % > this
MEM_THRESHOLD=90      # alert if memory % > this
DISK_THRESHOLD=85     # alert if disk % > this
SERVICES=("nginx" "postgresql" "myapp")

HOSTNAME=$(hostname)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
ALERTS=()

# ── CPU Usage ─────────────────────────────────────────────────────────────────
CPU_IDLE=$(vmstat 1 1 | awk 'NR==3{print $15}')
CPU_USED=$((100 - CPU_IDLE))
if [ "${CPU_USED}" -gt "${CPU_THRESHOLD}" ]; then
    ALERTS+=("CPU CRITICAL: ${CPU_USED}% (threshold: ${CPU_THRESHOLD}%)")
fi
echo "[${TIMESTAMP}] CPU: ${CPU_USED}%"

# ── Memory Usage ──────────────────────────────────────────────────────────────
MEM_TOTAL=$(free -m | awk 'NR==2{print $2}')
MEM_USED=$(free -m  | awk 'NR==2{print $3}')
MEM_PCT=$(( MEM_USED * 100 / MEM_TOTAL ))
if [ "${MEM_PCT}" -gt "${MEM_THRESHOLD}" ]; then
    ALERTS+=("MEMORY CRITICAL: ${MEM_PCT}% (${MEM_USED}MB / ${MEM_TOTAL}MB)")
fi
echo "[${TIMESTAMP}] Memory: ${MEM_PCT}% (${MEM_USED}MB / ${MEM_TOTAL}MB)"

# ── Disk Usage ────────────────────────────────────────────────────────────────
while IFS= read -r line; do
    USAGE=$(echo "${line}" | awk '{print $5}' | tr -d '%')
    MOUNT=$(echo "${line}"  | awk '{print $6}')
    if [ "${USAGE}" -gt "${DISK_THRESHOLD}" ]; then
        ALERTS+=("DISK CRITICAL: ${MOUNT} at ${USAGE}%")
    fi
    echo "[${TIMESTAMP}] Disk ${MOUNT}: ${USAGE}%"
done < <(df -h | awk 'NR>1 && $6 != "tmpfs"' | grep -v "udev")

# ── Service Status ────────────────────────────────────────────────────────────
for svc in "${SERVICES[@]}"; do
    if systemctl is-active --quiet "${svc}"; then
        echo "[${TIMESTAMP}] Service ${svc}: RUNNING"
    else
        ALERTS+=("SERVICE DOWN: ${svc} is not running")
        echo "[${TIMESTAMP}] Service ${svc}: DOWN"
        # Auto-restart attempt
        systemctl restart "${svc}" 2>/dev/null && \
            echo "[${TIMESTAMP}] Auto-restarted: ${svc}" || true
    fi
done

# ── Send alerts ───────────────────────────────────────────────────────────────
if [ "${#ALERTS[@]}" -gt 0 ]; then
    BODY="ALERTS on ${HOSTNAME} at ${TIMESTAMP}:\n"
    for alert in "${ALERTS[@]}"; do
        BODY+="  - ${alert}\n"
    done
    echo -e "${BODY}"
    # Uncomment to send email:
    # echo -e "${BODY}" | mail -s "[ALERT] ${HOSTNAME} health check" "${ALERT_EMAIL}"
fi

echo "[${TIMESTAMP}] Monitor check complete. Alerts: ${#ALERTS[@]}"
