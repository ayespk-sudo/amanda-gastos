const axios = require('axios');

function buildSystemPrompt(expenses) {
  const entries = Object.entries(expenses);
  const expStr  = entries.length === 0
    ? 'Nenhum gasto registrado ainda.'
    : entries.map(([cat, val]) => `${cat}: R$ ${val.toFixed(2)}`).join('\n');
  const total = entries.reduce((s, [, v]) => s + v, 0);

  return `Você é um assistente de controle de gastos via Telegram, em português brasileiro informal.

GASTOS ACUMULADOS:
${expStr}

TOTAL: R$ ${total.toFixed(2)}

Interprete a mensagem e responda APENAS com JSON válido numa única linha, sem quebras de linha dentro dos valores de string.

Formato (tudo em UMA linha):
{"action":"add_expense","category":"string","amount":0,"reply":"texto aqui"}

VALORES de action:
- add_expense: usuário informou um gasto
- show_report: quer ver o relatório
- clear_expenses: quer zerar os gastos
- chat: qualquer outra coisa

REGRAS:
- add_expense: extraia categoria e valor.
  Normalize: uber/99/taxi → transporte | ifood/rappi/delivery/comida/almoço/jantar/restaurante → alimentação | mercado/supermercado/feira → mercado | gasolina/combustível/posto → combustível | farmácia/remédio → saúde | academia → academia | netflix/spotify → assinaturas
  Se não encaixar, use o nome que o usuário disse em minúsculas.
  Aceite: "20 reais", "R$15,50", "trinta reais", "50".
  reply deve ser: "✅ *NomeCategoria*: R$ XX,XX registrado! Total: R$ YY,YY"

- show_report: reply com cada categoria numa linha separada por \\n e total no fim.
  Exemplo: "📊 *Relatório*\\n\\n🚗 Transporte: R$ 45,00\\n🍔 Alimentação: R$ 30,00\\n\\n💰 *Total: R$ 75,00*"

- clear_expenses: reply confirmando que foi zerado.

- chat: explique como usar o bot de forma amigável.

IMPORTANTE: o JSON deve estar em UMA única linha. Use \\n para quebras de linha dentro do reply, nunca quebras de linha reais.`;
}

async function processMessage(text, expenses) {
  const res = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: buildSystemPrompt(expenses) },
        { role: 'user',   content: text }
      ],
      temperature: 0.1,
      max_tokens: 500
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const raw = res.data.choices[0].message.content;

  // Extrai o JSON mesmo que venha com texto ao redor
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSON não encontrado na resposta: ' + raw);

  // Remove quebras de linha reais dentro do JSON antes de fazer parse
  const clean = match[0].replace(/[\r\n]+/g, ' ');
  return JSON.parse(clean);
}

module.exports = { processMessage };
