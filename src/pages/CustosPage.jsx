import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

function CustosPage() {
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(
    hoje.getMonth() + 1
  ).padStart(2, "0")}`;

  const [searchParams, setSearchParams] = useSearchParams();
  const mesFiltro = searchParams.get("mes") || mesAtual;

  const [custos, setCustos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const categorias = [
    "alimentacao",
    "pecas",
    "despesas_ocasionais",
    "despesas_fixas",
    "manutencao",
    "funcionarios",
  ];

  const nomesCategorias = {
    alimentacao: "Alimentação",
    pecas: "Peças",
    despesas_ocasionais: "Despesas ocasionais",
    despesas_fixas: "Despesas fixas",
    manutencao: "Manutenção",
    funcionarios: "Funcionários",
  };

  useEffect(() => {
    buscarCustos();
  }, [mesFiltro]);

  async function buscarCustos() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("custos")
      .select("*")
      .eq("mes_referencia", mesFiltro)
      .order("data", { ascending: false });

    if (error) {
      console.error("Erro ao buscar custos:", error);
      setCustos([]);
    } else {
      setCustos(data || []);
    }

    setCarregando(false);
  }

  const custosMes = useMemo(() => {
    return [...custos].sort((a, b) =>
      String(b.data || "").localeCompare(String(a.data || ""))
    );
  }, [custos]);

  const resumo = useMemo(() => {
    const base = {
      alimentacao: 0,
      pecas: 0,
      despesas_ocasionais: 0,
      despesas_fixas: 0,
      manutencao: 0,
      funcionarios: 0,
      total: 0,
      fixos: 0,
      variaveis: 0,
      pendentes: 0,
    };

    custosMes.forEach((custo) => {
      const valor = Number(custo.valor || 0);

      if (base[custo.categoria] !== undefined) {
        base[custo.categoria] += valor;
      }

      if (custo.tipo_natureza === "fixo") base.fixos += valor;
      if (custo.tipo_natureza === "variavel") base.variaveis += valor;
      if (custo.status === "pendente" || custo.status === "parcial") {
        base.pendentes += valor;
      }

      base.total += valor;
    });

    return base;
  }, [custosMes]);

  const ultimosLancamentos = custosMes.slice(0, 6);

  const formatarMoeda = (valor) =>
    Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <div className="container clientes-page">
      <div className="clientes-header">
        <div>
          <h1>Custos</h1>
          <p className="subtitulo">
            Controle mensal de despesas, comprovantes e organização financeira
          </p>
        </div>
      </div>

      <div className="clientes-topbar">
        <input
          type="month"
          value={mesFiltro}
          onChange={(e) => setSearchParams({ mes: e.target.value })}
          className="clientes-pesquisa-input"
          style={{ maxWidth: 220 }}
        />

        <Link
          to={`/custos/novo?mes=${mesFiltro}`}
          className="btn-principal"
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          + Novo custo
        </Link>
      </div>

      <div className="cliente-dados-grid" style={{ marginTop: 24 }}>
        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Despesa total do mês</span>
          <strong>{formatarMoeda(resumo.total)}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Custos fixos</span>
          <strong>{formatarMoeda(resumo.fixos)}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Custos variáveis</span>
          <strong>{formatarMoeda(resumo.variaveis)}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Pendentes / parciais</span>
          <strong>{formatarMoeda(resumo.pendentes)}</strong>
        </div>
      </div>

      <div className="clientes-lista-header" style={{ marginTop: 30 }}>
        <h2 className="clientes-secao-titulo">Resumo por categoria</h2>
        <span className="clientes-quantidade">{mesFiltro}</span>
      </div>

      <div className="cliente-dados-grid" style={{ marginTop: 14 }}>
        {categorias.map((categoria) => (
          <Link
            key={categoria}
            to={`/custos/categoria/${categoria}?mes=${mesFiltro}`}
            className="cliente-dado-box resumo-servico-card"
            style={{ textDecoration: "none" }}
          >
            <span className="cliente-dado-label">
              {nomesCategorias[categoria]}
            </span>
            <strong>{formatarMoeda(resumo[categoria])}</strong>
          </Link>
        ))}
      </div>

      <div className="clientes-lista-header" style={{ marginTop: 32 }}>
        <h2 className="clientes-secao-titulo">Últimos lançamentos do mês</h2>
        <span className="clientes-quantidade">
          {custosMes.length} {custosMes.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      {carregando ? (
        <div className="clientes-vazio" style={{ marginTop: 14 }}>
          <h3>Carregando custos...</h3>
        </div>
      ) : ultimosLancamentos.length === 0 ? (
        <div className="clientes-vazio" style={{ marginTop: 14 }}>
          <h3>Nenhum custo registrado</h3>
          <p>Os lançamentos desse mês aparecerão aqui.</p>
        </div>
      ) : (
        <div className="clientes-grid-horizontal" style={{ marginTop: 14 }}>
          {ultimosLancamentos.map((custo) => (
            <div key={custo.id} className="cliente-link-card">
              <div className="cliente-lista-item-topo">
                <h3>
                  {custo.funcionario_nome ||
                    custo.subtipo ||
                    custo.descricao ||
                    "Custo sem descrição"}
                </h3>
                <span>{formatarMoeda(custo.valor)}</span>
              </div>

              <p>
                <strong>Categoria:</strong> {nomesCategorias[custo.categoria]}
              </p>
              <p><strong>Status:</strong> {custo.status || "Não informado"}</p>
              <p>
                <strong>Centro de custo:</strong>{" "}
                {custo.centro_custo || "Não informado"}
              </p>
              <p>
                <strong>Pagamento:</strong>{" "}
                {custo.forma_pagamento || "Não informado"}
              </p>
              <small>
                <strong>Anexo:</strong> {custo.anexo_nome || "Não informado"}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustosPage;