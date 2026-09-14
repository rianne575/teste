# ObraSegura API 🏗️🔒

Backend API real e funcional para o aplicativo Flutter **ObraSegura** - Segurança Inteligente em Obras de Construção.

## 📋 Descrição

ObraSegura API é uma API REST desenvolvida com **Node.js** e **Express** que fornece:

- 🤖 **Chat com IA Real** - Assistente especializada em segurança do trabalho
- 📸 **Análise Real de Imagens** - Detecção de riscos usando visão computacional da OpenAI
- 📝 **Gerenciamento de Ocorrências** - CRUD completo de eventos de segurança
- 🚨 **Sistema de Alertas** - Notificações automáticas de riscos críticos
- 📊 **Dashboard** - Métricas e indicadores de segurança
- 📄 **Relatórios** - Documentação de eventos
- 💾 **Persistência** - Dados armazenados em JSON local

## 🚀 Instalação Local

### 1. Pré-requisitos
- **Node.js** 20 ou superior: https://nodejs.org/

### 2. Clonar e instalar

```bash
git clone https://github.com/rianne575/obrasegura-api.git
cd obrasegura-api
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione sua chave da OpenAI:

```env
OPENAI_API_KEY=sk-your-actual-key-here
PORT=8080
OPENAI_MODEL=gpt-5.6-luna
OPENAI_VISION_MODEL=gpt-5.6-luna
CORS_ORIGIN=*
```

### 4. Obter Chave da OpenAI

1. Acesse https://platform.openai.com/api-keys
2. Faça login ou crie uma conta
3. Clique em "Create new secret key"
4. Copie a chave e adicione ao `.env`

### 5. Executar

**Desenvolvimento (com auto-reload):**
```bash
npm run dev
```

**Produção:**
```bash
npm start
```

A API estará disponível em: **http://localhost:8080**

## ✅ Testar

### Health Check
```bash
curl http://localhost:8080/health
```

### Chat com IA
```bash
curl -X POST http://localhost:8080/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Quais são os principais riscos em uma obra?"}'
```

### Análise de Imagem
```bash
curl -X POST http://localhost:8080/ai/analyze-image \
  -F "image=@/caminho/para/foto.jpg"
```

## 📚 Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|----------|
| GET | `/health` | Verificar saúde da API |
| POST | `/ai/chat` | Chat com IA |
| POST | `/ai/analyze-image` | Analisar imagem |
| GET | `/ai/recommendations` | Recomendações de segurança |
| GET | `/occurrences` | Listar ocorrências |
| POST | `/occurrences` | Criar ocorrência |
| PUT | `/occurrences/:id` | Atualizar ocorrência |
| DELETE | `/occurrences/:id` | Deletar ocorrência |
| GET | `/alerts` | Listar alertas |
| PUT | `/alerts/:id/resolve` | Resolver alerta |
| GET | `/dashboard` | Métricas de segurança |
| GET | `/risks` | Listar riscos |
| GET | `/risk-map` | Mapa de riscos por local |
| POST | `/monitoring/analyze` | Análise com monitoramento |
| GET | `/reports` | Listar relatórios |
| POST | `/reports` | Criar relatório |
| POST | `/auth/login` | Login |
| POST | `/auth/register` | Registrar |
| POST | `/auth/forgot-password` | Recuperar senha |
| GET | `/users/me` | Dados do usuário |

## 🌐 Publicar no Render

### Passo 1: Preparar repositório
```bash
git add .
git commit -m "ObraSegura API - Backend pronto para Render"
git push
```

### Passo 2: Criar Web Service no Render
1. Acesse https://render.com
2. Clique em **New +** → **Web Service**
3. Conecte seu repositório GitHub (rianne575/obrasegura-api)
4. Configure:
   - **Name:** `obrasegura-api`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### Passo 3: Adicionar Variáveis de Ambiente

Na seção **Environment Variables**:
- `OPENAI_API_KEY`: Sua chave da OpenAI
- `OPENAI_MODEL`: gpt-5.6-luna
- `OPENAI_VISION_MODEL`: gpt-5.6-luna
- `CORS_ORIGIN`: *
- `NODE_ENV`: production

### Passo 4: Deploy
1. Clique em **Create Web Service**
2. Aguarde 2-3 minutos
3. Teste em: `https://seu-servico.onrender.com/health`

## 📱 Conectar com Flutter

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
}
```

## 🔒 Segurança

✅ CORS habilitado  
✅ Rate limiting (100 req/15 min)  
✅ Validação de upload  
✅ Sem exposição de secrets  
✅ Chave OpenAI em variável de ambiente  
✅ Tratamento global de erros  

## 📦 Dependências

- express - Framework web
- cors - CORS middleware
- dotenv - Variáveis de ambiente
- multer - Upload de arquivos
- express-rate-limit - Rate limiting
- openai - SDK OpenAI oficial

## 🐛 Troubleshooting

### "OPENAI_API_KEY não configurada"
```bash
cp .env.example .env
# Editar .env e adicionar chave
npm run dev
```

### "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### Porta 8080 em uso
```bash
PORT=3000 npm start
```

## 📄 Licença

MIT License - Veja LICENSE para detalhes

## 👤 Autor

**rianne575** - https://github.com/rianne575

---

**ObraSegura - Segurança Inteligente em Obras** 🏗️🔒  
Feito com ❤️ para construção segura
