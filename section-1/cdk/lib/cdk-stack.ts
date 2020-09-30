import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import { CfnOutput } from '@aws-cdk/core';

//---------------------------------------------------------------------------
// Environment Variables
const deploymentEnv = {
  type: process.env.THIS_DEPLOYMENT_ENV || "",
  namespace: process.env.THIS_DEPLOYMENT_NAMESPACE || "",
};

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function generateName(name: string) {
  return capitalizeFirstLetter(deploymentEnv.type) + capitalizeFirstLetter(deploymentEnv.namespace) + name;
}

export class LaravelOnAwsWorkshopStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    //---------------------------------------------------------------------------
    // VPC
    const vpc = new ec2.Vpc(this, generateName('VPC'), {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: generateName('ingress'),
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: generateName('application'),
          subnetType: ec2.SubnetType.PRIVATE,
        },
        {
          cidrMask: 24,
          name: generateName('database'),
          subnetType: ec2.SubnetType.ISOLATED,
        },
      ],
    });

    //---------------------------------------------------------------------------
    // ECS

    // ECS Cluster
    const ecsCluster = new ecs.Cluster(this, 'LaravelWorkshopCluster', {
      vpc: vpc
    });

    // Task Definition
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, 'DefaultTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256
    });

    const ecrRepo = ecr.Repository.fromRepositoryName(this, 'DefaultRepo', 'my-laravel-on-aws-ecs-workshop-dev');

    const container = fargateTaskDefinition.addContainer('defaultContainer', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo), 
      memoryLimitMiB: 256,
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP
    });

    // ECS Service
    const ecsService = new ecs.FargateService(this, 'DefaultService', {
      cluster: ecsCluster,
      taskDefinition: fargateTaskDefinition,
      desiredCount: 2,
    });

    //---------------------------------------------------------------------------
    // ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, generateName('ALB'), {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener('Listener', {
      port: 80,
      open: true,
    });

    // Connect ecsService to TargetGroup
    const targetGroup = listener.addTargets(generateName('LaravelTargetGroup'), {
      port: 80,
      targets: [ecsService]
    });

    new cdk.CfnOutput(this, generateName('AlbDnsName'), {
      exportName: generateName('AlbDnsName'),
      value: alb.loadBalancerDnsName,
    });

    //---------------------------------------------------------------------------
    // ecsService: Application Auto Scaling    
    const scaling = ecsService.autoScaleTaskCount({ maxCapacity: 10 });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50
    });
    
    scaling.scaleOnRequestCount('RequestScaling', {
      requestsPerTarget: 30,
      targetGroup: targetGroup
    });
  }
}
