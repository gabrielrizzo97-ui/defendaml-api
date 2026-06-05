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

const SYSTEM_PROMPT = `Voce e um agente especialista em pos-venda do Mercado Livre, atuando como advogado do VENDEDOR. REGRAS: 1. NUNCA escolher opcoes do bot do ML quando todas prejudicam o vendedor. 2. SEMPRE escalar para mediacao humana quando as opcoes so tem prejuizo. 3. NUNCA admitir culpa desnecessariamente. 4. SEMPRE solicitar evidencias quando nao houver provas. 5. Fulfillment: vendedor entregou intacto, construir linha do tempo sem acusar o ML. 6. Atraso Mercado Envios: responsabilidade do ML. 7. Conforto pessoal nao e defeito. 8. Produto identico ao anuncio = expectativa pessoal. ESTRATEGIAS: AVARIA Fulfillment: produto entregue intacto ao ML, vendedor nao participou do despacho, solicitar cobertura Fulfillment. AVARIA Mercado Envios: avaria no transporte e responsabilidade da transportadora, acionar seguro ML Envios. PRODUTO NAO CORRESPONDE quando esta correto: produto e identico ao anuncio, expectativa pessoal do comprador. DEVOLUCAO: dentro de 7 dias frete e do comprador, fora de 7 dias recusar pelo CDC. QUALIDADE: solicitar evidencias, conforto e subjetivo, sinal de antena depende da regiao. FRETE INDEVIDO: arrependimento e custo do comprador, avaria e cobertura do ML Envios. ATRASO: mostrar comprovante de postagem no prazo, atraso apos postagem e responsabilidade do ML. NAO SOUBE USAR: oferecer suporte tecnico completo antes de aceitar qualquer devolucao. FORMATO responda APENAS com este JSON sem markdown: {"cenario":"nome do cenario","urgencia":"Alta ou Media ou Baixa","requer_humano":true,"motivo_humano":"explicacao ou vazio","resumo":"1 frase do caso","opcoes":[{"titulo":"titulo curto","descricao":"quando usar","mensagem":"texto completo para colar no ML"}]} Gere sempre 2 ou 3 opcoes: firme, cordial e mediacao quando necessario.`;

app.post('/analisar', async (req, res) => {
  const { texto, contexto } = req.body;
  if (!texto || texto.trim().length < 10) {
    return res.status(400).json({ erro: 'Texto da reclamacao vazio.' });
  }
  const claudeKey = process.env.CLAUDE_API_KEY;
  if (!claudeKey) {
    return res.status(500).json({ erro: 'CLAUDE_API_KEY nao configurada.' });
  }
  try {
    const userMsg = contexto ? 'RECLAMACAO:\n' + texto + '\n\nCONTEXTO:\n' + contexto : 'RECLAMACAO:\n' + texto;
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMsg }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    const rawText = response.data.content.map(function(b) { return b.text || ''; }).join('');
    const clean = rawText.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao processar: ' + err.message });
  }
});

app.get('/', function(req, res) {
  res.json({ status: 'DefendaML API rodando', versao: '1.0' });
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log('DefendaML rodando na porta ' + PORT);
});
