import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as logs from '@aws-cdk/aws-logs';
import * as ssm from '@aws-cdk/aws-ssm';
import * as kms from '@aws-cdk/aws-kms';
import { CfnOutput } from '@aws-cdk/core';
import { AwsLogDriver } from '@aws-cdk/aws-ecs';
import { env } from 'process';
// import { env } from 'process';

//---------------------------------------------------------------------------
// Environment Variables
const deploymentEnv = {
  type: process.env.THIS_DEPLOYMENT_ENV || "",
  namespace: process.env.THIS_DEPLOYMENT_NAMESPACE || "",
  domainName: process.env.THIS_DEPLOYMENT_DOMAINNAME || "",
  logStreamPrefix: process.env.THIS_LOG_STREAM_PREFIX || "",
  ecrRepoName: process.env.THIS_ECR_REPO_NAME || "",
  appName: process.env.APP_NAME || "",
  kmsKeyId: process.env.THIS_AWS_KMS_KEY_ID || "",
};

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function generateName(name: string) {
  return capitalizeFirstLetter(deploymentEnv.type) + capitalizeFirstLetter(deploymentEnv.namespace) + name;
}

function getFromSsmParameterStoreString(scope: cdk.Construct, paramName: string) {
  return ssm.StringParameter.fromStringParameterName(
    scope, 
    generateName('Ssm' + paramName), 
    '/' + deploymentEnv.type + '/' + deploymentEnv.appName + '/' + paramName
  );
}

function ecsValueFromSsmParameterString(scope: cdk.Construct, paramName: string) {
  return ecs.Secret.fromSsmParameter(getFromSsmParameterStoreString(scope, paramName));
}

function ecsValueFromSsmParameterSecureString(scope: cdk.Construct, paramName: string, key: kms.IKey) {
  const paramVersion = cdk.Token.asNumber(getFromSsmParameterStoreString(scope, paramName+'ver'));

  return ecs.Secret.fromSsmParameter(ssm.StringParameter.fromSecureStringParameterAttributes(
    scope, 
    generateName('Ssm' + paramName), 
    {
      parameterName: '/' + deploymentEnv.type + '/' + deploymentEnv.appName + '/' + paramName,
      encryptionKey: key,
      version: paramVersion,
    }));
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

    const ecrRepo = ecr.Repository.fromRepositoryName(this, 'DefaultRepo', deploymentEnv.ecrRepoName);

    const kmsKey = kms.Key.fromKeyArn(
      this, 
      generateName('kmsKey'), 
      'arn:aws:kms:' + props?.env?.region + ':' + props?.env?.account + ':key/' + deploymentEnv.kmsKeyId
    );

    const container = ec2TaskDefinition.addContainer('defaultContainer', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo), 
      memoryLimitMiB: 512,
      cpu: 256,
      logging: new ecs.AwsLogDriver({
        streamPrefix: deploymentEnv.logStreamPrefix,
        logRetention: logs.RetentionDays.SIX_MONTHS,
      }),
      secrets: { // Retrieved from AWS Secrets Manager or AWS Systems Manager Parameter Store at container start-up.
        'APP_NAME'          : ecsValueFromSsmParameterString(this, 'APP_NAME'),
        'APP_ENV'           : ecsValueFromSsmParameterString(this, 'APP_ENV'),
        'APP_KEY'           : ecsValueFromSsmParameterSecureString(this, 'APP_KEY', kmsKey),
        'APP_DEBUG'         : ecsValueFromSsmParameterString(this, 'APP_DEBUG'),
        'APP_URL'           : ecsValueFromSsmParameterString(this, 'APP_URL'),

        'LOG_CHANNEL'       : ecsValueFromSsmParameterString(this, 'LOG_CHANNEL'),

        'DB_CONNECTION'     : ecsValueFromSsmParameterString(this, 'DB_CONNECTION'),
        'DB_HOST'           : ecsValueFromSsmParameterString(this, 'DB_HOST'),
        'DB_PORT'           : ecsValueFromSsmParameterString(this, 'DB_PORT'),
        'DB_DATABASE'       : ecsValueFromSsmParameterString(this, 'DB_DATABASE'),
        'DB_USERNAME'       : ecsValueFromSsmParameterSecureString(this, 'DB_USERNAME', kmsKey),
        'DB_PASSWORD'       : ecsValueFromSsmParameterSecureString(this, 'DB_PASSWORD', kmsKey),

        'BROADCAST_DRIVER'  : ecsValueFromSsmParameterString(this, 'BROADCAST_DRIVER'),
        'CACHE_DRIVER'      : ecsValueFromSsmParameterString(this, 'CACHE_DRIVER'),
        'QUEUE_CONNECTION'  : ecsValueFromSsmParameterString(this, 'QUEUE_CONNECTION'),
        'SESSION_DRIVER'    : ecsValueFromSsmParameterString(this, 'SESSION_DRIVER'),
        'SESSION_LIFETIME'  : ecsValueFromSsmParameterString(this, 'SESSION_LIFETIME'),

        'REDIS_HOST'        : ecsValueFromSsmParameterString(this, 'REDIS_HOST'),
        'REDIS_PASSWORD'    : ecsValueFromSsmParameterSecureString(this, 'REDIS_PASSWORD', kmsKey),
        'REDIS_PORT'        : ecsValueFromSsmParameterString(this, 'REDIS_PORT'),

        'MAIL_DRIVER'       : ecsValueFromSsmParameterString(this, 'MAIL_DRIVER'),
        'MAIL_HOST'         : ecsValueFromSsmParameterString(this, 'MAIL_HOST'),
        'MAIL_PORT'         : ecsValueFromSsmParameterString(this, 'MAIL_PORT'),
        'MAIL_USERNAME'     : ecsValueFromSsmParameterSecureString(this, 'MAIL_USERNAME', kmsKey),
        'MAIL_PASSWORD'     : ecsValueFromSsmParameterSecureString(this, 'MAIL_PASSWORD', kmsKey),
        'MAIL_ENCRYPTION'   : ecsValueFromSsmParameterString(this, 'MAIL_ENCRYPTION'),
        'MAIL_FROM_ADDRESS' : ecsValueFromSsmParameterString(this, 'MAIL_FROM_ADDRESS'),
        'MAIL_FROM_NAME'    : ecsValueFromSsmParameterString(this, 'MAIL_FROM_NAME'),
        
        'ZZZ_KEY'           : ecsValueFromSsmParameterSecureString(this, 'ZZZ_KEY', kmsKey),
      },      
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
