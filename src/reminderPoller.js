const awsSvc = require("./services/awsService.js");
const botHelper = require("./botHelper.js");

module.exports = () => {
  
  const {REMINDERS_QUEUE_URL, POLL_INTERVAL} = process.env;

  async function pollSqsQueueAndSendReminders() {
    
    console.log("polling reminders...");
    
    const getMessagesResp = await awsSvc.sqs
              .getMessages(REMINDERS_QUEUE_URL);

    const messages = getMessagesResp.Messages;

    if(messages) 
      console.log(messages);

    if(messages && messages.length > 0){

        messages.forEach(async message=>{

            const reminder = JSON.parse(message.Body);
            console.log("Sending reminder: " + reminder.body);
            await botHelper.sendReminderToUser(reminder);
            await awsSvc.sqs.deleteMessage(REMINDERS_QUEUE_URL, message.ReceiptHandle);
        });        
    }
  }
  
  setInterval(pollSqsQueueAndSendReminders, parseInt(POLL_INTERVAL));
}