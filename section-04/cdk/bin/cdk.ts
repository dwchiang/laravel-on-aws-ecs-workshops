#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { LaravelOnAwsWorkshopStack } from '../lib/cdk-stack';

//---------------------------------------------------------------------------
// Environment Variables
const env = {
    region: process.env.CDK_DEFAULT_REGION || "",
    account: process.env.CDK_DEFAULT_ACCOUNT || "",
};

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

//---------------------------------------------------------------------------
// Main
if ((deploymentEnv.type !== "")
    && (deploymentEnv.namespace !== "")
    && (deploymentEnv.domainName !== "")
    ) {

    const app = new cdk.App();
    new LaravelOnAwsWorkshopStack(app, generateName('LaravelOnAwsWorkshopStack'), { env });
    app.synth();

} else {
    if (deploymentEnv.type === "") console.log("[] Please `export THIS_DEPLOYMENT_ENV=` within your shell.\n");
    if (deploymentEnv.namespace === "") console.log("[] Please `export THIS_DEPLOYMENT_NAMESPACE=` within your shell.\n");
    if (deploymentEnv.domainName === "") console.log("[] Please `export THIS_DEPLOYMENT_DOMAINNAME=` within your shell.\n");

    process.exit(1);
}