# ProjetoFrontend

Interface web usada para consumir os endpoints do sistema de reservas. O projeto foi escrito em HTML/CSS/JavaScript puro, sem ferramentas de build, então basta servir os arquivos estáticos para usar.

## Requisitos
- Navegador moderno (Chrome, Edge, Firefox, etc.)
- Opcional para servir os arquivos localmente: [Node.js 18+](https://nodejs.org/) ou alguma extensão que rode um servidor HTTP simples (ex.: Live Server no VS Code)
- Backend rodando em `http://localhost:8080/reservation` (o frontend espera esse endereço por padrão)

## Como Rodar Localmente

### Opção 1 — VS Code + Live Server
1. Abra esta pasta no VS Code.
2. Instale a extensão **Live Server**.
3. Clique com o botão direito no arquivo `pages/reserva.html` e escolha **Open with Live Server**.
4. O navegador abrirá automaticamente (por padrão na porta `5500`), e o frontend já estará apontando para o backend em `http://localhost:8080/reservation`.

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

Caso o backend esteja em outro endereço, atualize a constante `API_BASE_URL` nos arquivos `.js` correspondentes.

## Dicas
- Se precisar simular dados, suba o backend com Docker conforme README do repositório backend e execute o script SQL de seed.
- Para depurar requisições, abra o DevTools do navegador (F12) e use a aba **Network**.

Com isso você já consegue rodar o frontend em qualquer ambiente sem precisar de builds adicionais.
