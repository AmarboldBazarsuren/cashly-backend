/**
 * Cron Jobs
 * БАЙРШИЛ: Cashly.mn/Backend/src/utils/cronJobs.js
 * Автомат ажиллах задгай - overdue шалгах, мэдэгдэл илгээх
 */

const cron = require('node-cron');
const Loan = require('../models/Loan');
const { 
  sendLoanDueSoonNotification, 
  sendLoanOverdueNotification,
  sendPaymentReminderNotification 
} = require('../services/notificationService');
const logger = require('./logger');

/**
 * Зээлийн overdue статус шалгах
 * Өдөр бүр 00:00 цагт ажиллана
 */
const checkOverdueLoans = cron.schedule('0 0 * * *', async () => {
  try {
    logger.info('Running overdue loans check...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Идэвхтэй зээлүүд олох
    const activeLoans = await Loan.find({
      status: { $in: ['active', 'extended'] },
      dueDate: { $lt: today }
    }).populate('user', 'phoneNumber name');

    for (const loan of activeLoans) {
      // Хоцорсон өдрийн тоо тооцох
      const daysOverdue = Math.floor((today - loan.dueDate) / (1000 * 60 * 60 * 24));
      
      loan.status = 'overdue';
      loan.daysOverdue = daysOverdue;
      loan.calculateLateFee();
      await loan.save();

      // Мэдэгдэл илгээх
      await sendLoanOverdueNotification(
        loan.user._id,
        loan._id,
        loan.remainingAmount + loan.lateFee,
        daysOverdue
      );

      logger.info(`Loan ${loan._id} marked as overdue - ${daysOverdue} days`);
    }

    logger.info(`Overdue check completed: ${activeLoans.length} loans updated`);
  } catch (error) {
    logger.error('Overdue loans check error:', error);
  }
});

/**
 * Зээл дуусахад 3 хоног үлдсэн бол мэдэгдэл илгээх
 * Өдөр бүр 09:00 цагт ажиллана
 */
const sendDueSoonReminders = cron.schedule('0 9 * * *', async () => {
  try {
    logger.info('Sending due soon reminders...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    // 3 хоногийн дараа дуусах зээлүүд
    const dueSoonLoans = await Loan.find({
      status: { $in: ['active', 'extended'] },
      dueDate: {
        $gte: today,
        $lte: threeDaysLater
      }
    }).populate('user', 'phoneNumber name');

    for (const loan of dueSoonLoans) {
      const daysLeft = Math.ceil((loan.dueDate - today) / (1000 * 60 * 60 * 24));
      
      await sendLoanDueSoonNotification(
        loan.user._id,
        loan._id,
        loan.remainingAmount,
        daysLeft
      );

      logger.info(`Due soon reminder sent: Loan ${loan._id} - ${daysLeft} days left`);
    }

    logger.info(`Due soon reminders completed: ${dueSoonLoans.length} notifications sent`);
  } catch (error) {
    logger.error('Due soon reminders error:', error);
  }
});

/**
 * Төлбөр сануулах - дуусахад 1 хоног үлдсэн
 * Өдөр бүр 10:00 цагт ажиллана
 */
const sendPaymentReminders = cron.schedule('0 10 * * *', async () => {
  try {
    logger.info('Sending payment reminders...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Маргааш дуусах зээлүүд
    const duetomorrow = await Loan.find({
      status: { $in: ['active', 'extended'] },
      dueDate: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('user', 'phoneNumber name');

    for (const loan of dueTomorrow) {
      const dueDate = loan.dueDate.toLocaleDateString('mn-MN');
      
      await sendPaymentReminderNotification(
        loan.user._id,
        loan._id,
        loan.remainingAmount,
        dueDate
      );

      logger.info(`Payment reminder sent: Loan ${loan._id}`);
    }

    logger.info(`Payment reminders completed: ${dueTransaction.length} notifications sent`);
  } catch (error) {
    logger.error('Payment reminders error:', error);
  }
});

/**
 * Бүх cron job-уудыг эхлүүлэх
 */
const startCronJobs = () => {
  checkOverdueLoans.start();
  sendDueSoonReminders.start();
  sendPaymentReminders.start();
  
  logger.info('✅ All cron jobs started');
  logger.info('- Overdue check: Daily at 00:00');
  logger.info('- Due soon reminders: Daily at 09:00');
  logger.info('- Payment reminders: Daily at 10:00');
};

/**
 * Бүх cron job-уудыг зогсоох
 */
const stopCronJobs = () => {
  checkOverdueLoans.stop();
  sendDueSoonReminders.stop();
  sendPaymentReminders.stop();
  
  logger.info('All cron jobs stopped');
};

module.exports = {
  startCronJobs,
  stopCronJobs
};