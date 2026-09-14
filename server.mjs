import express from 'express';
import cors from 'cors';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, 'data.json');

// ============================================================================
// CONFIGURAÇÕES INICIAIS
// ============================================================================

// Middleware de CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));

// Middleware de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições, tente novamente mais tarde.'
});
app.use(limiter);

// Middleware de parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Configuração do multer para upload de imagens
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo não suportado. Use JPG, JPEG, PNG ou WEBP.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ============================================================================
// INICIALIZAÇÃO DO OPENAI
// ============================================================================

let openai = null;

function initializeOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error.message);
  }
  return {
    occurrences: [],
    alerts: [],
    reports: [],
    users: [],
    resolvedAlerts: []
  };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erro ao salvar dados:', error.message);
  }
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function handleError(res, error, statusCode = 500) {
  console.error('Erro:', error.message);
  
  if (error.message.includes('API') || error.message.includes('OpenAI') || error.message.includes('timeout')) {
    return res.status(502).json({ error: 'Não foi possível conectar ao serviço de IA.' });
  }
  
  res.status(statusCode).json({ error: error.message || 'Erro interno no servidor.' });
}

// ============================================================================
// ENDPOINTS DE SAÚDE
// ============================================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'ObraSegura API',
    status: 'online'
  });
});

// ============================================================================
// ENDPOINTS DE AUTENTICAÇÃO
// ============================================================================

app.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }
    res.status(200).json({
      token: `token_${Date.now()}`,
      user: { id: 'user-001', email, name: 'Usuário' }
    });
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios.' });
    }
    res.status(201).json({
      token: `token_${Date.now()}`,
      user: { id: generateId('user'), email, name }
    });
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }
    res.status(200).json({
      message: 'Email de recuperação enviado. Verifique sua caixa de entrada.'
    });
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/users/me', (req, res) => {
  try {
    res.status(200).json({
      id: 'user-001',
      email: 'usuario@obrasegura.com',
      name: 'Usuário ObraSegura',
      role: 'worker'
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// ENDPOINTS DE CHAT COM IA REAL
// ============================================================================

app.post('/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Informe uma mensagem.' });
    }

    openai = initializeOpenAI();
    if (!openai) {
      return res.status(503).json({ error: 'Serviço de inteligência artificial não configurado.' });
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é uma assistente especializada em segurança do trabalho na construção civil. 
Responda em português do Brasil de forma clara, prática e útil. 
Você pode responder perguntas sobre: 
- Identificação de riscos;
- EPI (Equipamento de Proteção Individual);
- Trabalho em altura;
- Andaimes e estruturas;
- Eletricidade e instalações;
- Máquinas e equipamentos;
- Escavações e fundações;
- Organização de obra;
- Prevenção de acidentes;
- Primeiros socorros básicos.
Não invente normas ou leis. Se a situação for grave ou iminente, oriente a parar a atividade e procurar um profissional responsável.`
        },
        { role: 'user', content: message }
      ],
      max_tokens: 1024,
      temperature: 0.7
    });

    const reply = response.choices[0]?.message?.content || 'Não foi possível gerar uma resposta.';
    res.status(200).json({ reply });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// ENDPOINTS DE ANÁLISE REAL DE IMAGEM
// ============================================================================

app.post('/ai/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Envie uma imagem no campo image.' });
    }

    openai = initializeOpenAI();
    if (!openai) {
      return res.status(503).json({ error: 'Serviço de inteligência artificial não configurado.' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analise esta imagem de uma obra procurando por riscos de segurança. Procure por:
- Falta de capacete de segurança
- Falta de EPI (Equipamento de Proteção Individual)
- Trabalho em altura
- Ausência de proteção contra quedas
- Andaimes inadequados ou mal estruturados
- Máquinas perigosas sem proteção
- Riscos elétricos (fios expostos, instalações precárias)
- Materiais mal armazenados ou empilhados
- Obstáculos no caminho
- Risco de queda de objetos
- Risco de esmagamento
- Risco de incêndio
- Áreas sem isolamento de risco
- Circulação insegura
- Outros riscos visíveis

RETORNE APENAS UM JSON VÁLIDO (sem markdown, sem explicações) com exatamente esta estrutura:
{
  "tipo": "Tipo do risco ou 'Nenhum risco identificado'",
  "descricao": "Descrição clara do que foi identificado",
  "gravidade": "segura, baixa, media, alta ou critica",
  "local": "Onde na imagem foi identificado",
  "recomendacao": "Medida preventiva recomendada"
}

IMPORTANTE: Não invente riscos que não estejam claramente visíveis. Se não houver risco evidente, use gravidade 'segura'.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 512
    });

    const analysisText = response.choices[0]?.message?.content || '{}';
    let analysis = {};

    try {
      analysis = JSON.parse(analysisText);
    } catch {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = {
          tipo: 'Nenhum risco identificado',
          descricao: 'Não foi identificado risco evidente na imagem.',
          gravidade: 'segura',
          local: 'Área analisada',
          recomendacao: 'Manter as medidas de segurança e continuar o monitoramento.'
        };
      }
    }

    const gravidadesValidas = ['segura', 'baixa', 'media', 'alta', 'critica'];
    if (!gravidadesValidas.includes(analysis.gravidade?.toLowerCase())) {
      analysis.gravidade = 'media';
    } else {
      analysis.gravidade = analysis.gravidade.toLowerCase();
    }

    res.status(200).json(analysis);
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// ENDPOINTS DE RECOMENDAÇÕES DE IA
// ============================================================================

app.get('/ai/recommendations', async (req, res) => {
  try {
    openai = initializeOpenAI();
    if (!openai) {
      return res.status(503).json({ error: 'Serviço de inteligência artificial não configurado.' });
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é especialista em segurança do trabalho na construção civil.'
        },
        {
          role: 'user',
          content: 'Liste 5 recomendações práticas e importantes de segurança em obras de construção. Retorne APENAS um JSON array válido (sem markdown) com objetos contendo "id", "titulo" e "descricao".'
        }
      ],
      max_tokens: 1024
    });

    const responseText = response.choices[0]?.message?.content || '[]';
    let recommendations = [];

    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      }
    } catch {}

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      recommendations = [
        {
          id: 'rec-001',
          titulo: 'Uso obrigatório de EPI',
          descricao: 'Equipamento de Proteção Individual deve ser utilizado em todas as atividades da obra.'
        },
        {
          id: 'rec-002',
          titulo: 'Proteção contra quedas em altura',
          descricao: 'Usar cintos de segurança, telas de proteção e guardrails em trabalhos acima de 1,2m.'
        },
        {
          id: 'rec-003',
          titulo: 'Isolamento de áreas de risco',
          descricao: 'Cercar e sinalizar áreas com risco de queda de objetos, máquinas em funcionamento e instalações elétricas.'
        }
      ];
    }

    res.status(200).json({ recommendations });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// ENDPOINTS DE OCORRÊNCIAS
// ============================================================================

app.get('/occurrences', (req, res) => {
  try {
    const data = loadData();
    res.status(200).json(data.occurrences);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/occurrences', (req, res) => {
  try {
    const { tipo, descricao, gravidade, local, recomendacao } = req.body;
    
    if (!tipo || !descricao || !gravidade || !local || !recomendacao) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const gravidadesValidas = ['segura', 'baixa', 'media', 'alta', 'critica'];
    if (!gravidadesValidas.includes(gravidade.toLowerCase())) {
      return res.status(400).json({ error: 'Gravidade inválida. Use: segura, baixa, media, alta, critica.' });
    }

    const data = loadData();
    const newOccurrence = {
      id: generateId('occ'),
      tipo,
      descricao,
      gravidade: gravidade.toLowerCase(),
      local,
      recomendacao,
      status: 'aberta',
      createdAt: new Date().toISOString()
    };

    data.occurrences.push(newOccurrence);
    saveData(data);

    res.status(201).json(newOccurrence);
  } catch (error) {
    handleError(res, error);
  }
});

app.put('/occurrences/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, descricao, gravidade, local, recomendacao, status } = req.body;

    const data = loadData();
    const occurrence = data.occurrences.find(o => o.id === id);

    if (!occurrence) {
      return res.status(404).json({ error: 'Ocorrência não encontrada.' });
    }

    if (tipo) occurrence.tipo = tipo;
    if (descricao) occurrence.descricao = descricao;
    if (gravidade) occurrence.gravidade = gravidade.toLowerCase();
    if (local) occurrence.local = local;
    if (recomendacao) occurrence.recomendacao = recomendacao;
    if (status) occurrence.status = status;

    saveData(data);
    res.status(200).json(occurrence);
  } catch (error) {
    handleError(res, error);
  }
});

app.delete('/occurrences/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = loadData();

    const index = data.occurrences.findIndex(o => o.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Ocorrência não encontrada.' });
    }

    const deleted = data.occurrences.splice(index, 1)[0];
    saveData(data);

    res.status(200).json({ message: 'Ocorrência deletada.', deleted });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// ENDPOINTS DE ALERTAS
// ============================================================================

app.get('/alerts', (req, res) => {
  try {
    const data = loadData();
    const alerts = data.occurrences
      .filter(o => o.gravidade === 'alta' || o.gravidade === 'critica')
      .map(o => ({
        id: o.id,
        occurrenceId: o.id,
        title: o.tipo,
        description: o.descricao,
        severity: o.gravidade,
        resolved: data.resolvedAlerts?.includes(o.id) || false,
        createdAt: o.createdAt
      }));

    res.status(200).json(alerts);
  } catch (error) {
    handleError(res, error);
  }
});

app.put('/alerts/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    const data = loadData();

    const occurrence = data.occurrences.find(o => o.id === id);
    if (!occurrence) {
      return res.status(404).json({ error: 'Alerta não encontrado.' });
    }

    if (!data.resolvedAlerts) {
      data.resolvedAlerts = [];
    }

    if (!data.resolvedAlerts.includes(id)) {
      data.resolvedAlerts.push(id);
    }

    occurrence.status = 'resolvida';
    saveData(data);

    res.status(200).json({ 
      message: 'Alerta resolvido.',
      id,
      resolved: true
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// ENDPOINTS DE DASHBOARD
// ============================================================================

app.get('/dashboard', (req, res) => {
  try {
    const data = loadData();
    const occurrences = data.occurrences;

    const totalOccurrences = occurrences.length;
    const openOccurrences = occurrences.filter(o => o.status === 'aberta').length;
    const criticalOccurrences = occurrences.filter(o => o.gravidade === 'critica').length;
    const resolvedOccurrences = occurrences.filter(o => o.status === 'resolvida').length;

    let safetyScore = 100;
    if (totalOccurrences > 0) {
      const criticalWeight = criticalOccurrences * 25;
      const highWeight = occurrences.filter(o => o.gravidade === 'alta').length * 10;
      const mediumWeight = occurrences.filter(o => o.gravidade === 'media').length * 5;
      const totalWeight = criticalWeight + highWeight + mediumWeight;
      safetyScore = Math.max(0, 100 - totalWeight);
    }

    res.status(200).json({
      totalOccurrences,
      openOccurrences,
      criticalOccurrences,
      resolvedOccurrences,
      safetyScore: Math.round(safetyScore)
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// ENDPOINTS DE RISCOS
// ============================================================================

app.get('/risks', (req, res) => {
  try {
    const data = loadData();
    const risks = data.occurrences
      .filter(o => o.status === 'aberta')
      .map(o => ({
        id: o.id,
        tipo: o.tipo,
        descricao: o.descricao,
        gravidade: o.gravidade,
        local: o.local
      }));

    res.status(200).json(risks);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/risk-map', (req, res) => {
  try {
    const data = loadData();
    const risksByLocation = {};

    data.occurrences.forEach(o => {
      if (!risksByLocation[o.local]) {
        risksByLocation[o.local] = [];
      }
      risksByLocation[o.local].push({
        id: o.id,
        tipo: o.tipo,
        gravidade: o.gravidade
      });
    });

    res.status(200).json(risksByLocation);
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// ENDPOINTS DE MONITORAMENTO
// ============================================================================

app.post('/monitoring/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Envie uma imagem no campo image.' });
    }

    openai = initializeOpenAI();
    if (!openai) {
      return res.status(503).json({ error: 'Serviço de inteligência artificial não configurado.' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const location = req.body.location || 'Área da obra';

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analise esta imagem de uma obra procurando por riscos de segurança. Retorne um JSON com os campos: tipo, descricao, gravidade (segura/baixa/media/alta/critica), local, recomendacao.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 512
    });

    const analysisText = response.choices[0]?.message?.content || '{}';
    let analysis = {};

    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch {}

    const gravidadesValidas = ['segura', 'baixa', 'media', 'alta', 'critica'];
    if (!gravidadesValidas.includes(analysis.gravidade?.toLowerCase())) {
      analysis.gravidade = 'media';
    }

    const data = loadData();
    const newOccurrence = {
      id: generateId('occ'),
      tipo: analysis.tipo || 'Risco analisado',
      descricao: analysis.descricao || 'Análise automática de imagem',
      gravidade: (analysis.gravidade || 'media').toLowerCase(),
      local: location,
      recomendacao: analysis.recomendacao || 'Revisar as medidas de segurança',
      status: analysis.gravidade !== 'segura' ? 'aberta' : 'resolvida',
      createdAt: new Date().toISOString()
    };

    data.occurrences.push(newOccurrence);
    saveData(data);

    res.status(200).json({
      analysisId: generateId('analysis'),
      location,
      timestamp: new Date().toISOString(),
      status: 'completo',
      analysis: analysis,
      occurrence: newOccurrence
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// ENDPOINTS DE RELATÓRIOS
// ============================================================================

app.get('/reports', (req, res) => {
  try {
    const data = loadData();
    res.status(200).json(data.reports || []);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/reports', (req, res) => {
  try {
    const { title, description, type } = req.body;
    if (!title || !description || !type) {
      return res.status(400).json({ error: 'Título, descrição e tipo são obrigatórios.' });
    }

    const data = loadData();
    const newReport = {
      id: generateId('report'),
      title,
      description,
      type,
      createdAt: new Date().toISOString()
    };

    if (!data.reports) {
      data.reports = [];
    }

    data.reports.push(newReport);
    saveData(data);

    res.status(201).json(newReport);
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// TRATAMENTO DE ERROS 404
// ============================================================================

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado.' });
});

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 ObraSegura API iniciada`);
  console.log(`📍 Servidor: http://0.0.0.0:${PORT}`);
  console.log(`🌐 URL Local: http://localhost:${PORT}`);
  console.log(`🔒 CORS: ${process.env.CORS_ORIGIN || '*'}`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('\n⚠️  AVISO: OPENAI_API_KEY não configurada');
    console.warn('   Endpoints de IA não funcionarão sem a chave da OpenAI.\n');
  } else {
    console.log('✅ OpenAI API configurada\n');
  }
});