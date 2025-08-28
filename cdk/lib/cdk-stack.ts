import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as iam from 'aws-cdk-lib/aws-iam';

interface Props extends StackProps {
  appOrigins: string[];           // allowed CORS origins (dev/prod)
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: Props) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const bucket = new s3.Bucket(this, 'NextAppBucket', {
      versioned: true,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [{
        allowedOrigins: ["http://localhost:3000"],
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
        allowedHeaders: ['*'],
        exposedHeaders: ['ETag'],
        maxAge: 3000,
      }]
    })

    const userPool = new cognito.UserPool(this, 'NextAppUserPool', {
      userPoolName: 'Next-App-Pool',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      standardAttributes: { email: { required: true, mutable: false }},
      passwordPolicy: { minLength: 8, requireDigits: true, requireUppercase: true, requireSymbols: true},
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })

    const userPoolClient = userPool.addClient("WebClient", {
      generateSecret: false,
      authFlows: { userSrp: true, userPassword: true},
      oAuth: {
        flows: { authorizationCodeGrant: true},
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: props?.appOrigins.map(x => `${x}/api/auth/callback/cognito`),
        logoutUrls: props?.appOrigins.map(x => `${x}/`),
      },
      preventUserExistenceErrors: true
    })

    const idPool = new cognito.CfnIdentityPool(this, 'Identity Pool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: userPoolClient.userPoolClientId,
        providerName: userPool.userPoolProviderName,
      }]
    })

    const role = new iam.Role(this, 'NextRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          'StringEquals': { 'cognito-identity.amazonaws.com:aud': idPool.ref},
          'ForAnyValue:StringLike': { 'cognito-identity.amazonaws.com:amr': 'authenticated' }
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    })

    // const userPrefix = 'private/${cognito-identity.amazonaws.com:sub}/*';

    role.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
      resources: [bucket.arnForObjects('uploads/*')]
    }))

    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoles', {
      identityPoolId: idPool.ref,
      roles: { authenticated: role.roleArn }
    })

    new cdk.CfnOutput(this, 'NEXT_PUBLIC_AWS_REGION', { value: cdk.Stack.of(this).region})
    new cdk.CfnOutput(this, 'NEXT_PUBLIC_S3_BUCKET', { value: bucket.bucketName });
    new cdk.CfnOutput(this, 'NEXT_PUBLIC_USER_POOL_ID', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'NEXT_PUBLIC_USER_POOL_CLIENT_ID', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'NEXT_PUBLIC_IDENTITY_POOL_ID', { value: idPool.ref });
  }
}
