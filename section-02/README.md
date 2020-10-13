# Section 2: Getting Started on EC2

# Objective

Comparing to section 1 (running on ECS Fargate launch type), we are going to run a single Laravel app on ECS EC2 launch type with a high availability architecture design. 

# Highlights

- Same with section 1.
- Changed from ECS Fargate launch type to ECS EC2 launch type.

# Architecture Overview

![](./images/architecture-diagram-section-2.png)

# Workshop

We basically will follow almost the same steps with [Section 1](../section-1) except step 2.3. We will modify our CDK script to adopt ECS EC2 launch type in this workshop.

- Step 2.1: Build & Running Laravel on local machine
- Step 2.2: Publish image into Amazon ECR
- Step 2.3: Deployment & Running on AWS ECS EC2 launch type
- Step 2.4: Next section or Destroy the deployment

We will do all the **Section 2** works in the folder `./section-02/`:

```
❯ cd section-02
```

If you just did Section 1, you can skip the step 2.1~2.2.

## Step 2.1: Build & Running Laravel on local machine

Let's create a new Laravel project in the folder `./secion-02/src/`:

- You can use any version of Laravel you preferred. In this workshop, we will use the latest TLS version.

```
❯ composer create-project --prefer-dist laravel/laravel:6.18.35 src
```

Here is the current project folder structure in `./section-02`:

```
❯ tree --dirsfirst -L 1
.
├── cdk
├── images
├── src
├── Dockerfile
├── Makefile
├── README.md
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
my-laravel-on-aws-ecs-workshop   7.4.10-fpm-2.18.0-nginx-buster       3bc757f1xxxx        1 second ago        604MB
my-laravel-on-aws-ecs-workshop   latest                               3bc757f1xxxx        1 second ago        604MB
```

If you get successfully built, then we can make it run:

```
> make run

or

> docker run --cpus=1 --memory=512m -p 8080:80 my-laravel-on-aws-ecs-workshop:latest
```

Now, you are running Laravel on a container on your local machine. Please visit this URL `http://localhost:8080/` (or `http://127.0.0.1:8080/`) in your browser.

![](./images/screenshot-laravel-homepage.png)

- In this step, we has verified that we are able to build the laravel docker image and make it run on our local machine.
- You can stop the running container by using `docker ps` and `docker stop {CONTAINER_ID}`.

Next step, we are going to publish the image you just built into Amazon ECR (Elastic Container Registry) and deploy it to run on AWS ECS EC2 lauunch type.

## Step 2.2: Publish image into Amazon ECR

Once you can build and run the laravel container successfully on your local machine, we can publish the image into Amazon ECR (Elastic Container Registry) under your AWS Account. We will pull the image later on and deploy it on AWS ECS EC2 launch type to run.

- If you want to know the details of the commands, feel free to take a look at `publish` section in `Makefile` file.

```
> source export-variables
> aws configure get laravel-on-aws-ecs-workshops.region
> make version
> make publish
```

You can check at Amazon ECR service in AWS Management Console.

![](./images/screenshot-ecr-repo.png)

## Step 2.3: Deployment & Running on AWS ECS EC2 launch type

In this step, we will plan, define and deploy our very first version of AWS infrastructure that we are going to deploy our laravel container to run on it.

If you just did Section 1, then you can relax :) This architecture is almost the same with Section 1 except replacing Fargate launch type with EC2 launch type.

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

![](./images/architecture-diagram-section-2.png)

Let's get into the `./section-02/cdk` folder:

```
> cd cdk
> cp export-variables.example export-variables
```

Take a look in the file `./section-02/cdk/export-variables`. You don't need to modify this file yet for now. If you are using different AWS profile name, you can edit this file to fit in your case. Next, we are going to load the environment variables:

```
> source export-variables
```

Now, it's time to bootstrap the cdk:

```
> cdk bootstrap
 ⏳  Bootstrapping environment aws://111111111111/us-west-2...
CDKToolkit: creating CloudFormation changeset...
[██████████████████████████████████████████████████████████] (3/3)

 ✅  Environment aws://111111111111/us-west-2 bootstrapped.
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
DevSection1LaravelOnAwsWorkshopStack.DevSection1AlbDnsName = DevSe-DevSe-11AOKXxxxxxxx-1234567890.us-west-2.elb.amazonaws.com
```

Now you can test in your browser by visiting `http://DevSe-DevSe-11AOKXxxxxxxx-1234567890.us-west-2.elb.amazonaws.com/`. You will see the same Laravel page with your running on local machine.

### Learning Station

You can look around in AWS Management Console to see what resources are created by CDK:

- CloudFormation: Stacks, Events, Resources, Outputs
- ECS: Clusters, Services, Task Definitions
- VPC: Subnets, Route Tables, Internet Gateways, Elastic IPs, NAT Gateways, Network ACL, Security Groups
- EC2: Load Balancers, Listeners, Target Groups

## Step 2.4: Next section or Destroy the deployment

You did a great job! Let's heading to Section 3!

If you want to take a rest for now, please remember to destory the deployment of this section by using:

```
> cdk destroy
```

You can double check if all the resources are cleaned up by visiting CloudFormation service in your AWS Management Console with the same AWS Region you assigned in AWS CLI.

[TODO] Clean up ECR repo

# Reference

- Study Notes: [Amazon Elastic Container Service (Amazon ECS)](https://www.ernestchiang.com/en/notes/aws/ecs/) 
- Study Notes: [AWS Cloud Development Kit (AWS CDK)](https://www.ernestchiang.com/en/notes/aws/cdk/)