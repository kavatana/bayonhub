# Setting Up Cloudflare R2

1. Go to cloudflare.com → R2 → Create bucket: bayonhub-media
2. Bucket settings → Public access → Enable
3. Manage API tokens → Create R2 token with read+write
4. Copy: Account ID, Access Key ID, Secret Access Key
5. In Railway dashboard → Variables → Add:
   R2_ACCOUNT_ID=xxx
   R2_ACCESS_KEY_ID=xxx
   R2_SECRET_ACCESS_KEY=xxx
   R2_BUCKET_NAME=bayonhub-media
   R2_PUBLIC_URL=https://pub-xxx.r2.dev
6. In Cloudflare Pages → Variables → Add:
   VITE_R2_PUBLIC_URL=https://pub-xxx.r2.dev
7. Redeploy both services
