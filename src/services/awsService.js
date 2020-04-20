const AWS = require("aws-sdk");
const sqs = new AWS.SQS({ region: "us-east-1" });
const docClient = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

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
    }
};