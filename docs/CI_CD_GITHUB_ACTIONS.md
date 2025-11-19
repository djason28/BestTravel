# CI/CD: GitHub Actions → Rocky Linux via SSH

This sets up automatic deployment on every push to `main` using SSH to your Rocky Linux server.

The workflow file: `.github/workflows/deploy.yml`

## 1) First-time Server Bootstrap (manual)

Run these once on your Rocky server:

```bash
# Install Docker + Compose plugin
sudo -i
sudo dnf -y install yum-utils
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker

# Open firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Create target directory and permissions
mkdir -p /home/rocky/BestTravel
chown -R $USER:$USER /home/rocky/BestTravel
```

Optionally, clone once and set `.env` manually as in `docs/DEPLOY_ROCKY.md`. The workflow can also create `.env` if missing using secrets.

## 2) Generate SSH Key and Add to Server

Generate a key on your local machine (or a secure host):

```bash
ssh-keygen -t ed25519 -C "github-actions" -f besttravel_github
# Produces besttravel_github (private) and besttravel_github.pub (public)
```

Copy public key to the server user (replace host):

```bash
ssh-copy-id -i besttravel_github.pub rocky@your.server.ip
# or append manually to ~/.ssh/authorized_keys
```

## 3) Add GitHub Repo Secrets

In GitHub → Settings → Secrets and variables → Actions → New repository secret:

- SSH_HOST: your.server.ip or domain
- SSH_USER: rocky (or your user)
- SSH_KEY: contents of the private key `besttravel_github` (paste entire file)
- SSH_PORT: 22 (if custom, set accordingly)
- SERVER_PATH: /home/rocky/BestTravel (absolute path on server)
- DOMAIN: yourdomain.com (used to create .env if missing)
- JWT_SECRET: a strong random secret (used to create .env if missing)

## 4) Trigger Deployment

- Push to `main` → workflow runs automatically
- Or trigger manually: Actions → Deploy to Rocky via SSH → Run workflow

## What the Workflow Does

1. SSH to the server with the provided key and user
2. Ensure `SERVER_PATH` exists
3. Clone or update the repository to `origin/main`
4. If `.env` does not exist at repo root, it creates it (and sets DOMAIN/JWT_SECRET from secrets)
5. Executes `./deploy.sh`:
   - Builds frontend using a Node container → `views/dist`
   - Ensures `data` and `uploads` exist
   - `docker compose up -d --build`
6. Prints service status with `docker compose ps`

## Notes / Tips

- First deployment requires DNS to be pointing to your server (Caddy needs it for HTTPS certs)
- Keep `.env` on server; the workflow won’t overwrite it if it exists
- Adjust `SERVER_PATH` to your user and directory convention
- If you run into SELinux mount denials, consider labeling mounts or temporarily switching to permissive during first tests
- For multi-environment (staging/prod), duplicate the workflow and use separate branches, directories, and secrets
