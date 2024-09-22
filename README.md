# cdk-sqs-kinesis-performance-check

## Prerequirements

This application uses ssh and its key when you access to EC2 instances. Please prepare these keys by yourself and modify the key name in `keyName` parameter in `ec2.instance`.


## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
