const awsSvc = require("./services/awsService.js");
const uuid = require("uuid");
const { default: Axios } = require('axios');
const config = require("./config.js");

async function getUserEmail(username, from_id) {
  let items;

  const getByUsername = async (username) => {
    return await awsSvc.dynamodb.queryItems(
      config.subscriptionsTableName,
      "#id = :value",
      { "#id": "username" },
      { ":value": username }
    );
  }

  const getByFromId = async (from_id) => {
    return await awsSvc.dynamodb.queryItems(
      config.subscriptionsTableName,
      "#id = :value",
      { "#id": "from_id" },
      { ":value": from_id }
    );
  }

  if (username) {

    const queryResp = await getByUsername(username);

    const resp = queryResp.Items.length === 0 ? await getByFromId(from_id) : queryResp;

    items = resp.Items;
  }
  else {

    const queryResp = await getByFromId(from_id);

    items = queryResp.Items;
  }

  if (items.length === 0)
    return null;

  return items[0].email;
}

module.exports = {

  persistReminder: async (reminder) => {
    const {
      data,
      assunto,
      username,
      from_id,
      chat_id,
      file_path
    } = reminder;

    try {
      await awsSvc.sqs.sendMessage(config.persistenceQueueUrl,
        JSON.stringify({
          body: assunto,
          creation_date: new Date().toISOString(),
          reminder_date: data.toISOString(),
          dismissed: false,
          uuid: uuid.v1(),
          username,
          from_id,
          chat_id,
          file_path
        }));
    } catch (e) {
      throw e;
    }
  },

  searchReminders: async function () {
    const getMessagesResp = await awsSvc.sqs
      .getMessages(config.remindersQueueUrl);

    const messages = getMessagesResp.Messages;

    return messages && messages.map(m => ({
      reminder: JSON.parse(m.Body),
      receiptHandle: m.ReceiptHandle
    })) || null;
  },

  sendEmailMessage: async (options) => {
    console.log(`Sending email message: ${JSON.stringify(options)}`);

    const { type, parameters, recipientEmail } = options;

    await awsSvc.sqs.sendMessage(config.emailQueueUrl, JSON.stringify({
      type,
      recipientEmail,
      parameters
    }));
  },

  getUserEmail: async (username, from_id) => await getUserEmail(username, from_id),

  registerEmail: async (options) => {

    const {
      first_name,
      last_name,
      email,
      username,
      from_id,
      chat_id
    } = options;

    const items = await getUserEmail(username, from_id);

    console.log(items);

    if (items.length === 0) {

      const item = {
        "username": username || from_id,
        "email": [email],
        "first_name": first_name,
        "last_name": last_name,
        "from_id": from_id,
        "chat_id": chat_id
      };

      await awsSvc.dynamodb.putItem(config.subscriptionsTableName, item);
    }
    else if (items.length === 1) {
      const subscription = items[0];

      if (!subscription.email.includes(email)) {
        const newEmail = [...subscription.email, email];

        await awsSvc.dynamodb.updateItem(
          config.subscriptionsTableName,
          { "from_id": from_id },
          "set email = :value",
          { ":value": newEmail }
        );
      }
    }
  },

  deregisterEmail: async (username, from_id) => {

    if (username) {

      await awsSvc.dynamodb.updateItem(
        config.subscriptionsTableName,
        { "username": username },
        "set email = :value",
        { ":value": [] }
      );
    }
    else {

      await awsSvc.dynamodb.updateItem(
        config.subscriptionsTableName,
        { "from_id": from_id },
        "set email = :value",
        { ":value": [] }
      );

    }

  }
}