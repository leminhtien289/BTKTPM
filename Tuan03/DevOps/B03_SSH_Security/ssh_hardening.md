# B03 — SSH Hardening + UFW Firewall + Secret Management

## 1. SSH Hardening

### /etc/ssh/sshd_config (thay đổi cần thiết)

```sshd_config
# ── Authentication ────────────────────────────────────────────────────────────
PermitRootLogin no                    # Không cho root login trực tiếp
PasswordAuthentication no             # Chỉ dùng key-based auth
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# ── Security ──────────────────────────────────────────────────────────────────
Protocol 2                            # Chỉ SSH v2
MaxAuthTries 3                        # Tối đa 3 lần thử password
MaxSessions 5                         # Tối đa 5 session đồng thời per connection
LoginGraceTime 20                     # Timeout nếu chưa auth trong 20s
ClientAliveInterval 300               # Disconnect idle client sau 5 phút
ClientAliveCountMax 2

# ── Network ───────────────────────────────────────────────────────────────────
Port 2222                             # Đổi port mặc định (tránh brute force scan)
ListenAddress 0.0.0.0
AddressFamily inet

# ── Disable unused features ───────────────────────────────────────────────────
X11Forwarding no
AllowTcpForwarding no
AllowAgentForwarding no
PermitEmptyPasswords no
UsePAM yes

# ── Whitelist users ───────────────────────────────────────────────────────────
AllowUsers deploy admin               # Chỉ 2 user được SSH
```

### Áp dụng và kiểm tra

```bash
# Validate config trước khi restart
sudo sshd -t

# Restart SSH (giữ session hiện tại mở!)
sudo systemctl restart sshd

# Kiểm tra port mới hoạt động (trong terminal khác)
ssh -p 2222 admin@server_ip

# Xem SSH login attempts
sudo tail -f /var/log/auth.log | grep sshd
sudo journalctl -u sshd -f
```

---

## 2. UFW Firewall Rules

```bash
# ── Reset về default ─────────────────────────────────────────────────────────
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# ── Allow essential services ──────────────────────────────────────────────────
sudo ufw allow 2222/tcp comment "SSH custom port"
sudo ufw allow 80/tcp   comment "HTTP"
sudo ufw allow 443/tcp  comment "HTTPS"

# ── Application-specific (chỉ từ trusted IP) ─────────────────────────────────
sudo ufw allow from 10.0.0.0/8 to any port 5432 comment "PostgreSQL internal only"
sudo ufw allow from 10.0.0.0/8 to any port 6379 comment "Redis internal only"
sudo ufw allow from 10.0.0.0/8 to any port 9200 comment "Elasticsearch internal only"

# ── Rate limiting SSH (chống brute force) ────────────────────────────────────
sudo ufw limit 2222/tcp comment "Rate limit SSH"

# ── Enable ───────────────────────────────────────────────────────────────────
sudo ufw enable
sudo ufw status verbose

# Expected output:
# Status: active
# To                     Action    From
# --                     ------    ----
# 2222/tcp (limit)       ALLOW IN  Anywhere
# 80/tcp                 ALLOW IN  Anywhere
# 443/tcp                ALLOW IN  Anywhere
# 5432/tcp               ALLOW IN  10.0.0.0/8
# 6379/tcp               ALLOW IN  10.0.0.0/8
```

---

## 3. Secret Management với Environment Variables

### Nguyên tắc: KHÔNG hardcode secret trong code/config

```bash
# ❌ SAI — hardcode credential trong code
DB_PASSWORD="mypassword123"

# ✅ ĐÚNG — đọc từ environment variable
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD is required}"
```

### Cách set secret an toàn

```bash
# ── Phương pháp 1: .env file (KHÔNG commit vào git) ──────────────────────────
cat > /opt/myapp/.env <<'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=myapp_user
DB_PASSWORD=change_me_strong_password
JWT_SECRET=change_me_random_64_chars
REDIS_URL=redis://localhost:6379
EOF

chmod 600 /opt/myapp/.env         # chỉ owner đọc được
chown myapp:myapp /opt/myapp/.env

# ── Phương pháp 2: systemd EnvironmentFile ───────────────────────────────────
cat > /etc/systemd/system/myapp.service <<'EOF'
[Unit]
Description=My Application

[Service]
User=myapp
WorkingDirectory=/opt/myapp
EnvironmentFile=/opt/myapp/.env   # load secrets từ file
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# ── Phương pháp 3: Export trong script (không persist) ───────────────────────
export DB_PASSWORD="$(cat /run/secrets/db_password)"
```

### .gitignore để bảo vệ secret files

```gitignore
# .gitignore — PHẢI có những dòng này
.env
.env.local
.env.production
*.pem
*.key
secrets/
/config/database.yml
```

### Generate strong secrets

```bash
# JWT secret (64 chars)
openssl rand -hex 32

# Database password (32 chars, URL-safe)
openssl rand -base64 24 | tr -d "=+/" | cut -c1-32

# SSH key pair
ssh-keygen -t ed25519 -C "deploy@myapp" -f ~/.ssh/myapp_deploy
```
