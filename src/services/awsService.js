const AWS = require("aws-sdk");
const dotenv = require("dotenv");
dotenv.config();

const region = process.env.AWS_REGION;

const sqs = new AWS.SQS({ region });
const docClient = new AWS.DynamoDB.DocumentClient({ region });
const cwevents = new AWS.CloudWatchEvents({ region });
const lambda = new AWS.Lambda({ region });
const s3 = new AWS.S3({ region });

module.exports = {
    sqs: {
        sendMessage: async (queueURL, body) => {

            const params = {
                QueueUrl: queueURL,
                MessageBody: body
            };

            const req = sqs.sendMessage(params);

            return req.promise();
        },
        getMessages: async (queueURL) => {

            const params = {
                QueueUrl: queueURL
            };

            const req = sqs.receiveMessage(params);

            return req.promise();
        },

        deleteMessage: async (QueueUrl, ReceiptHandle) => {
            const params = {
                QueueUrl,
                ReceiptHandle
            };

            const req = sqs.deleteMessage(params);

            return req.promise();
        }
    },

    dynamodb: {
        putItem: async (tableName, item) => {

            const params = {
                TableName: tableName,
                Item: item
            };

            const req = docClient.put(params);

            return req.promise();
        },
        queryItems: async (TableName,
            FilterExpression,
            ExpressionAttributeNames,
            ExpressionAttributeValues) => {

            const params = {
                TableName,
                FilterExpression,
                ExpressionAttributeNames,
                ExpressionAttributeValues
            };

            const req = docClient.scan(params);

            return req.promise();
        },
        updateItem: async (TableName,
            Key,
            UpdateExpression,
            ExpressionAttributeValues,
            ReturnValues) => {

            const params = {
                TableName,
                Key,
                UpdateExpression,
                ExpressionAttributeValues,
                ReturnValues
            };

            const req = docClient.update(params);

            return req.promise();
        }
    },
    cloudWatchEvents: {
        putRule: async (Name, ScheduleExpression, State) => {

            const params = {
                Name,
                ScheduleExpression,
                State
            };

            const req = cwevents.putRule(params);

            return req.promise();
        },
        putTargets: async (Rule, Targets) => {

            const params = {
                Rule,
                Targets
            };

            const req = cwevents.putTargets(params);

            return req.promise();
        }
    },
    lambda: {
        addPermission: async (Action, FunctionName, Principal, SourceArn, StatementId) => {

            var params = {
                Action,
                FunctionName,
                Principal,
                SourceArn,
                StatementId
            };

            const req = lambda.addPermission(params);

            return req.promise();
        }
    },

    s3: {
        uploadFile: async (Bucket, Key, File) => {

            var params = {
                Bucket, Key, File
            };

            const req = s3.upload(params);

            return req.promise();
        }
    }
};