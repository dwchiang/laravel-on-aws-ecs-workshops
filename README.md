# Workshops: Running Laravel on AWS ECS

These workshops assume that we will have multiple workloads on both production and staging environments. We will achieve this goal step by step, section by section.

# Highlights

- We will use as [latest Laravel LTS version](https://github.com/laravel/laravel/releases) as possible. We will use Laravel [v6.18.35](https://github.com/laravel/laravel/releases/tag/v6.18.35) at the moment.
- Using [dwchiang/nginx-php-fpm](https://hub.docker.com/r/dwchiang/nginx-php-fpm) as the docker base image to simplify the container configuration works and make us focusing on the Laravel application-first.

---

# Preparations

Please well prepare the preparations before attending the workshop.

- [ ] Having an AWS Root Account, or an IAM user with `AdministratorAccess` policy.
  - Check: AWS Access Key Id
  - Check: AWS Secret Access Key
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

- Step 1.1: Build & Running Laravel on local machine
- Step 1.2: Publish image into Amazon ECR
- Step 1.3: Deployment & Running on Amazon Fargate (ECS)
- Step 1.4: Next section or Destroy the deployment

We will do all the **Section 1** works in the folder `./section-1/`:

```
> cd section-1
```

## Step 1.1: Build & Running Laravel on local machine

Let's create a new Laravel project in the folder `./secion-1/src/`:

- You can use any version of Laravel you preferred. In this workshop, we will use the latest TLS version.

```
> composer create-project --prefer-dist laravel/laravel:6.18.35 src
```

Here is the current project folder structure in `./section-1`:

```
❯ tree --dirsfirst -L 1
.
├── cdk
├── images
├── src
├── Dockerfile
├── Makefile
├── build.sh
└── export-variables.example
```

Before our building the docker image, let's **configure** environment variables that will be used in the build. 

- Please duplicate the example file of variables from `export-variables.example` to `export-variables`, then load it by `source` command. 
- You need to edit the file `export-variables` to fit your situation. Especially the `AWS_ACCOUNT_ID` value. If you don't know your AWS Account ID, use this AWS CLI command: `aws sts get-caller-identity`.

```
> cp export-variables.example export-variables
> source export-variables
```

Now it's time to **build** the docker image:

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

- In this step, we has verified that we are able to build the laravel docker image and make it run on our local machine.
- You can stop the running container by using `docker ps` and `docker stop {CONTAINER_ID}`.

Next step, we are going to publish the image you just built into Amazon ECR (Elastic Container Registry) and deploy it to run on AWS Fargate.

## Step 1.2: Publish image into Amazon ECR

Once you can build and run the laravel container successfully on your local machine, we can publish the image into Amazon ECR (Elastic Container Registry) under your AWS Account. We will pull the image later on and deploy it on AWS Fargate to run.

- If you want to know the details of the commands, feel free to take a look at `publish` section in `Makefile` file.

```
> source export-variables
> make publish
```

You can check at Amazon ECR service in AWS Management Console.

## Step 1.3: Deployment & Running on AWS Fargate (ECS)

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
- Subnets: public x2, private x2, isolated x2
- NAT Gateways x1
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

Synth:

```
> cdk synth
```

Now, it's time to deploy :)

```
> cdk deploy

# follow the instruction on the CLI, usually need to press `y`.

...
...

Outputs:
DevSection1LaravelOnAwsWorkshopStack.DevSection1AlbDnsName = DevSe-DevSe-11AOKXxxxxxxx-1234567890.us-west-1.elb.amazonaws.com
```

Now you can test in your browser by visiting `http://DevSe-DevSe-11AOKXxxxxxxx-1234567890.us-west-1.elb.amazonaws.com/`. You will see the same Laravel page with your running on local machine.

### Learning Station

You can look around in AWS Management Console to see what resources are created by CDK:

- CloudFormation: Stacks, Events, Resources, Outputs
- ECS: Clusters, Services, Task Definitions
- VPC: Subnets, Route Tables, Internet Gateways, Elastic IPs, NAT Gateways, Network ACL, Security Groups
- EC2: Load Balancers, Listeners, Target Groups

## Step 1.4: Next section or Destroy the deployment

You did a great job! Let's heading to Section 2!

If you want to take a rest for now, please remember to destory the deployment of Section 1 by using:

```
> cdk destroy
```

You can double check if all the resources are cleaned up by visiting CloudFormation service in AWS Management Console with the same AWS Region you assigned in AWS CLI.