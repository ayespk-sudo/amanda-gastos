require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { processMessage } = require('./ai');
const { getExpenses, addExpense, clearExpenses } = require('./storage');

const TOKEN = process.env.TELEGRAM_TOKEN;
if (!TOKEN) { console.error('❌ TELEGRAM_TOKEN não definido no .env'); process.exit(1); }

const bot = new TelegramBot(TOKEN, { polling: true });
console.log('🤖 Bot de gastos rodando!');

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text   = msg.text?.trim();
  if (!text) return;

  console.log(`📩 [${chatId}]: ${text}`);

  try {
    const expenses = getExpenses(chatId);
    const { action, category, amount, reply } = await processMessage(text, expenses);

    if (action === 'add_expense' && category && amount) {
      addExpense(chatId, category, amount);
    } else if (action === 'clear_expenses') {
      clearExpenses(chatId);
    }

    bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Erro:', err.message);
    bot.sendMessage(chatId, '⚠️ Erro temporário. Tente novamente.');
  }
});

bot.on('polling_error', (err) => console.error('Polling error:', err.message));
