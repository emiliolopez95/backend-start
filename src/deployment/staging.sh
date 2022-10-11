#!/bin/bash
set -e
GCP_PROJECT_ID=iclosed
CLOUD_RUN_SERVICE_NAME=iclosed-api-staging
GCP_REGION=us-central1
IMAGE_NAME=iclosed-api-staging
ENVIRONMENT=iclosed-api-staging
SERVICE_ACCOUNT=apis-accessor
CREDS_SECRET_NAME=secret_ICLOSED_API_STAGING_CREDS:latest
PRISMA_DATABASE_URL_SECRET_NAME=secret_ICLOSED_API_STAGING_PRISMA_DATABASE_URL:latest
PORT=4000

#echo ${GCP_KEY_FILE_AUTH} | base64 --decode --ignore-garbage > /tmp/gcloud-api.json
#gcloud auth activate-service-account --key-file=/tmp/gcloud-api.json
gcloud auth activate-service-account --key-file=gcloud-creds.json
gcloud config set project $GCP_PROJECT_ID
gcloud config list
gcloud builds submit . --tag gcr.io/$GCP_PROJECT_ID/$IMAGE_NAME

gcloud run deploy $CLOUD_RUN_SERVICE_NAME --image gcr.io/$GCP_PROJECT_ID/$IMAGE_NAME \
--platform managed \
--region $GCP_REGION \
--service-account $SERVICE_ACCOUNT \
--allow-unauthenticated \
--memory 1Gi \
--port 4000 \
--set-secrets \
CREDS=$CREDS_SECRET_NAME,\
PRISMA_DATABASE_URL=$PRISMA_DATABASE_URL_SECRET_NAME \
--set-env-vars \
CREDS_SECRET_NAME=$CREDS_SECRET_NAME,\
ENVIRONMENT=$ENVIRONMENT,\
GCP_PROJECT_ID=$GCP_PROJECT_ID

gcloud run services update-traffic $CLOUD_RUN_SERVICE_NAME --to-latest --platform managed --region $GCP_REGION
