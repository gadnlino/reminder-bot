const dotenv = require("dotenv");
dotenv.config();

const {
    TELEGRAM_TOKEN,
    APP_URL,
    PERSISTENCE_QUEUE_URL,
    REMINDERS_BOT_TABLE,
    AWS_REGION,
    RUNNING_LOCALLY,
    PORT,
    REMINDERS_LAMBDA_NAME,
    REMINDERS_LAMBDA_ARN,
    REMINDERS_QUEUE_URL,
    POLL_INTERVAL,
    PROJECT_REPO_URL,
    SUBSCRIPTIONS_TABLE_NAME,
    EMAIL_QUEUE_URL
} = process.env;

module.exports = {
    telegramToken: TELEGRAM_TOKEN,
    appUrl: APP_URL,
    persistenceQueueUrl: PERSISTENCE_QUEUE_URL,
    remindersTableName: REMINDERS_BOT_TABLE,
    awsRegion: AWS_REGION,
    polling: RUNNING_LOCALLY === "true",
    port: PORT,
    remindersLambdaName: REMINDERS_LAMBDA_NAME,
    remindersLambdaName: REMINDERS_LAMBDA_ARN,
    remindersQueueUrl: REMINDERS_QUEUE_URL,
    pollInterval: POLL_INTERVAL,
    projectRepo: PROJECT_REPO_URL,
    subscriptionsTableName: SUBSCRIPTIONS_TABLE_NAME,
    emailQueueUrl: EMAIL_QUEUE_URL
}

