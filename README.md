````markdown
# ObraSegura API 🏗️🔒

Backend API real e funcional para o aplicativo Flutter **ObraSegura** - uma solução inteligente de segurança para obras de construção.

## 📋 Descrição

ObraSegura API é uma API REST desenvolvida com **Node.js** e **Express** que fornece funcionalidades de:

- 🤖 Chat com IA especializada em segurança do trabalho
- 📸 Análise de imagens para identificação de riscos
- 📝 Gerenciamento de ocorrências de segurança
- 🚨 Sistema de alertas
- 📊 Dashboard com métricas de segurança
- 📄 Geração de relatórios
- 💾 Persistência de dados

A API integra-se com a **OpenAI** para fornecer respostas inteligentes e análises reais de imagens.

## 🚀 Quick Start

### 1. Pré-requisitos

- **Node.js** versão 20 ou superior
  - [Baixar Node.js](https://nodejs.org/)

### 2. Instalação

```bash
# Clonar o repositório
git clone https://github.com/rianne575/obrasegura-api.git
cd obrasegura-api

# Instalar dependências
npm install
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env e adicionar sua chave da OpenAI
nano .env
```

Adicione ao arquivo `.env`:

```
PORT=8080
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-4o
OPENAI_VISION_MODEL=gpt-4o
CORS_ORIGIN=*
```

### 4. Obter Chave da OpenAI

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Faça login ou crie uma conta
3. Vá para [API Keys](https://platform.openai.com/api-keys)
4. Clique em "Create new secret key"
5. Copie a chave e adicione ao arquivo `.env`

### 5. Executar a API

**Modo de desenvolvimento (com hot-reload):**
```bash
npm run dev
```

**Modo de produção:**
```bash
npm start
```

A API estará disponível em `http://localhost:8080`

### 6. Testar a API

```bash
# Verificar saúde da API
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

## 📚 Endpoints Principais

### Health Check

```http
GET /health
```

### Autenticação

```http
POST /auth/login
POST /auth/register
POST /auth/forgot-password
GET /users/me
```

### Chat com IA

```http
POST /ai/chat
```

**Body:**
```json
{
  "message": "Quais são os principais riscos em uma obra?"
}
```

**Resposta:**
```json
{
  "reply": "Os principais riscos em uma obra incluem..."
}
```

### Análise de Imagem

```http
POST /ai/analyze-image
```

**Tipo:** `multipart/form-data`

**Campo:** `image` (arquivo JPG, PNG ou WEBP)

**Resposta:**
```json
{
  "tipo": "Trabalho em altura",
  "descricao": "Foi identificada uma situação de trabalho em altura sem proteção coletiva visível.",
  "gravidade": "critica",
  "local": "Área da obra",
  "recomendacao": "Interromper a atividade e providenciar proteção contra quedas adequada."
}
```

### Ocorrências

```http
GET /occurrences           # Listar todas
POST /occurrences          # Criar nova
PUT /occurrences/:id       # Atualizar
DELETE /occurrences/:id    # Deletar
```

### Alertas

```http
GET /alerts                    # Listar alertas de alta/crítica
PUT /alerts/:id/resolve        # Marcar como resolvido
```

### Dashboard

```http
GET /dashboard
```

**Resposta:**
```json
{
  "totalOccurrences": 10,
  "openOccurrences": 4,
  "criticalOccurrences": 2,
  "resolvedOccurrences": 6,
  "safetyScore": 82
}
```

### Recomendações de IA

```http
GET /ai/recommendations
```

### Relatórios

```http
GET /reports               # Listar
POST /reports              # Criar novo
```

## 🔐 Segurança

### Implementações de Segurança

✅ **CORS** - Controle de origem cruzada  
✅ **Rate Limiting** - 100 requisições por 15 minutos por IP  
✅ **Validação de arquivos** - Apenas JPG, PNG, WEBP  
✅ **Limite de tamanho** - Máximo 10 MB por imagem  
✅ **Tratamento de erros** - Sem exposição de secrets  
✅ **Variáveis de ambiente** - Chaves nunca no código  

### 🚫 O que NÃO fazer

```javascript
// ❌ ERRADO - Nunca coloque a chave assim
const apiKey = "sk-1234567890abcdef";

// ✅ CORRETO - Use variáveis de ambiente
const apiKey = process.env.OPENAI_API_KEY;
```

## 📱 Conexão com Flutter

No seu aplicativo Flutter, configure a URL base:

```dart
class ApiService {
  static const String baseUrl = 'https://seu-servico.onrender.com';
  
  Future<void> chatWithAI(String message) async {
    final response = await http.post(
      Uri.parse('$baseUrl/ai/chat'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'message': message}),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      print(data['reply']);
    }
  }
}
```

## 🌐 Publicar no Render

### Passo 1: Preparar o Repositório

```bash
# Certifique-se de que .env NÃO está no Git
# Confirme que .env.example está presente
git add .
git commit -m "Prepare for Render deployment"
git push
```

### Passo 2: Criar Serviço no Render

1. Acesse [render.com](https://render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name:** `obrasegura-api`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (ou pago conforme necessário)

### Passo 3: Adicionar Variáveis de Ambiente

No painel do Render:

1. Vá para "Environment"
2. Adicione as variáveis:

| Variável | Valor | Exemplo |
|----------|-------|---------|
| `OPENAI_API_KEY` | Sua chave da OpenAI | `sk-...` |
| `OPENAI_MODEL` | Modelo de texto | `gpt-4o` |
| `OPENAI_VISION_MODEL` | Modelo de visão | `gpt-4o` |
| `CORS_ORIGIN` | URL da sua aplicação | `*` ou `https://seu-app.com` |

### Passo 4: Deploy

1. Clique em "Deploy"
2. Aguarde a conclusão (2-3 minutos)
3. Teste em `https://seu-servico.onrender.com/health`

## 📊 Estrutura do Projeto

```
obrasegura-api/
├── server.mjs              # Servidor principal
├── package.json            # Dependências
├── render.yaml             # Configuração de deploy
├── .env.example            # Exemplo de variáveis
├── .gitignore              # Arquivos ignorados
├── data.json               # Banco de dados local
└── README.md               # Este arquivo
```

## 🛠️ Dependências

| Pacote | Versão | Propósito |
|--------|--------|----------|
| `express` | ^4.18.2 | Framework web |
| `cors` | ^2.8.5 | Controle CORS |
| `dotenv` | ^16.3.1 | Variáveis de ambiente |
| `multer` | ^1.4.5 | Upload de arquivos |
| `express-rate-limit` | ^7.1.5 | Rate limiting |
| `openai` | ^4.52.0 | SDK da OpenAI |

## 📝 Exemplos de Uso

### Exemplo 1: Chat com IA

```bash
curl -X POST http://localhost:8080/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Quais são os riscos de queda em altura?"}'
```

### Exemplo 2: Criar Ocorrência

```bash
curl -X POST http://localhost:8080/occurrences \
  -H "Content-Type: application/json" \
  -d '{
    "tipo":"Falta de EPI",
    "descricao":"Trabalhador sem capacete",
    "gravidade":"alta",
    "local":"Setor A",
    "recomendacao":"Fornecer EPI adequado"
  }'
```

### Exemplo 3: Analisar Imagem

```bash
curl -X POST http://localhost:8080/ai/analyze-image \
  -F "image=@/caminho/para/imagem.jpg"
```

## 🐛 Troubleshooting

### Erro: "OPENAI_API_KEY não está configurada"

**Solução:**
1. Copie `.env.example` para `.env`
2. Adicione sua chave da OpenAI
3. Reinicie a aplicação

### Erro: "Cannot find module 'express'"

**Solução:**
```bash
npm install
```

### Porta 8080 já em uso

**Solução:**
```bash
# Usar outra porta
PORT=3000 npm start

# Ou matar processo na porta
# macOS/Linux
lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

## 📖 Documentação Adicional

- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Express.js Guide](https://expressjs.com/)
- [Render Deployment](https://render.com/docs)
- [Multer Documentation](https://github.com/expressjs/multer)

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.

## 👤 Autor

**rianne575**

- GitHub: [@rianne575](https://github.com/rianne575)

## ⭐ Suporte

Se este projeto foi útil, considere deixar uma estrela! ⭐

Para problemas, abra uma issue no GitHub.

---

**ObraSegura - Segurança Inteligente em Obras** 🏗️🔒
````
