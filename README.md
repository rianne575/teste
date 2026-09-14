````markdown
# ObraSegura API 🏗️🔒

Backend API real e funcional para o aplicativo Flutter **ObraSegura** - Segurança Inteligente em Obras de Construção.

## 📋 Descrição

ObraSegura API é uma API REST desenvolvida com **Node.js** e **Express** que fornece:

- 🤖 **Chat com IA Real** - Assistente especializada em segurança do trabalho
- 📸 **Análise Real de Imagens** - Detecção de riscos usando visão computacional da OpenAI
- 📝 **Gerenciamento de Ocorrências** - CRUD completo de eventos de segurança
- 🚨 **Sistema de Alertas** - Notificações automáticas de riscos críticos
- 📊 **Dashboard** - Métricas e indicadores de segurança
- 📄 **Relatórios** - Documentação de eventos e tendências
- 💾 **Persistência** - Dados armazenados em JSON local

## 🚀 Quick Start - Instalação Local

### 1️⃣ Pré-requisitos

- **Node.js** 20 ou superior
  - [Baixar Node.js](https://nodejs.org/)

### 2️⃣ Instalação

```bash
# Clonar repositório
git clone https://github.com/rianne575/obrasegura-api.git
cd obrasegura-api

# Instalar dependências
npm install
```

### 3️⃣ Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com sua chave da OpenAI
# Linux/Mac:
nano .env
# Windows:
notpad .env
```

Adicione sua chave da OpenAI:
```env
OPENAI_API_KEY=sk-your-actual-key-here
```

### 4️⃣ Obter Chave da OpenAI

1. Acesse [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Faça login (ou crie uma conta)
3. Clique em "Create new secret key"
4. Copie a chave
5. Adicione ao arquivo `.env`

### 5️⃣ Executar a API

**Modo desenvolvimento (com auto-reload):**
```bash
npm run dev
```

**Modo produção:**
```bash
npm start
```

A API estará disponível em: **http://localhost:8080**

## ✅ Testar a API

### Health Check

```bash
curl http://localhost:8080/health
```

Resposta esperada:
```json
{
  "ok": true,
  "service": "ObraSegura API",
  "status": "online"
}
```

### Chat com IA

```bash
curl -X POST http://localhost:8080/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Quais são os principais riscos em uma obra de construção?"}'
```

### Análise de Imagem

```bash
curl -X POST http://localhost:8080/ai/analyze-image \
  -F "image=@/caminho/para/foto.jpg"
```

### Listar Ocorrências

```bash
curl http://localhost:8080/occurrences
```

### Criar Ocorrência

```bash
curl -X POST http://localhost:8080/occurrences \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "Falta de EPI",
    "descricao": "Trabalhador sem capacete",
    "gravidade": "alta",
    "local": "Setor A",
    "recomendacao": "Fornecer EPI adequado imediatamente"
  }'
```

## 📚 Endpoints Disponíveis

### Health & Status
- `GET /health` - Verificar saúde da API

### Autenticação
- `POST /auth/login` - Login
- `POST /auth/register` - Registrar novo usuário
- `POST /auth/forgot-password` - Recuperar senha
- `GET /users/me` - Dados do usuário atual

### Chat com IA
- `POST /ai/chat` - Chat em tempo real com IA
- `GET /ai/recommendations` - Recomendações de segurança

### Análise de Imagens
- `POST /ai/analyze-image` - Analisar imagem (multipart/form-data)
- `POST /monitoring/analyze` - Análise com monitoramento

### Ocorrências
- `GET /occurrences` - Listar todas
- `POST /occurrences` - Criar nova
- `PUT /occurrences/:id` - Atualizar
- `DELETE /occurrences/:id` - Deletar

### Alertas
- `GET /alerts` - Listar alertas (gravidade alta/crítica)
- `PUT /alerts/:id/resolve` - Marcar como resolvido

### Dashboard & Riscos
- `GET /dashboard` - Métricas de segurança
- `GET /risks` - Listar riscos abertos
- `GET /risk-map` - Mapa de riscos por localização

### Relatórios
- `GET /reports` - Listar relatórios
- `POST /reports` - Criar novo relatório

## 🔐 Segurança

✅ **CORS** - Controle de origem cruzada  
✅ **Rate Limiting** - 100 requisições/15 minutos por IP  
✅ **Validação** - Todos os campos validados  
✅ **Sanitização** - Remoção de dados sensíveis  
✅ **Multer** - Validação rigorosa de uploads  
✅ **Ambiente** - Chaves nunca no código  
✅ **Erros** - Sem exposição de secrets  

## 🌐 Publicar no Render

### Passo 1: Preparar repositório

```bash
# Verificar que .env não está no git
git status | grep .env

# Confirmar que .env.example existe
ls -la .env.example

# Fazer commit
git add .
git commit -m "ObraSegura API - Backend pronto para Render"
git push
```

### Passo 2: Criar Serviço no Render

1. Acesse [https://render.com](https://render.com)
2. Clique em **New +** → **Web Service**
3. Conecte seu repositório GitHub (rianne575/obrasegura-api)
4. Configure:
   - **Name:** `obrasegura-api`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

### Passo 3: Adicionar Variáveis de Ambiente

Na seção **Environment Variables** do Render, adicione:

| Chave | Valor | Exemplo |
|-------|-------|----------|
| `OPENAI_API_KEY` | Sua chave OpenAI | `sk-...` |
| `OPENAI_MODEL` | gpt-4o | - |
| `OPENAI_VISION_MODEL` | gpt-4o | - |
| `CORS_ORIGIN` | `*` ou URL do Flutter | - |
| `NODE_ENV` | production | - |

### Passo 4: Deploy

1. Clique em **Create Web Service**
2. Aguarde a construção (2-3 minutos)
3. Teste em: `https://seu-servico.onrender.com/health`

## 📱 Conectar Flutter à API

No seu app Flutter, configure a URL base:

```dart
class ApiService {
  // Desenvolvimento
  static const String baseUrl = 'http://localhost:8080';
  
  // Produção (Render)
  // static const String baseUrl = 'https://seu-servico.onrender.com';
  
  static Future<Map<String, dynamic>> chatWithAI(String message) async {
    final response = await http.post(
      Uri.parse('$baseUrl/ai/chat'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'message': message}),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Erro ao chamar API');
    }
  }
  
  static Future<Map<String, dynamic>> analyzeImage(File imageFile) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/ai/analyze-image'),
    );
    
    request.files.add(await http.MultipartFile.fromPath('image', imageFile.path));
    final response = await request.send();
    
    if (response.statusCode == 200) {
      return jsonDecode(await response.stream.bytesToString());
    } else {
      throw Exception('Erro ao analisar imagem');
    }
  }
}
```

## 📖 Estrutura do Projeto

```
obrasegura-api/
├── package.json           # Dependências
├── server.mjs             # Servidor principal
├── render.yaml            # Configuração Render
├── .env.example           # Exemplo de variáveis
├── .gitignore             # Arquivos ignorados
├── data.json              # Banco de dados local
└── README.md              # Este arquivo
```

## 🛠️ Dependências

| Pacote | Versão | Função |
|--------|--------|--------|
| express | ^4.18.2 | Framework web |
| cors | ^2.8.5 | CORS middleware |
| dotenv | ^16.3.1 | Variáveis de ambiente |
| multer | ^1.4.5 | Upload de arquivos |
| express-rate-limit | ^7.1.5 | Rate limiting |
| openai | ^4.52.0 | SDK OpenAI oficial |

## 🐛 Troubleshooting

### Erro: "OPENAI_API_KEY não configurada"

**Solução:**
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Adicionar sua chave
nano .env

# Reiniciar servidor
npm run dev
```

### Erro: "Cannot find module"

**Solução:**
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Porta 8080 já em uso

**Solução:**
```bash
# Usar outra porta
PORT=3000 npm start

# Ou matar processo na porta (Linux/Mac)
lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Erro 502 ao chamar IA

**Verificar:**
- OPENAI_API_KEY está configurada?
- Créditos da OpenAI disponíveis?
- Internet funcionando?

## 📞 Suporte

- GitHub Issues: [https://github.com/rianne575/obrasegura-api/issues](https://github.com/rianne575/obrasegura-api/issues)
- OpenAI Docs: [https://platform.openai.com/docs](https://platform.openai.com/docs)
- Express Docs: [https://expressjs.com](https://expressjs.com)
- Render Docs: [https://render.com/docs](https://render.com/docs)

## 📄 Licença

MIT License - Veja LICENSE para detalhes

## 👤 Autor

**rianne575**
- GitHub: [@rianne575](https://github.com/rianne575)

---

**ObraSegura - Segurança Inteligente em Obras** 🏗️🔒  
Feito com ❤️ para construção segura
````