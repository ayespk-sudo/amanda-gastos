const fs   = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'data', 'expenses.json');

function load() {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE)) return {};
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function getExpenses(userId) {
  return load()[String(userId)] || {};
}

function addExpense(userId, category, amount) {
  const all = load();
  const uid = String(userId);
  if (!all[uid]) all[uid] = {};
  const cat = category.toLowerCase().trim();
  all[uid][cat] = (all[uid][cat] || 0) + amount;
  save(all);
}

function clearExpenses(userId) {
  const all = load();
  all[String(userId)] = {};
  save(all);
}

module.exports = { getExpenses, addExpense, clearExpenses };
