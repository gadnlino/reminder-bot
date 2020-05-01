const awsSvc = require("./services/awsService.js");
const botHelper = require("./botHelper.js");

module.exports = () => {
  
  async function pollSqsQueueAndSendReminders(queueUrl) {
    
    console.log("polling reminders...");
    
    const getMessagesResp = await awsSvc.sqs.getMessages(queueUrl);

    const messages = getMessagesResp.Messages;

    if(messages && messages.length > 0){

        messages.forEach(message=>{

            const reminder = JSON.parse(message.Body);

            botHelper.sendReminder(reminder);
        });
    }
  }

  const {REMINDERS_QUEUE_URL} = process.env;

  setInterval(()=> pollSqsQueueAndSendReminders(REMINDERS_QUEUE_URL), 5000);
}