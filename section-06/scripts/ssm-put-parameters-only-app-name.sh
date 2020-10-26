#!/bin/bash

###################################################################################
## Configurations
##

# Environment
APP_ENV=${THIS_DEPLOYMENT_ENV}
echo "APP_ENV = "${APP_ENV}

# Application Name
APP_NAME=${APP_NAME}
echo "APP_NAME = "$APP_NAME

# Which AWS region you plan to place SSM Parameters?
AWS_REGION=$(aws configure get laravel-on-aws-ecs-workshops.region)
echo "AWS_REGION = "$AWS_REGION

# Which AWS Profile you plan to use?
AWS_PROFILE=${AWS_DEFAULT_PROFILE}
echo "AWS_PROFILE = "$AWS_PROFILE

# AWS KMS Key Id
KMS_KEY_ID=""

echo
echo

###################################################################################
## Main
##

echo "Putting: aws ssm put-parameter: /${APP_ENV}/${APP_NAME}/APP_NAME"
aws ssm put-parameter --name /${APP_ENV}/${APP_NAME}/APP_NAME --value ${APP_NAME} --type String --overwrite --region ${AWS_REGION} --profile ${AWS_PROFILE}

echo "Done: aws ssm put-parameter: /${APP_ENV}/${APP_NAME}/*"
