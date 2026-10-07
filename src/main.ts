import schedule from 'node-schedule';

export function main() 
{
    // 3. Schedule for Sunday at 7:45 PM (15 minutes before 8:00 PM)
    // Cron format: minute hour day-of-month month day-of-week
    const rule = '45 19 * * 0'; 

    const job = schedule.scheduleJob('sunday-drop-cron', rule, () => {
        console.log(`Scheduled job: ${ job.name } completed.`);
        //todo: logic to accumulate selected users to notify for payment.
        //sendTargetedEmails();
    });

    console.log(`Scheduled job: ${ job.name } initiated.`);
}