-- Corrige o salvamento de servicos.
--
-- Rode este arquivo no Supabase:
-- Dashboard > SQL Editor > New query > cole tudo > Run.
--
-- A tela de servicos usa estes campos para valores, pagamento, funileiro,
-- observacoes e resumo financeiro. Sem eles, o Supabase recusa o insert/update.

alter table public.servicos
add column if not exists status_pagamento text default 'Pendente',
add column if not exists tipo_pagamento text,
add column if not exists funileiro_responsavel text,
add column if not exists valor_total numeric default 0,
add column if not exists valor_gasto numeric default 0,
add column if not exists comissao numeric default 0,
add column if not exists valor_liquido numeric default 0,
add column if not exists observacoes text,
add column if not exists encerrado boolean default false,
add column if not exists created_at timestamptz default now();

update public.servicos
set
  tipo_servico = coalesce(tipo_servico, 'Serviço'),
  status_pagamento = coalesce(status_pagamento, 'Pendente'),
  valor = coalesce(valor, valor_total, valor_lavagem, 0),
  valor_total = coalesce(valor_total, 0),
  valor_gasto = coalesce(valor_gasto, 0),
  comissao = coalesce(comissao, 0),
  valor_liquido = coalesce(valor_liquido, 0),
  encerrado = coalesce(encerrado, false),
  created_at = coalesce(created_at, now());

alter table public.servicos
alter column tipo_servico set default 'Serviço';
