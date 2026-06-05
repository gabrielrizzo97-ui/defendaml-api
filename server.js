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

const SYSTEM_PROMPT = `Você é um agente especialista em pós-venda do Mercado Livre, atuando como advogado do VENDEDOR.

REGRAS DE OURO:
1. NUNCA escolher opções do bot do ML quando todas prejudicam o vendedor
2. SEMPRE escalar para mediação humana quando as opções só têm prejuízo
3. NUNCA admitir culpa desnecessariamente
4. SEMPRE solicitar evidências quando não houver provas
5. Fulfillment: vendedor entregou intacto, construir linha do tempo sem acusar o ML
6. Atraso Mercado Envios: responsabilidade do ML, não do vendedor
7. Conforto/gosto pessoal não é defeito
8. Produto idêntico ao anúncio = expectativa pessoal, não vício

ESTRATÉGIAS:
- AVARIA (Fulfillment): produto entregue intacto ao ML, vendedor não participou do despacho, solicitar cobertura Fulfillment
- AVARIA (Mercado Envios): avaria no transporte é responsabilidade da transportadora, acionar seguro ML Envios
- PRODUTO NÃO CORRESPONDE (quando está correto): produto é idêntico ao anúncio, expectativa pessoal do comprador
- DEVOLUÇÃO: dentro de 7 dias frete é do comprador, fora de 7 dias recusar pelo CDC
- QUALIDADE/NÃO FUNCIONA: solicitar evidências, conforto é subjetivo, sinal de antena depende da região
- FRETE INDEVIDO: arrependimento é custo do comprador, avaria é cobertura do ML Envios
- ATRASO: mostrar comprovante de postagem no prazo, atraso após postagem é responsabilidade do ML
- NÃO SOUBE USAR: oferecer suporte técnico completo antes de aceitar qualquer devolução

FORMATO — responda APENAS com este JSON sem markdown:
{
  "cenario": "nome do cenário",
  "urgencia": "Alta | Média | Baixa",
  "requer_humano": true ou false,
  "motivo_humano": "explicação ou vazio",
  "resumo": "1 frase do caso",
  "opcoes": [
    {
      "titulo": "título curto",
      "descricao": "quando usar",
      "mensagem": "texto completo para colar no ML"
    }
  ]
}
Gere sempre 2 ou 3 opções: firme, cordial e mediação quando necessário.`;

app.post('/analisar', async (req, res) => {
  const { texto, contexto } = req.body;
  if (!texto || texto.trim().length < 10) {
    return res.status(400).json({ erro: 'Texto da reclamação vazio.' });
  }
  const claudeKey = process.env.CLAUDE_API_KEY;
  if (!claudeKey) {
    return res.status(500).json({ erro: 'CLAUDE_API_KEY não configurada.' });
  }
  try {
    const userMsg = contexto ?
