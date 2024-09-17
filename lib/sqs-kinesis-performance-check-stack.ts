import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_sqs as sqs,
} from 'aws-cdk-lib';

export class SqsKinesisPerformanceCheckStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


      // -----------------------------------------------
      //  SQS
      // -----------------------------------------------
      const queue = new sqs.Queue(this, `MyQueue`, {
          queueName: `MyQueue.fifo`,
          fifo: true,
          contentBasedDeduplication: true,
      });

      // -----------------------------------------------
      // Network
      // -----------------------------------------------
      // VPC
      const vpc = new ec2.Vpc(this, `sqs-performance-validation-vpc`, {
          vpcName: `sqs-performance-validation-vpc`,
          ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
          maxAzs: 1,
          natGateways: 0,
          subnetConfiguration: [{
              name: "public",
              subnetType: ec2.SubnetType.PUBLIC,
              cidrMask: 24,
          }],
      });

      // -----------------------------------------------
      // EC2
      // -----------------------------------------------

      // IAM Policy and Role for EC2
      const sqsSnsFullAccessPolicy = new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
              'sns:*',
              'sqs:*',
          ],
          resources: [
              queue.queueArn,
          ],
      })

      const ec2Role = new iam.Role(this, 'MyEC2Role', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        })
      ec2Role.addToPolicy(sqsSnsFullAccessPolicy);
        // EC2 Host
      const ec2Instance = new ec2.Instance(this, 'ec2-instance', {
          vpc,
          instanceName: 'SqsPubSubHost',
          instanceType: new ec2.InstanceType('t2.micro'),
          machineImage: ecs.EcsOptimizedImage.amazonLinux2023(),
          role: ec2Role,
          keyName: 'sqs-go-linkage',
          associatePublicIpAddress: true,
      });
      ec2Instance.connections.securityGroups[0].addIngressRule(
        ec2.Peer.ipv4('0.0.0.0/0'),
        ec2.Port.tcp(22),
        'Allow SSH traffic from Internet Gateway'
      );
      ec2Instance.addUserData(
          'dnf update -y && dnf upgrade -y && \
          dnf install -y git && \
          echo "complete -C /usr/bin/aws_completer aws" >> /home/ec2-user/.bashrc && \
          git clone https://github.com/awayatakuma/sqs-go-linkage.git  /home/ec2-user/sqs-go-linkage && \
          chmod 777 -R /home/ec2-user/sqs-go-linkage && \
          mkdir -p /usr/local/lib/docker/cli-plugins && \
          curl -SL https://github.com/docker/compose/releases/download/v2.4.1/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose && \
          chmod +x /usr/local/lib/docker/cli-plugins/docker-compose'
      );
    }

  }
