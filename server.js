const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.get('/', function(req, res) {
  res.json({ status: 'ok' });
});
app.post('/analisar', async (req, res) => {
  const { texto } = req.body;
  if (!texto) return res.status(400).json({ erro: 'vazio' });
  const key = process.env.CLAUDE_API_KEY;
  if (!key) return res.status(500).json({ erro: 'sem chave' });
  try {
    const r = await axios.post('https://api.anthropic.com/v1/messages',
      { model: 'claude-sonnet-4-20250514', max_tokens: 1500,
        system: 'Voce e advogado do vendedor do Mercado Livre. Analise a reclamacao e defenda o vendedor. Responda JSON: {"cenario":"nome","urgencia":"Alta ou Media ou Baixa","requer_humano":false,"motivo_humano":"","resumo":"frase","opcoes":[{"titulo":"titulo","descricao":"quando","mensagem":"texto"}]}',
        messages: [{ role: 'user', content: 'RECLAMACAO: ' + texto }] },
      { headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' } });
    const raw = r.data.content.map(b => b.text || '').join('');
    res.json(JSON.parse(raw.replace(/```json|```/g, '').trim()));
  } catch(e) { res.status(500).json({ erro: e.message }); }
});
var PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('porta ' + PORT));
