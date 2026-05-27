-- Corrige o erro:
-- "new row violates row-level security policy for table funcionarios"
--
-- Rode este arquivo no Supabase:
-- Dashboard > SQL Editor > New query > cole tudo > Run.
--
-- O app ja exige login antes de abrir as telas internas, entao estas policies
-- permitem que usuarios autenticados leiam, criem, editem e excluam registros.

alter table public.funcionarios enable row level security;
alter table public.funcionarios_movimentacoes enable row level security;

drop policy if exists "funcionarios_select_authenticated" on public.funcionarios;
drop policy if exists "funcionarios_insert_authenticated" on public.funcionarios;
drop policy if exists "funcionarios_update_authenticated" on public.funcionarios;
drop policy if exists "funcionarios_delete_authenticated" on public.funcionarios;

create policy "funcionarios_select_authenticated"
on public.funcionarios
for select
to authenticated
using (true);

create policy "funcionarios_insert_authenticated"
on public.funcionarios
for insert
to authenticated
with check (true);

create policy "funcionarios_update_authenticated"
on public.funcionarios
for update
to authenticated
using (true)
with check (true);

create policy "funcionarios_delete_authenticated"
on public.funcionarios
for delete
to authenticated
using (true);

drop policy if exists "funcionarios_movimentacoes_select_authenticated" on public.funcionarios_movimentacoes;
drop policy if exists "funcionarios_movimentacoes_insert_authenticated" on public.funcionarios_movimentacoes;
drop policy if exists "funcionarios_movimentacoes_update_authenticated" on public.funcionarios_movimentacoes;
drop policy if exists "funcionarios_movimentacoes_delete_authenticated" on public.funcionarios_movimentacoes;

create policy "funcionarios_movimentacoes_select_authenticated"
on public.funcionarios_movimentacoes
for select
to authenticated
using (true);

create policy "funcionarios_movimentacoes_insert_authenticated"
on public.funcionarios_movimentacoes
for insert
to authenticated
with check (true);

create policy "funcionarios_movimentacoes_update_authenticated"
on public.funcionarios_movimentacoes
for update
to authenticated
using (true)
with check (true);

create policy "funcionarios_movimentacoes_delete_authenticated"
on public.funcionarios_movimentacoes
for delete
to authenticated
using (true);
