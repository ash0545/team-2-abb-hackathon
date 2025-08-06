# Python ML Service

## Redis Installation Steps (To be added to the Dockerfile)

sudo apt-get install lsb-release curl gpg
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
sudo chmod 644 /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install redis

## Redis Server Start Command

The below commands are to be run alongside the FastAPI server in separate terminals.

```bash
redis-server
```

and in another terminal:

```bash
celery -A celery_worker.celery_app worker --loglevel=info (to be run in another terminal)
```
