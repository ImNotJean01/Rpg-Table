# Mesa — Campanha de RPG

Site para gerenciar campanhas de RPG com os amigos: história em capítulos, apresentação da campanha, guias de sistemas, mural de pistas (handouts), fichas dinâmicas, NPCs, bestiário oculto, biblioteca de livros, rolador de dados no servidor, iniciativa e tabuleiro em tempo real.

---

## Como configurar (Supabase + Local)

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Abra o **SQL Editor** do projeto e execute o arquivo [`supabase_schema.sql`](./supabase_schema.sql).
3. Copie `.env.example` para `.env` e preencha:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Instale e rode localmente:
   ```bash
   npm install
   npm run dev
   ```

> **Dica:** No plano grátis, o Supabase pausa projetos sem uso após 1 semana. Se acontecer, basta entrar no painel e clicar em **Restore**. Você também pode baixar um backup completo da campanha em `.json` na aba **Config**.

---

## Como adicionar um novo sistema de RPG

1. Crie um arquivo em `src/sistemas/<novo-sistema>.js` seguindo o formato de [`src/sistemas/ordem-paranormal.js`](./src/sistemas/ordem-paranormal.js).
2. Registre o novo sistema em [`src/sistemas/index.js`](./src/sistemas/index.js).
3. Faça push na branch `main` — o GitHub Actions publica automaticamente no GitHub Pages.
