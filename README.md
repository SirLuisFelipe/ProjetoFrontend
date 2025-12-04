## Aplicação disponivel em:
https://colanapista.vercel.app/pages/login.html

## Usuarios para teste: 

#### Admin
Email: Professor@gmail.com <br>
Senha: Professor@2025

#### Usuario
Email: Checkin@gmail.com <br>
Senha: Checkin@123

## Roteiro para Avaliadores (professores)
Use o passo a passo abaixo como guia ao testar o frontend durante as avaliacoes da disciplina. Ele cobre as funcionalidades principais para os perfis de usuario padrao e administrador.

### 1. Login e criacao de contas
- Utilize as credenciais compartilhadas com o professor Diogo para acessar rapidamente a aplicacao.
- Caso prefira testar com novos perfis, registre-se como novo usuario atraves da tela de login ou ja com usuario **Admin** logado, abra **Usuarios > Novo Usuario** e cadastre um usuario padrao ou marque a opcao **Admin** para validar permissoes elevadas.

### 2. Tela de Reservas (`pages/reserva.html`)
- A lista central mostra todas as reservas vinculadas ao seu usuario; administradores visualizam o consolidado de toda a base.
- Ao clicar em qualquer data do calendario surgem no grafico de barras abaixo os turnos livres/ocupados daquele dia, facilitando identificar o menor indice de ocupação.
- Clique em **Realizar uma reserva** para abrir o formulario e preencha campos obrigatorios (pista, turno, forma de pagamento).

### 3. Check-in e atualizacoes de status
- No dia do agendamento, quando o usuario executar o login ira apresentar uma tela obrigando o usuario a realizar o **Check-in** antes de uma nova reserva.
- Reservas que ja passaram nao podem ser canceladas pelo usuario final, o status da mesma ficara como **Não Realizado**; apenas agendamentos futuros exibem o atalho de cancelamento.

### 4. Cancelamentos e edicoes
- Usuarios comuns podem cancelar somente suas proprias reservas futuras; o card apresenta um icone de lixeira.
- Administradores conseguem cancelar reservas futuras de qualquer usuario e alterar dados cadastrais em **Usuarios > Editar**.
- Tambem e possivel promover perfis a **Admin** diretamente na tela de edicao, acelerando os testes com permissoes diferentes.

### 5. Painel administrativo
- Acesse `pages/dashboard.html` para visualizar indicadores de reservas por periodo, modalidade de pagamento e evolucao diaria.
- Utilize o filtro superior (intervalo de datas) para provar que os graficos sao recalculados conforme o periodo selecionado; apenas administradores veem esta tela.

> Sugestao: percorra o fluxo completo criando uma reserva, realizando o check-in e, em seguida, cancelando como administrador para observar todas as transicoes de status.

# --------------
# ProjetoFrontend

Interface web usada para consumir os endpoints do sistema de reservas. O projeto foi escrito em HTML/CSS/JavaScript puro, sem ferramentas de build, então basta servir os arquivos estáticos para usar.

## Requisitos
- Navegador moderno (Chrome, Edge, Firefox, etc.)
- Opcional para servir os arquivos localmente: [Node.js 18+](https://nodejs.org/) ou alguma extensão que rode um servidor HTTP simples (ex.: Live Server no VS Code)
- Backend rodando em `http://localhost:8080/reservation` (ambiente local). Em ambientes publicados (ex.: Vercel) usamos um proxy HTTPS (`/api/backend`) que encaminha as chamadas para o endereco definido na variavel `BACKEND_BASE_URL`.

## Como Rodar Localmente

### Opção 1 — VS Code + Live Server
1. Abra esta pasta no VS Code.
2. Instale a extensão **Live Server**.
3. Clique com o botão direito no arquivo `pages/reserva.html` e escolha **Open with Live Server**.
4. O navegador abrira automaticamente (por padrao na porta `5500`). Em ambiente local o frontend aponta para `http://localhost:8080/reservation`; ao publicar (ex.: Vercel) ele passa a consumir `/api/backend`, que o proxy serverless encaminha para o backend definido em `BACKEND_BASE_URL`.

### Opção 2 — Servidor HTTP via Node.js
1. Na raiz do projeto, instale (uma única vez) o pacote `http-server`:
   ```bash
   npm install -g http-server
   ```
2. Suba o servidor apontando para a pasta do projeto (use a porta que preferir; 5500 é a mesma usada no VS Code):
   ```bash
   http-server . -p 5500
   ```
3. Acesse `http://localhost:5500/pages/reserva.html` no navegador.

> **Importante:** antes de testar o frontend, garanta que o backend esteja rodando (docker ou `./mvnw spring-boot:run`) e que o banco esteja disponível, conforme instruções do repositório backend.

## Páginas Principais
- **`pages/reserva.html`** — painel de reservas usado por usuários comuns. Todos os controles e gráficos são carregados a partir dos endpoints `/scheduling/*`.
- **`pages/dashboard.html`** — painel administrativo com indicadores (por pista, pagamento, usuários, timeline e cancelamentos).
- **`pages/usuarios.html`** — tela administrativa para cadastro/edição de usuários.

## Estrutura do Código
- **`Assets/css`** — estilos compartilhados e específicos de cada tela (`reserva.css`, `dashboard.css`, `usuarios.css`).
- **`Assets/js`** — lógica das páginas (`reserva.js`, `dashboard.js`, `usuarios.js`). Os endpoints do backend estão agrupados em `API_BASE_URL` dentro de cada arquivo.
- **`Assets/img`** — ícones e imagens usados nas telas.

## Endpoints Consumidos
O frontend utiliza a API exposta pelo backend. Alguns dos endpoints principais:
- Autenticação/usuários: `/auth/login`, `/user/*`
- Reservas: `/scheduling/`, `/scheduling/user/{id}`, `/scheduling/{id}/status`
- Indicadores: `/scheduling/analytics/*` (pista, pagamento, usuário, timeline, cancellations, day-range)

Caso o backend esteja em outro endereco:
- Localmente: ajuste temporariamente as constantes `API_BASE_URL` nos arquivos `.js` (ou defina `window.API_BASE_URL` antes de carregar as p?ginas).
- Deploy na Vercel: atualize a variavel de ambiente `BACKEND_BASE_URL` e realize um novo deploy; o proxy `/api/backend/*` encaminhara todas as chamadas HTTPS automaticamente.

## Proxy HTTPS no deploy (Vercel)
- A pasta `api/backend/[...path].js` define uma Serverless Function que replica o m?todo, headers e corpo da requisi??o, encaminhando-os para `process.env.BACKEND_BASE_URL` e devolvendo o status/resposta para o browser.
- Dessa forma evitamos erros de *mixed content*: o navegador fala somente com `https://<dominio>/api/backend/...`, enquanto a fun??o usa HTTP para conversar com o backend real.
- Como configurar:
  1. No dashboard da Vercel, abra **Settings ? Environment Variables** do projeto.
  2. Defina `BACKEND_BASE_URL` (Preview/Production) apontando para `http://99.79.51.142:8080/reservation` ou qualquer outro endpoint do backend.
  3. Rode um novo deploy (push ou `vercel --prod`). N?o ? preciso alterar os arquivos do frontend.
  4. Sempre que o IP ou porta mudar, atualize apenas essa vari?vel e redeploye.

## Dicas
- Se precisar simular dados, suba o backend com Docker conforme README do repositório backend e execute o script SQL de seed.
- Para depurar requisições, abra o DevTools do navegador (F12) e use a aba **Network**.

Com isso você já consegue rodar o frontend em qualquer ambiente sem precisar de builds adicionais.

## Testes
O projeto utiliza [Jest](https://jestjs.io/) para cobrir utilitários da tela de reservas (funções de formatação e normalização em `Assets/js/reserva-helpers.js`).

### Executar localmente
1. Garanta que tenha Node.js 18+ instalado.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Rode os testes:
   ```bash
   npm test
   ```
Os relatórios LCOV são gerados automaticamente em `coverage/lcov.info` pelo próprio Jest, podendo ser enviados ao SonarCloud.

## Análise no SonarCloud
O arquivo `sonar-project.properties` já aponta para o projeto **SirLuisFelipe_ProjetoFrontend** dentro da organização **sirluisfelipe** no SonarCloud. Ele também guarda o token informado pelo usuário para permitir a execução local do scanner.

### Como enviar uma análise
1. Instale o `sonar-scanner` (ou use um pipeline/Action que o execute automaticamente).
2. Rode os testes do frontend e gere o relatório LCOV em `coverage/lcov.info`. Exemplo usando Jest:
   ```bash
   npm install
   npm test -- --coverage --coverageReporters=lcov
   ```
3. Defina o token em uma variável de ambiente (ex.: `set SONAR_TOKEN=...` no Windows ou `export SONAR_TOKEN=...` no macOS/Linux) e execute:
   ```bash
   sonar-scanner -Dsonar.login=%SONAR_TOKEN%        # Windows (PowerShell: $env:SONAR_TOKEN)
   # ou
   sonar-scanner -Dsonar.login=$SONAR_TOKEN         # macOS / Linux
   ```
   O comando utiliza as configurações do arquivo e envia métricas + cobertura para o SonarCloud.

> Em pipelines, prefira definir o token em uma variável de ambiente (ex.: `SONAR_TOKEN`) e sobrescrever `sonar.login` durante a execução para evitar expor o segredo no repositório.

### GitHub Actions
Este repositório já possui o workflow `.github/workflows/sonar.yml`, que:
- Faz checkout do código e prepara o Node 18;
- Executa `npm ci` e `npm test -- --coverage --coverageReporters=lcov` somente se `package-lock.json` existir;
- Garante um `coverage/lcov.info` (gera um placeholder quando não há testes);
- Chama o `sonarcloud-github-action`.

Para que a Action funcione, configure o segredo `SONAR_TOKEN` no repositório do GitHub (Settings → Secrets → Actions). O `GITHUB_TOKEN` padrão já é fornecido pelo GitHub. Depois disso, todo push/PR contra `main` dispara a análise automática no SonarCloud.
