#!/bin/bash

# Original source: https://github.com/pahud/gitpod-workspace/blob/main/utils/refresh_credentials.sh
#
# This script generates AWS Programmatic Access credentials from a user authenticated via AWS SSO.
#
# Before using this script, 
# please do make sure that the AWS SSO is configured in your CLI by `aws configure sso`.
#
# Usage:
#
# > ./refresh_aws_credentials.sh {your-AWS-profile-name}
#

profile=$1
temp_identity=$(aws --profile "$profile" sts get-caller-identity)
account_id=$(echo $temp_identity | jq -r .Arn | cut -d: -f5)
assumed_role_name=$(echo $temp_identity | jq -r .Arn | cut -d/ -f2)
session_name=$(echo $temp_identity | jq -r .Arn | cut -d/ -f3)
sso_region=$(aws --profile "$profile" configure get sso_region)

if [[ $sso_region == 'us-east-1' ]]; then 
  sso_region_string=''
else
  sso_region_string="${sso_region}/"
fi
role_arn="arn:aws:iam::${account_id}:role/aws-reserved/sso.amazonaws.com/${sso_region_string}${assumed_role_name}"


request_credentials() {
  credentials=$(
    aws sts assume-role \
      --profile $profile \
      --role-arn $role_arn \
      --role-session-name $session_name
  )
}

echo "=> requesting temporary credentials"
request_credentials

if [ $? -ne 0 ]; then
  aws sso login --profile "$profile"

  if [ $? -ne 0 ]; then
    exit 1
  fi

  request_credentials
fi

echo "=> updating ~/.aws/credentials as profile $profile"

access_key_id=$(echo $credentials | jq -r .Credentials.AccessKeyId)
secret_access_key=$(echo $credentials | jq -r .Credentials.SecretAccessKey)
session_token=$(echo $credentials | jq -r .Credentials.SessionToken)

aws configure set --profile "$profile" aws_access_key_id "$access_key_id"
aws configure set --profile "$profile" aws_secret_access_key "$secret_access_key"
aws configure set --profile "$profile" aws_session_token "$session_token"

echo "[OK] done"
