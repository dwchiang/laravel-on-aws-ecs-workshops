# Workshops: Running Laravel on AWS ECS

These workshops assume that we will have multiple workloads on both production and staging environments. We will achieve this goal step by step, section by section.

[Amazon Elastic Container Service](https://www.ernestchiang.com/en/notes/aws/ecs/) (Amazon ECS) allows us to easily run, scale, and secure Docker container applications on AWS, which is very suitable for a developer or a team lacking of dedicated time to take care about infrastructure.

---

# Highlights

- We will use as [latest Laravel LTS version](https://github.com/laravel/laravel/releases) as possible. We will use Laravel [v6.18.35](https://github.com/laravel/laravel/releases/tag/v6.18.35) at the moment.
- Using [dwchiang/nginx-php-fpm](https://hub.docker.com/r/dwchiang/nginx-php-fpm) as the docker base image to simplify the container configuration works and make us focusing on the Laravel application-first.
- Using [AWS CDK](https://www.ernestchiang.com/en/notes/aws/cdk/) to define our own cloud infrastructure as code (IaC) in a programming language.
- Finish all the workshop preparations in less than 5 minutes.

---

# Preparations

The workshop includes multiple elements across local development environment, cloud environment, Laravel configurations and more. To make sure we enjoy all the core knowledge content of the workshop, please **finish** the [Preparations](docs/Preparations.md) section before attending the workshop. 

No worries, it just take less than 5 minutes :)

---

# Agenda

You don't need to know or learn about AWS ECS, EC2, Fargate, or even CDK before our diving deeper, you can still enjoy the getting started sections. You only need to have an AWS account or an IAM account. We will guide you to know each parts of this architecture in the later sections.

The first two sections is getting to know there are two launch types in Amazon ECS:

- Section 1: [Getting Started on ECS Fargate Launch Type](section-01)
- Section 2: [Getting Started on ECS EC2 Launch Type](section-02)

Then we move on to introduce fundamental requirements for running a Laravel service on Amazon ECS:

- Section 3: [Prepare a project repository](section-03)
- Section 4: [Using AWS Certificate Manager (ACM) to deploy SSL/TLS certificates](section-04)
- Section 5: [Enable Laravel Logging](section-05)
- Section 6: [Handling Environment Variables](section-06)

---

# Videos

## English

- WIP

## Chinese

- 2020-11-05: [Workshop: Running Laravel on Amazon ECS Part 1](https://youtu.be/ZT5vUcwaXjo) (Section 1 and Section 2), PahudDev X ErnestChiang, Online LIVE.

---

# Architecture Overview

The workshops will go through from **running single app on Fargate** to **multiple apps on ECS Capacity Provider across Fargate and EC2 launch types** by using AWS CDK to define our own cloud infrastructure as code (IaC).

## Section 1: Getting Started on ECS Fargate Launch Type

Running single app on ECS Fargate launch type with a high availability design.

![](./section-01/images/architecture-diagram-section-1.png)

## Section 2: Getting Started on ECS EC2 Launch Type

Running single app on ECS EC2 launch type with a high availability design.

![](./section-02/images/architecture-diagram-section-2.png)

## Section 4: Using AWS Certificate Manager (ACM) to deploy SSL/TLS certificates

Have SSL/TLS connection is the basic implementation nowadays.

![](./section-04/images/architecture-diagram-section-4.png)

## Section 5: Enable Laravel Logging

Direct Laravel logs in the container to Amazon CloudWatch Logs.

![](./section-05/images/architecture-diagram-section-5.png)

## Section 6: Handling Environment Variables

Bridging Laravel `.env` file, ECS Container Definition `valueFrom` and AWS SSM Parameter Store to load environment variables.

![](./section-06/images/architecture-diagram-section-6.png)


