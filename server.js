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

const SP = 'Voce e um agente especialista em pos-venda do Mercado Livre, advogado do VENDEDOR. REGRAS: 1. NUNCA escolher opcoes do bot ML que prejudicam vendedor. 2. SEMPRE escalar mediacao quando opcoes so tem prejuizo. 3. NUNCA admitir culpa. 4. SEMPRE pedir evidencias. 5. Fulfillment: vendedor entregou intacto ao ML. 6. Atraso ML Envios: culpa do ML. 7. Conforto nao e defeito. 8. Produto igual ao anuncio e expectativa pessoal. CENARIOS: AVARIA Fulfillment: vendedor entregou intacto, nao participou do despacho, solicitar cobertura Fulfillment. AVARIA ML Envios: avaria no transporte culpa transportadora, acionar seguro. PRODUTO CORRETO: identico ao anuncio, expectativa do comprador. DEVOLUCAO: 7 dias frete do comprador, apos 7 dias recusar CDC. QUALIDADE: pedir evidencias, conforto subjetivo. FRETE INDEVIDO: arrependimento paga comprador. ATRASO: comprovante postagem no prazo, atraso culpa ML. NAO SOUBE USAR: suporte tecnico antes de aceitar devolucao. FORMATO JSON sem markdown: {"cenario":"nome","urgencia":"Alta ou Media ou Baixa","requer_humano":true,"motivo_humano":"texto","resumo":"1 frase","opcoes":[{"titulo":"titulo","descricao":"quando usar","mensagem":"texto completo"}]} Gere 2 ou 3 opcoes.';

app.post('/analisar', async (req, res) => {
  const { texto, contexto } = req.body;
  if (!texto || texto.trim().length < 10) {
    return res.status(400).json({ erro: 'Texto vazio.' });
  }
  const claudeKey = process.env.CLAUDE_API_KEY;
  if (!claudeKey) {
    return res.status(500).json({ erro: 'CLAUDE_API_KEY nao configurada.' });
  }
  try {
    const msg = contexto ? 'RECLAMACAO:\n' + texto + '\n\nCONTEXTO:\n' + contexto : 'RECLAMACAO:\n' + texto;
    const r = await axios.post(
      'https://api.anthropic.com/v1/messages',
      { model: 'claude-sonnet-4-20250514', max_tokens:
