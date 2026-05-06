# Mailcow: SSL (Let's Encrypt) + Create Mailboxes for starline.my

## 1. SSL for mail.starline.my

Mailcow includes **acme-mailcow**, which obtains Let's Encrypt certificates. You usually don't need certbot on the host.

### Check DNS (Cloudflare)

- **A** record for **mail** (mail.starline.my) must point to **38.47.35.16** with **Proxy status: DNS only** (grey cloud).  
  If it's Proxied, Let's Encrypt HTTP-01 will fail.

### Trigger or check certificate in Mailcow

1. Log in to **https://mail.starline.my** (accept the self-signed warning for now).
2. Go to **Configuration** → **System** (or **SSL / TLS** / **ACME** depending on your Mailcow version).
3. Find the section for **Let's Encrypt** / **ACME**.
4. Ensure **mail.starline.my** is listed as the hostname (from `MAILCOW_HOSTNAME`).
5. Click **Request certificate** or **Run ACME** (or wait for the next automatic run).

If it fails, on the server run:

```bash
cd /opt/mailcow-dockerized
sudo docker compose logs acme-mailcow --tail 100
```

Common causes: port 80 not reachable from the internet, or **mail** A record proxied in Cloudflare. Fix those and try again.

### Optional: certbot on the host (only if Mailcow ACME keeps failing)

If you prefer certbot on the server (e.g. for another web server), you can get a cert and then either use it for something else or (advanced) configure Mailcow to use it. For Mailcow-only, using its built-in ACME is simpler.

```bash
sudo apt update
sudo apt install -y certbot
# Stop Mailcow nginx so port 80 is free, or use DNS challenge
sudo certbot certonly --standalone -d mail.starline.my
```

Then you’d need to copy the certs into Mailcow’s expected paths and reload; the Mailcow docs describe that. Prefer fixing acme-mailcow first.

---

## 2. Create the five mailboxes

1. Log in to **https://mail.starline.my** (admin / moohoo or your admin password).
2. **Add domain** (if not already):
   - Go to **Configuration** → **Domains** (or **Mailbox** → **Domains**).
   - Click **Add domain**.
   - **Domain:** `starline.my`
   - Save.
3. **Add mailboxes** (Configuration → Mailbox, or Domains → select starline.my → Add mailbox):
   - Create one mailbox per address. For each, set:
     - **Username** (local part): e.g. `admin`, `finance`, `sales`, `salim`, `tambir`
     - **Domain:** `starline.my`
     - **Password:** set a strong password (and optionally “Force password change on first login”)
   - Full addresses will be: **admin@starline.my**, **finance@starline.my**, **sales@starline.my**, **salim@starline.my**, **tambir@starline.my**.

4. **DKIM (recommended):**
   - In Mailcow, open the domain **starline.my** or go to **Configuration** → **Domains** → starline.my.
   - Copy the **DKIM** TXT record (name and value).
   - In **Cloudflare** (DNS for starline.my), add that **TXT** record (e.g. name `mail._domainkey` or as Mailcow shows).

After SSL is issued and mailboxes exist, use **https://mail.starline.my** for webmail and the same host for IMAP (993) and SMTP (587) in mail clients.

---

## 3. Reset Mailcow admin password (forgotten credentials)

From the mailcow directory on the server:

```bash
cd /opt/mailcow-dockerized
sudo ./helper-scripts/mailcow-reset-admin.sh
```

The script prints a **new random admin password**. Username is **admin**. Save it; you need it to log in at https://mail.starline.my. It also clears any 2FA for the admin account.

If the script is missing, see [Mailcow docs: Reset Passwords](https://docs.mailcow.email/troubleshooting/debug-reset_pw/).
