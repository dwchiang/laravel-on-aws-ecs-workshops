# Workshops: Running Laravel on AWS ECS

These workshops assume that we will have multiple workloads on both production and staging environments. We will achieve this goal step by step, section by section.

# Highlights

- We will use as [latest Laravel LTS version](https://github.com/laravel/laravel/releases) as possible. We will use Laravel [v6.18.35](https://github.com/laravel/laravel/releases/tag/v6.18.35) at the moment.
- Using [dwchiang/nginx-php-fpm](https://hub.docker.com/r/dwchiang/nginx-php-fpm) as the docker base image to simplify the container configuration works and make us focusing on the Laravel application-first.

---

# Preparations

Please well prepare the preparations before attending the workshop.

- [ ] Having an AWS Root Account.
- [ ] Having [Docker](https://docs.docker.com/get-docker/) on your local machine.
  - Check: `docker -v`
- [ ] Having [composer](https://getcomposer.org/) on your local machine.
  - Check: `composer -V`
- [ ] Having [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) on your local machine. You may use [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) to easily manage multiple versions.
  - Check: `node -v` 
  - Check: `npm -v`
  - (Optional) Check: `nvm ls`
- [ ] Having [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) installed and [configured](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html) with at least one profile name. Please create a profile named `laravel-on-aws-ecs-workshops` for this workshop.
  - Check: `~/.aws/credentials`

    ```
    [laravel-on-aws-ecs-workshops]
    aws_access_key_id = AKIAxxxxxxxxxxxxxxxx
    aws_secret_access_key =
    ```

  - Check: `~/.aws/config`

    ```
    [profile laravel-on-aws-ecs-workshops]
    region = us-west-1
    output = json
    cli_pager =
    ```

---

# Section 1: Getting Started

- 1.1: Build a running Laravel on local machine
- 1.2: Deploy the infra (v1) on AWS
- 1.3: Deploy a running Laravel on AWS ECS

We will do all the **Section 1** works in the folder `./section-1/`:

```
> cd section-1
```

## Step 1.1: Build a running Laravel on local machine

Let's create a new Laravel project in the folder `./secion-1/src/`:

You can use any version of Laravel you preferred. In this workshop, we will use the latest TLS version.

```
> composer create-project --prefer-dist laravel/laravel:6.18.35 src
```

Here is the project folder structure in `./section-1`:

```
❯ tree -L 1
.
├── Dockerfile
└── src

1 directory, 1 file
```

Before building the docker image, let's configure environment variables that will be used in the build. Please duplicate the example file of variables from `export-variables.example` to `export-variables`. 

You need to edit the file `export-variables` to fit your situation. Especially the `AWS_ACCOUNT_ID` value. If you don't know your AWS Account ID, use this AWS CLI command: `aws sts get-caller-identity`.

```
> cp export-variables.example export-variables
```


Let's build the docker image:

```
> ./build.sh

...
...

Successfully built 3bc757f1xxxx
Successfully tagged my-laravel-on-aws-ecs-workshop:latest

REPOSITORY                       TAG                                  IMAGE ID            CREATED             SIZE
my-laravel-on-aws-ecs-workshop   7.4.10-fpm-1.18.0-nginx-buster       3bc757f1xxxx        1 second ago        604MB
my-laravel-on-aws-ecs-workshop   latest                               3bc757f1xxxx        1 second ago        604MB
```

If you get successfully built, then we can make it run:

```
> make run

or

> docker run --cpus=1 --memory=512m -p 8080:80 my-laravel-on-aws-ecs-workshop:latest
```

Now, you are running Laravel on a container on your local machine. Please visit this URL `http://localhost:8080/` (or `http://127.0.0.1:8080/`) in your browser.

In this step, we verify that we are able to build the laravel docker image and make it run on our local machine.

You can stop the running container by using `docker ps` and `docker stop {CONTAINER_ID}`.

## Step 1.2: Deploy the infra (v1) on AWS

In this step, we will plan, define and deploy our very first version of AWS infrastructure that we are going to deploy our laravel container to run on it.

The deployment tool we are going to use is [AWS CDK](https://aws.amazon.com/cdk/) (AWS Cloud Development Kit). We can define cloud infrastructure using familiar programming languages. Ernest (AWS Community Hero) wrote a [study notes about AWS CDK](https://www.ernestchiang.com/en/notes/aws/cdk/), have a quick read if you are interested in knowing more details.

There are couple AWS services we will include in our v1 infra:

- [Region](https://aws.amazon.com/about-aws/global-infrastructure/)
- [AZ](https://aws.amazon.com/about-aws/global-infrastructure/) (Availability Zone)
- [VPC](https://aws.amazon.com/vpc/) (Virtual Private Cloud)
- [Subnet](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Subnets.html)
- [ALB](https://aws.amazon.com/elasticloadbalancing/) (Application Load Balancer)

To make this workshop as simple as possible, we will go with all the services with a minimum count:

- Region x1
- AZ x2
- VPC x1
- Subnets: public x2
- ALB x1 (requires 2 subnets in 2 different AZ)

So that we can focus on our application first, and extend each services from one to multiple in the later sections to have high availability and so on.

![](./section-1/images/architecture-diagram-section-1.png)

Let's get into the `./section-1/cdk` folder:

```
> cd cdk
```

Take a look in the file `./section-1/cdk/export-variables.txt`. You don't need to modify this file yet for now. If you are using different AWS profile name, you can edit this file to fit in your case. Next, we are going to load the environment variables:

```
> source export-variables
```

Now, it's time to bootstrap the cdk:

```
> cdk bootstrap
 ⏳  Bootstrapping environment aws://111111111111/us-west-1...
CDKToolkit: creating CloudFormation changeset...
[██████████████████████████████████████████████████████████] (3/3)

 ✅  Environment aws://111111111111/us-west-1 bootstrapped.
```

## Step 1.3: Deploy a running Laravel on AWS ECS

TBD
