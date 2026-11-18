# 🎲 Rpg-Table (Mesa de RPG)

Um cantinho feito para juntar os amigos e jogar RPG de mesa online sem precisar pagar assinatura nem se perder em mil abas.

🔗 **Acesse aqui:** https://imnotjean01.github.io/Rpg-Table/

---

## O que tem por aqui?

- **História & Sobre:** espaço para o mestre contar a história em capítulos e deixar as regras da casa combinadas.
- **Pistas (Handouts):** cartas, fotos e documentos que o mestre libera na hora da sessão para todo mundo ver.
- **Fichas & Bestiário:** fichas prontas para **Ordem Paranormal** (com PV, PE, SAN, perícias, rituais e rolagem automática) e um **modo Genérico** para adaptar para qualquer livro, além de NPCs e monstros ocultos.
- **Tabuleiro ao vivo:** mapa com grade, tokens dos personagens, névoa de guerra, régua, ping (`Alt`+clique) e **Assistente de Mapa** (com carimbos de salas, gerador de masmorra e integração opcional com Gemini no plano grátis).
- **Iniciativa & Dados:** ordem de turnos e rolador de dados sincronizados para todo mundo na mesa.
- **Biblioteca & Guias:** links úteis e resumos rápidos de como os sistemas funcionam.

---

## Como jogar com a galera

1. O mestre cria uma conta e cria uma campanha.
2. Na aba **Config**, copia o **código de convite**.
3. Os amigos entram no link, criam a conta e usam o código para entrar na mesa.

---

## Quer rodar no seu PC ou mexer no código?

Feito com **React + Vite**, **Konva** (para o tabuleiro) e **Supabase** (banco, login e tempo real).

1. Crie um projeto grátis no [Supabase](https://supabase.com) e rode o [`supabase_schema.sql`](./supabase_schema.sql) no SQL Editor.
2. Copie o `.env.example` para `.env` e coloque a URL e a chave pública do seu projeto.
3. Rode:
   ```bash
   npm install
   npm run dev
   ```
