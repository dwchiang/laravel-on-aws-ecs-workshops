import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as logs from '@aws-cdk/aws-logs';
import { CfnOutput } from '@aws-cdk/core';
import { AwsLogDriver } from '@aws-cdk/aws-ecs';

//---------------------------------------------------------------------------
// Environment Variables
const deploymentEnv = {
  type: process.env.THIS_DEPLOYMENT_ENV || "",
  namespace: process.env.THIS_DEPLOYMENT_NAMESPACE || "",
  domainName: process.env.THIS_DEPLOYMENT_DOMAINNAME || "",
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
    const asg = ecsCluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      maxCapacity: 4,
      minCapacity: 2,
    });

    // TODO: T4g

    // Task Definition
    const ec2TaskDefinition = new ecs.Ec2TaskDefinition(this, 'DefaultTaskDef');

    const ecrRepo = ecr.Repository.fromRepositoryName(this, 'DefaultRepo', 'my-laravel-on-aws-ecs-workshop-dev');

    const container = ec2TaskDefinition.addContainer('defaultContainer', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo), 
      memoryLimitMiB: 512,
      cpu: 256,
      logging: new ecs.AwsLogDriver({
        streamPrefix: 'MyLaravel',
        logRetention: logs.RetentionDays.SIX_MONTHS,
      }),
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP
    });

    // ECS Service
    const ecsService = new ecs.Ec2Service(this, 'DefaultService', {
      cluster: ecsCluster,
      taskDefinition: ec2TaskDefinition,
      desiredCount: 2,
    });

    //---------------------------------------------------------------------------
    // Cert
    const domainAlternativeName = '*.' + deploymentEnv.domainName;
    const cert = new acm.Certificate(this, generateName('Cert'), {
      domainName: deploymentEnv.domainName,
      subjectAlternativeNames: [domainAlternativeName],
      validation: acm.CertificateValidation.fromDns(), // Records must be added manually
    });

    //---------------------------------------------------------------------------
    // ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, generateName('ALB'), {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener('Listener', {
      open: true,
      certificates: [cert],
      protocol: elbv2.ApplicationProtocol.HTTPS,
    });

    // Connect ecsService to TargetGroup
    const targetGroup = listener.addTargets(generateName('LaravelTargetGroup'), {
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [ecsService]
    });

    new cdk.CfnOutput(this, generateName('AlbDnsName'), {
      exportName: generateName('AlbDnsName'),
      value: alb.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, generateName('ActionCname'), {
      exportName: generateName('ActionCname'),
      value: 'Please setup a CNAME record mylaravel.' + deploymentEnv.domainName + ' to ' + alb.loadBalancerDnsName,
    });    

    new cdk.CfnOutput(this, generateName('ActionVisit'), {
      exportName: generateName('ActionVisit'),
      value: 'Visit https://mylaravel.' + deploymentEnv.domainName,
    });      

    //---------------------------------------------------------------------------
    // ecsService: Application Auto Scaling    
    const scaling = ecsService.autoScaleTaskCount({ 
      minCapacity: 2,
      maxCapacity: 10 
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50
    });
    
    scaling.scaleOnRequestCount('RequestScaling', {
      requestsPerTarget: 30,
      targetGroup: targetGroup
    });
  }
}
