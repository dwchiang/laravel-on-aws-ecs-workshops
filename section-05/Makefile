.PHONY: help version build run

ENV_TYPE               := $(THIS_DEPLOYMENT_ENV)

APP_IMAGE_NAME         := $(APP_IMAGE_NAME)
APP_REPO_NAME          := $(APP_IMAGE_NAME)-$(ENV_TYPE)

VERSION_PHP_FPM        := $(VERSION_PHP_FPM)
VERSION_PHP_FPM_MINOR  := $(shell cut -d '.' -f 1 <<< $(VERSION_PHP_FPM)).$(shell cut -d '.' -f 2 <<< $(VERSION_PHP_FPM))
VERSION_NGINX          := $(VERSION_NGINX)
VERSION_OS             := $(VERSION_OS)
VERSION                := $(VERSION_PHP_FPM)-fpm-$(VERSION_OS)-nginx-$(VERSION_NGINX)

GIT_COMMIT_HASH        := $(shell git rev-parse --short HEAD)
AWS_REGION             := $(shell aws configure get ${AWS_DEFAULT_PROFILE}.region)
AWS_ACCOUNT_ID         := $(shell aws sts get-caller-identity | jq --raw-output '.Account')

BASE_VENDOR            := dwchiang
BASE_PROJECT           := nginx-php-fpm
BASE_VENDOR_PROJECT    := $(BASE_VENDOR)/$(BASE_PROJECT)

ECR_URL                := $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com
ECR_REPO_IMAGE_LATEST  := $(ECR_URL)/$(APP_IMAGE_NAME)-$(ENV_TYPE):latest
ECR_REPO_IMAGE_HASH    := $(ECR_URL)/$(APP_IMAGE_NAME)-$(ENV_TYPE):$(GIT_COMMIT_HASH)

ECR_URL_CN             := $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com.cn

help:
	@ echo 'Welcome to Makefile of my-laravel-on-aws-ecs-workshop Section 5'
	@ echo
	@ echo 'Usage: make [command]'
	@ echo
	@ echo 'Available Commands:'
	@ echo '  version          Check version info'
	@ echo '  build            Build Laravel docker image'
	@ echo '  run              Run the container'
	@ echo

version:
	@ echo '{'
	@ echo '  "GIT_COMMIT_HASH":       "$(GIT_COMMIT_HASH)",'
	@ echo '  "VERSION_PHP_FPM":       "$(VERSION_PHP_FPM)"'
	@ echo '  "VERSION_PHP_FPM_MINOR": "$(VERSION_PHP_FPM_MINOR)"'
	@ echo '  "VERSION_NGINX":         "$(VERSION_NGINX)"'
	@ echo '  "VERSION_OS":            "$(VERSION_OS)"'
	@ echo '  "VERSION":               "$(VERSION)"'
	@ echo '  "BASE_VENDOR_PROJECT":   "$(BASE_VENDOR_PROJECT)"'
	@ echo '  "APP_IMAGE_NAME":        "$(APP_IMAGE_NAME)"'
	@ echo '  "APP_REPO_NAME":         "$(APP_REPO_NAME)"'
	@ echo '  "ECR_REPO_IMAGE_LATEST": "$(ECR_REPO_IMAGE_LATEST)"'
	@ echo '  "ECR_REPO_IMAGE_HASH":   "$(ECR_REPO_IMAGE_HASH)"'
	@ echo '}'

build: version
	@ echo '[] Building Laravel docker image...'

	time docker build \
	--build-arg VERSION="${VERSION}" \
	--build-arg VERSION_PHP_FPM_MINOR="${VERSION_PHP_FPM_MINOR}" \
	--build-arg ENV_TYPE="${ENV_TYPE}" \
	-f Dockerfile \
	-t $(APP_IMAGE_NAME):latest .

	docker tag $(APP_IMAGE_NAME):latest $(APP_IMAGE_NAME):$(VERSION)

	docker images

publish: version
	@ echo ''
	@ echo '[] Login AWS ECR & create repositories ...'
	@ echo '     - Using AWS_DEFAULT_PROFILE'
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_URL)
	aws ecr describe-repositories --repository-names $(APP_REPO_NAME) --region $(AWS_REGION) && ([ $$? -eq 0 ] && echo "REPO EXIST :) ") || aws ecr create-repository --repository-name $(APP_REPO_NAME) --region $(AWS_REGION)

	@ echo ''
	@ echo '[] Adding tags for AWS ECR ...'
	docker tag $(APP_IMAGE_NAME):latest      $(ECR_REPO_IMAGE_LATEST)
	docker tag $(APP_IMAGE_NAME):latest      $(ECR_REPO_IMAGE_HASH)

	@ echo ''
	@ echo '[] Pushing images into AWS ECR ...'
	docker push $(ECR_REPO_IMAGE_LATEST)
	docker push $(ECR_REPO_IMAGE_HASH)

run: version
	@ echo '[] Running my-laravel-on-aws-ecs-workshop docker container...'

	docker run --cpus=1 --memory=512m -p 8080:80 $(APP_IMAGE_NAME):latest