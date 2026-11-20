-- ============================================================================
-- MESA RPG — Schema completo (Auth, Campanhas, Conteúdo, Tabuleiro, Realtime)
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Perfis de usuário
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default 'Aventureiro',
  criado_em timestamptz not null default now()
);

create or replace function public.criar_perfil_padrao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'nome'), ''), 'Aventureiro'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.criar_perfil_padrao();

-- 2. Campanhas e Membros
create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  sistema text not null default 'ordem-paranormal',
  config jsonb not null default '{}'::jsonb,
  sobre text not null default '',
  codigo_convite text unique not null,
  criada_por uuid references auth.users(id) on delete set null default auth.uid(),
  criada_em timestamptz not null default now()
);

create table if not exists public.membros (
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel text not null check (papel in ('mestre', 'jogador')),
  entrou_em timestamptz not null default now(),
  primary key (campanha_id, user_id)
);

-- Funções auxiliares de permissão
create or replace function public.eh_membro(c uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.membros
    where campanha_id = c and user_id = auth.uid()
  );
$$;

create or replace function public.eh_mestre(c uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.membros
    where campanha_id = c and user_id = auth.uid() and papel = 'mestre'
  );
$$;

-- Criar campanha (quem cria vira mestre + cria estado_mesa + cena inicial)
create or replace function public.criar_campanha(
  p_nome text,
  p_sistema text default 'ordem-paranormal',
  p_sobre text default ''
)
returns public.campanhas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_camp public.campanhas;
  v_codigo text;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  v_codigo := upper(
    substr(replace(gen_random_uuid()::text, '-', ''), 1, 3) || '-' ||
    substr(replace(gen_random_uuid()::text, '-', ''), 4, 3)
  );

  insert into public.campanhas (nome, sistema, sobre, codigo_convite, criada_por)
  values (trim(p_nome), p_sistema, coalesce(p_sobre, ''), v_codigo, auth.uid())
  returning * into v_camp;

  insert into public.membros (campanha_id, user_id, papel)
  values (v_camp.id, auth.uid(), 'mestre');

  insert into public.estado_mesa (campanha_id, rodada, turno_atual)
  values (v_camp.id, 1, null)
  on conflict (campanha_id) do nothing;

  return v_camp;
end;
$$;

-- Entrar em campanha por código de convite
create or replace function public.entrar_campanha(p_codigo text)
returns public.campanhas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_camp public.campanhas;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into v_camp
  from public.campanhas
  where upper(trim(codigo_convite)) = upper(trim(p_codigo));

  if not found then
    raise exception 'Código de convite inválido.';
  end if;

  insert into public.membros (campanha_id, user_id, papel)
  values (v_camp.id, auth.uid(), 'jogador')
  on conflict (campanha_id, user_id) do nothing;

  return v_camp;
end;
$$;

-- 3. Conteúdo da Campanha
create table if not exists public.capitulos (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  titulo text not null,
  conteudo text not null default '',
  ordem int not null default 0,
  publicado boolean not null default false,
  criado_em timestamptz not null default now()
);

create table if not exists public.pistas (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  titulo text not null,
  texto text not null default '',
  imagem_url text,
  visivel boolean not null default false,
  revelada_em timestamptz,
  criado_em timestamptz not null default now()
);

create table if not exists public.personagens (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  dono_id uuid references auth.users(id) on delete set null,
  nome text not null,
  retrato_url text,
  condicoes text[] not null default '{}',
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create table if not exists public.npcs (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  nome text not null,
  papel text not null default '',
  imagem_url text,
  info_publica text not null default '',
  visivel boolean not null default false,
  criado_em timestamptz not null default now()
);

create table if not exists public.npcs_notas (
  npc_id uuid primary key references public.npcs(id) on delete cascade,
  segredo text not null default ''
);

create table if not exists public.criaturas (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  nome text not null,
  imagem_url text,
  condicoes text[] not null default '{}',
  dados jsonb not null default '{}'::jsonb,
  visivel boolean not null default false,
  criado_em timestamptz not null default now()
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  titulo text not null,
  url text not null check (url ~ '^https://'),
  descricao text not null default '',
  categoria text not null default 'referencia',
  idioma text not null default 'pt',
  gratis boolean not null default false,
  ordem int not null default 0,
  criado_por uuid references auth.users(id) on delete set null default auth.uid(),
  criado_em timestamptz not null default now()
);

create table if not exists public.rolagens (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  autor_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  autor_nome text not null,
  rotulo text not null default '',
  expressao text not null,
  dados int[] not null,
  mantidos int[] not null,
  total int not null,
  secreta boolean not null default false,
  criado_em timestamptz not null default now()
);

create table if not exists public.iniciativa (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  nome text not null,
  valor int not null default 0,
  personagem_id uuid references public.personagens(id) on delete set null,
  criatura_id uuid references public.criaturas(id) on delete set null,
  ordem int not null default 0
);

create table if not exists public.estado_mesa (
  campanha_id uuid primary key references public.campanhas(id) on delete cascade,
  rodada int not null default 1,
  turno_atual uuid
);

-- 4. Tabuleiro e Cenas
create table if not exists public.cenas (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  nome text not null default 'Cena 1',
  ambiente text not null default 'masmorra',
  ordem int not null default 0,
  ativa boolean not null default false,
  grade int not null default 70,
  mostrar_grade boolean not null default true,
  fundo_url text,
  fundo_x double precision not null default 0,
  fundo_y double precision not null default 0,
  fundo_escala double precision not null default 1,
  fog_ativo boolean not null default false,
  terreno jsonb not null default '{}'::jsonb,
  nevoa jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create unique index if not exists cenas_unica_ativa_idx
  on public.cenas (campanha_id)
  where ativa = true;

create table if not exists public.desenhos (
  id uuid primary key default gen_random_uuid(),
  cena_id uuid not null references public.cenas(id) on delete cascade,
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  tipo text not null check (tipo in ('caneta', 'linha', 'ret', 'circulo', 'texto')),
  dados jsonb not null default '{}'::jsonb,
  visivel boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.pins (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  cena_id uuid not null references public.cenas(id) on delete cascade,
  nome text not null default 'Pin',
  icone text not null default 'guerreiro',
  cor text not null default '#b3122e',
  tamanho text not null default 'medio',
  x double precision not null default 0,
  y double precision not null default 0,
  personagem_id uuid references public.personagens(id) on delete set null,
  criatura_id uuid references public.criaturas(id) on delete set null,
  usar_retrato boolean not null default false,
  visivel boolean not null default true
);

create table if not exists public.pins_notas (
  pin_id uuid primary key references public.pins(id) on delete cascade,
  notas text not null default ''
);

create table if not exists public.pings_mapa (
  id uuid primary key default gen_random_uuid(),
  cena_id uuid not null references public.cenas(id) on delete cascade,
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  autor_nome text not null,
  x double precision not null,
  y double precision not null,
  cor text not null default '#f59e0b',
  criado_em timestamptz not null default now()
);

-- 5. Funções de Jogo (Dados e Tabuleiro)
create or replace function public.rolar_dados(
  p_campanha uuid,
  p_qtd int,
  p_faces int,
  p_manter text default 'todos',
  p_mod int default 0,
  p_rotulo text default '',
  p_secreta boolean default false
)
returns public.rolagens
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dados int[] := '{}';
  v_mantidos int[] := '{}';
  v_total int := 0;
  v_nome text;
  v_expr text;
  v_rol public.rolagens;
  i int;
  v_val int;
begin
  if not public.eh_membro(p_campanha) then
    raise exception 'Sem acesso a esta campanha.';
  end if;
  if p_qtd < 1 or p_qtd > 30 then
    raise exception 'Quantidade de dados deve ser entre 1 e 30.';
  end if;
  if p_faces < 2 or p_faces > 1000 then
    raise exception 'Faces inválidas.';
  end if;
  if p_secreta and not public.eh_mestre(p_campanha) then
    p_secreta := false;
  end if;

  for i in 1..p_qtd loop
    v_val := floor(random() * p_faces)::int + 1;
    v_dados := array_append(v_dados, v_val);
  end loop;

  if p_manter = 'maior' then
    select array[max(x)] into v_mantidos from unnest(v_dados) as x;
    v_expr := p_qtd || 'd' || p_faces || ' (maior)';
  elsif p_manter = 'menor' then
    select array[min(x)] into v_mantidos from unnest(v_dados) as x;
    v_expr := p_qtd || 'd' || p_faces || ' (menor)';
  else
    v_mantidos := v_dados;
    v_expr := p_qtd || 'd' || p_faces;
  end if;

  if p_mod > 0 then
    v_expr := v_expr || ' +' || p_mod;
  elsif p_mod < 0 then
    v_expr := v_expr || ' ' || p_mod;
  end if;

  select coalesce(sum(x), 0) + p_mod into v_total from unnest(v_mantidos) as x;
  select coalesce(nome, 'Jogador') into v_nome from public.perfis where id = auth.uid();

  insert into public.rolagens (
    campanha_id, autor_id, autor_nome, rotulo, expressao, dados, mantidos, total, secreta
  )
  values (
    p_campanha, auth.uid(), coalesce(v_nome, 'Jogador'), coalesce(p_rotulo, ''),
    v_expr, v_dados, v_mantidos, v_total, p_secreta
  )
  returning * into v_rol;

  return v_rol;
end;
$$;

create or replace function public.ativar_cena(p_cena uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_camp uuid;
begin
  select campanha_id into v_camp from public.cenas where id = p_cena;
  if v_camp is null or not public.eh_mestre(v_camp) then
    raise exception 'Apenas o mestre pode ativar cenas.';
  end if;

  update public.cenas set ativa = false where campanha_id = v_camp and ativa = true;
  update public.cenas set ativa = true where id = p_cena;
end;
$$;

create or replace function public.atualizar_terreno(p_cena uuid, p_patch jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_camp uuid;
begin
  select campanha_id into v_camp from public.cenas where id = p_cena;
  if v_camp is null or not public.eh_mestre(v_camp) then
    raise exception 'Apenas o mestre pode editar o terreno.';
  end if;

  update public.cenas
  set terreno = jsonb_strip_nulls(coalesce(terreno, '{}'::jsonb) || p_patch)
  where id = p_cena;
end;
$$;

create or replace function public.atualizar_nevoa(p_cena uuid, p_patch jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_camp uuid;
begin
  select campanha_id into v_camp from public.cenas where id = p_cena;
  if v_camp is null or not public.eh_mestre(v_camp) then
    raise exception 'Apenas o mestre pode alterar a névoa.';
  end if;

  update public.cenas
  set nevoa = jsonb_strip_nulls(coalesce(nevoa, '{}'::jsonb) || p_patch)
  where id = p_cena;
end;
$$;

-- 6. Row Level Security (RLS)
alter table public.perfis enable row level security;
alter table public.campanhas enable row level security;
alter table public.membros enable row level security;
alter table public.capitulos enable row level security;
alter table public.pistas enable row level security;
alter table public.personagens enable row level security;
alter table public.npcs enable row level security;
alter table public.npcs_notas enable row level security;
alter table public.criaturas enable row level security;
alter table public.links enable row level security;
alter table public.rolagens enable row level security;
alter table public.iniciativa enable row level security;
alter table public.estado_mesa enable row level security;
alter table public.cenas enable row level security;
alter table public.desenhos enable row level security;
alter table public.pins enable row level security;
alter table public.pins_notas enable row level security;
alter table public.pings_mapa enable row level security;

-- Perfis
create policy "Perfis visíveis a autenticados" on public.perfis for select to authenticated using (true);
create policy "Atualizar próprio perfil" on public.perfis for update to authenticated using (id = auth.uid());

-- Campanhas e Membros
create policy "Membros leem campanhas" on public.campanhas for select using (public.eh_membro(id));
create policy "Mestre edita campanha" on public.campanhas for update using (public.eh_mestre(id));
create policy "Mestre apaga campanha" on public.campanhas for delete using (public.eh_mestre(id));

create policy "Membros leem lista de membros" on public.membros for select using (public.eh_membro(campanha_id));
create policy "Mestre gerencia membros" on public.membros for delete using (public.eh_mestre(campanha_id) or user_id = auth.uid());

-- Capítulos
create policy "Ler capítulos" on public.capitulos for select
  using (public.eh_membro(campanha_id) and (publicado or public.eh_mestre(campanha_id)));
create policy "Mestre gerencia capítulos" on public.capitulos for all
  using (public.eh_mestre(campanha_id)) with check (public.eh_mestre(campanha_id));

-- Pistas
create policy "Ler pistas" on public.pistas for select
  using (public.eh_membro(campanha_id) and (visivel or public.eh_mestre(campanha_id)));
create policy "Mestre gerencia pistas" on public.pistas for all
  using (public.eh_mestre(campanha_id)) with check (public.eh_mestre(campanha_id));

-- Personagens
create policy "Membros leem personagens" on public.personagens for select
  using (public.eh_membro(campanha_id));
create policy "Criar próprio personagem ou mestre" on public.personagens for insert
  with check (public.eh_mestre(campanha_id) or (public.eh_membro(campanha_id) and dono_id = auth.uid()));
create policy "Editar próprio personagem ou mestre" on public.personagens for update
  using (public.eh_mestre(campanha_id) or dono_id = auth.uid());
create policy "Mestre ou dono apaga personagem" on public.personagens for delete
  using (public.eh_mestre(campanha_id) or dono_id = auth.uid());

-- NPCs
create policy "Ler NPCs" on public.npcs for select
  using (public.eh_membro(campanha_id) and (visivel or public.eh_mestre(campanha_id)));
create policy "Mestre gerencia NPCs" on public.npcs for all
  using (public.eh_mestre(campanha_id)) with check (public.eh_mestre(campanha_id));
create policy "Segredo de NPC só para mestre" on public.npcs_notas for all
  using (exists (select 1 from public.npcs n where n.id = npc_id and public.eh_mestre(n.campanha_id)))
  with check (exists (select 1 from public.npcs n where n.id = npc_id and public.eh_mestre(n.campanha_id)));

-- Criaturas
create policy "Ler criaturas" on public.criaturas for select
  using (public.eh_membro(campanha_id) and (visivel or public.eh_mestre(campanha_id)));
create policy "Mestre gerencia criaturas" on public.criaturas for all
  using (public.eh_mestre(campanha_id)) with check (public.eh_mestre(campanha_id));

-- Links
create policy "Membros leem links" on public.links for select using (public.eh_membro(campanha_id));
create policy "Mestre gerencia links" on public.links for all
  using (public.eh_mestre(campanha_id)) with check (public.eh_mestre(campanha_id));

-- Rolagens
create policy "Ler rolagens" on public.rolagens for select
  using (public.eh_membro(campanha_id) and (not secreta or autor_id = auth.uid() or public.eh_mestre(campanha_id)));

-- Iniciativa e Estado da Mesa
create policy "Membros leem iniciativa" on public.iniciativa for select using (public.eh_membro(campanha_id));
create policy "Mestre gerencia iniciativa" on public.iniciativa for all
  using (public.eh_mestre(campanha_id)) with check (public.eh_mestre(campanha_id));
create policy "Membros leem estado_mesa" on public.estado_mesa for select using (public.eh_membro(campanha_id));
create policy "Mestre gerencia estado_mesa" on public.estado_mesa for all
  using (public.eh_mestre(campanha_id)) with check (public.eh_mestre(campanha_id));

-- Tabuleiro
create policy "Ler cenas" on public.cenas for select
  using (public.eh_mestre(campanha_id) or (public.eh_membro(campanha_id) and ativa));
create policy "Mestre gerencia cenas" on public.cenas for all
  using (public.eh_mestre(campanha_id)) with check (public.eh_mestre(campanha_id));

create policy "Ler desenhos" on public.desenhos for select
  using (public.eh_mestre(campanha_id) or (public.eh_membro(campanha_id) and visivel
    and exists (select 1 from public.cenas c where c.id = desenhos.cena_id and c.ativa)));
create policy "Mestre gerencia desenhos" on public.desenhos for all
  using (public.eh_mestre(campanha_id)) with check (public.eh_mestre(campanha_id));

create policy "Ler pins" on public.pins for select
  using (public.eh_mestre(campanha_id) or (public.eh_membro(campanha_id) and visivel
    and exists (select 1 from public.cenas c where c.id = pins.cena_id and c.ativa)));
create policy "Mestre cria/apaga pins" on public.pins for insert
  with check (public.eh_mestre(campanha_id));
create policy "Mestre apaga pins" on public.pins for delete
  using (public.eh_mestre(campanha_id));
create policy "Mover pin (mestre ou dono do personagem)" on public.pins for update
  using (public.eh_mestre(campanha_id) or exists (
    select 1 from public.personagens p where p.id = pins.personagem_id and p.dono_id = auth.uid()
  ));

create policy "Notas secretas de pin só para mestre" on public.pins_notas for all
  using (exists (select 1 from public.pins p where p.id = pin_id and public.eh_mestre(p.campanha_id)))
  with check (exists (select 1 from public.pins p where p.id = pin_id and public.eh_mestre(p.campanha_id)));

create policy "Membros leem e enviam pings" on public.pings_mapa for select using (public.eh_membro(campanha_id));
create policy "Membros enviam pings" on public.pings_mapa for insert with check (public.eh_membro(campanha_id));

-- 7. Realtime
alter table public.capitulos replica identity full;
alter table public.pistas replica identity full;
alter table public.personagens replica identity full;
alter table public.npcs replica identity full;
alter table public.criaturas replica identity full;
alter table public.links replica identity full;
alter table public.iniciativa replica identity full;
alter table public.cenas replica identity full;
alter table public.desenhos replica identity full;
alter table public.pins replica identity full;

alter publication supabase_realtime add table
  public.capitulos,
  public.pistas,
  public.personagens,
  public.npcs,
  public.criaturas,
  public.links,
  public.rolagens,
  public.iniciativa,
  public.estado_mesa,
  public.cenas,
  public.desenhos,
  public.pins,
  public.pings_mapa;

-- 8. Storage (bucket público de leitura para retratos, mapas e pistas)
insert into storage.buckets (id, name, public)
values ('imagens', 'imagens', true)
on conflict (id) do nothing;

create policy "Imagens visíveis publicamente" on storage.objects
  for select using (bucket_id = 'imagens');

create policy "Usuários autenticados enviam imagens" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'imagens');

create policy "Usuários atualizam/removem próprias imagens" on storage.objects
  for delete to authenticated
  using (bucket_id = 'imagens' and auth.uid() = owner);

-- 9. Permissões da role authenticated (necessário para acesso via API do Supabase)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

