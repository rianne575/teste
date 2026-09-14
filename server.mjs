import express from 'express';
import cors from 'cors';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
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
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: 'Muitas requisições, tente novamente mais tarde.'
});
app.use(limiter);

// Middleware de parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Configuração do multer para upload de imagens
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo não suportado. Use JPG, PNG ou WEBP.'));
  }
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// ============================================================================
// INICIALIZAÇÃO DO OPENAI
// ============================================================================

let openai = null;

function initializeOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  OPENAI_API_KEY não está configurada.');
    return null;
  }
  return new OpenAI({ apiKey });
}

// ============================================================================
// FUNÇÕES AUXILIARES PARA PERSISTÊNCIA DE DADOS
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

// ============================================================================
// TRATAMENTO DE ERROS GLOBAL
// ============================================================================

function handleError(res, error, statusCode = 500) {
  console.error('Erro:', error.message);
  const isAIError = error.message.includes('API') || error.message.includes('OpenAI');
  const status = isAIError ? 502 : statusCode;
  const message = isAIError 
    ? 'Não foi possível conectar ao serviço de IA.' 
    : error.message || 'Erro interno no servidor.';
  
  res.status(status).json({ error: message });
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
// ENDPOINTS DE AUTENTICAÇÃO (compatibilidade com Flutter)
// ============================================================================

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }
  res.status(200).json({
    token: `token_${Date.now()}`,
    user: { id: 'user-001', email, name: 'Usuário' }
  });
});

app.post('/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, senha e nome são obrigatórios.' });
  }
  res.status(201).json({
    token: `token_${Date.now()}`,
    user: { id: generateId('user'), email, name }
  });
});

app.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório.' });
  }
  res.status(200).json({
    message: 'Email de recuperação enviado. Verifique sua caixa de entrada.'
  });
});

// ============================================================================
// ENDPOINTS DE USUÁRIO
// ============================================================================

app.get('/users/me', (req, res) => {
  res.status(200).json({
    id: 'user-001',
    email: 'usuario@obrasegura.com',
    name: 'Usuário ObraSegura',
    role: 'worker'
  });
});

// ============================================================================
// ENDPOINTS DE CHAT COM IA
// ============================================================================

app.post('/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória.' });
    }

    openai = initializeOpenAI();
    if (!openai) {
      return handleError(res, new Error('Serviço de IA não disponível'), 502);
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é uma assistente especializada em segurança do trabalho na construção civil. 
          Responda em português do Brasil. 
          Seja útil, claro e prático. 
          Não invente normas, leis ou informações técnicas. 
          Se a pergunta envolver uma situação potencialmente perigosa, oriente o usuário a interromper a atividade e procurar um profissional responsável quando necessário.`
        },
        { role: 'user', content: message }
      ],
      max_tokens: 1024
    });

    const reply = response.choices[0]?.message?.content || 'Não foi possível gerar uma resposta.';
    res.status(200).json({ reply });
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================================
// ENDPOINTS DE ANÁLISE DE IMAGEM
// ============================================================================

app.post('/ai/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Envie uma imagem no campo image.' });
    }

    openai = initializeOpenAI();
    if (!openai) {
      return handleError(res, new Error('Serviço de IA não disponível'), 502);
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
              text: `Analise esta imagem de uma obra procurando situações de risco relacionadas à segurança. 
              Identifique, quando possível:
              - falta de EPI
              - ausência de capacete
              - ausência de proteção contra quedas
              - trabalho em altura
              - andaimes inadequados
              - máquinas perigosas
              - instalações elétricas perigosas
              - materiais mal armazenados
              - obstáculos
              - risco de queda
              - risco de esmagamento
              - risco de incêndio
              - áreas sem isolamento
              - circulação insegura
              
              Retorne APENAS um JSON válido (sem markdown) com esta estrutura exata:
              {
                "tipo": "string (tipo de risco identificado)",
                "descricao": "string (descrição do risco)",
                "gravidade": "string (segura|baixa|media|alta|critica)",
                "local": "string (local onde foi identificado)",
                "recomendacao": "string (recomendação de segurança)"
              }
              
              Se não houver riscos identificáveis, retorne gravidade como "segura".
              Não invente riscos que não estejam razoavelmente visíveis.`
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
      // Tenta extrair JSON da resposta se houver markdown
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = {
          tipo: 'Análise indisponível',
          descricao: 'Não foi possível analisar a imagem.',
          gravidade: 'media',
          local: 'Área da obra',
          recomendacao: 'Tente novamente ou envie outra imagem.'
        };
      }
    }

    // Validação de gravidade
    const gravidadesValidas = ['segura', 'baixa', 'media', 'alta', 'critica'];
    if (!gravidadesValidas.includes(analysis.gravidade)) {
      analysis.gravidade = 'media';
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
      return handleError(res, new Error('Serviço de IA não disponível'), 502);
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é uma assistente especializada em segurança do trabalho na construção civil.'
        },
        {
          role: 'user',
          content: 'Liste 5 recomendações práticas e importantes de segurança em obras de construção. Formate como um JSON array com objetos contendo "id", "titulo" e "descricao".'
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
      } else {
        recommendations = [
          {
            id: 'rec-001',
            titulo: 'Uso obrigatório de EPI',
            descricao: 'Equipamento de Proteção Individual deve ser utilizado em todas as atividades.'
          }
        ];
      }
    } catch {
      recommendations = [
        {
          id: 'rec-001',
          titulo: 'Uso obrigatório de EPI',
          descricao: 'Equipamento de Proteção Individual deve ser utilizado em todas as atividades.'
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
    if (!gravidadesValidas.includes(gravidade)) {
      return res.status(400).json({ error: 'Gravidade inválida.' });
    }

    const data = loadData();
    const newOccurrence = {
      id: generateId('occ'),
      tipo,
      descricao,
      gravidade,
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
    if (gravidade) occurrence.gravidade = gravidade;
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
        tipo: o.tipo,
        descricao: o.descricao,
        gravidade: o.gravidade,
        local: o.local,
        createdAt: o.createdAt,
        resolved: data.resolvedAlerts?.includes(o.id) || false
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

    const alert = data.occurrences.find(o => o.id === id);
    if (!alert) {
      return res.status(404).json({ error: 'Alerta não encontrado.' });
    }

    if (!data.resolvedAlerts) {
      data.resolvedAlerts = [];
    }

    if (!data.resolvedAlerts.includes(id)) {
      data.resolvedAlerts.push(id);
    }

    alert.status = 'resolvida';
    saveData(data);

    res.status(200).json({ message: 'Alerta resolvido.', alert });
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

    // Calcula score de segurança (0-100)
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
// ENDPOINTS DE RISCOS (compatibilidade com Flutter)
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

app.post('/monitoring/analyze', (req, res) => {
  try {
    const { imageUrl, location } = req.body;
    if (!imageUrl || !location) {
      return res.status(400).json({ error: 'imageUrl e location são obrigatórios.' });
    }

    res.status(200).json({
      analysisId: generateId('analysis'),
      location,
      timestamp: new Date().toISOString(),
      status: 'pendente'
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
  console.log(`🚀 ObraSegura API rodando em http://localhost:${PORT}`);
  console.log(`📡 CORS habilitado para: ${process.env.CORS_ORIGIN || '*'}`);
  console.log(`🔒 Rate limit: 100 requisições a cada 15 minutos`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY não configurada. Endpoints de IA não funcionarão.');
  } else {
    console.log('✅ OpenAI API configurada');
  }
});