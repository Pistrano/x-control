import { Link, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

function CustosCategoriaPage() {
  const { categoria } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(
    hoje.getMonth() + 1
  ).padStart(2, "0")}`;

  const mesFiltro = searchParams.get("mes") || mesAtual;
  const [custos, setCustos] = useState([]);
  const [carregando, setCarregando] = useState(true);

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
  }, [categoria, mesFiltro]);

  async function buscarCustos() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("custos")
      .select("*")
      .eq("categoria", categoria)
      .eq("mes_referencia", mesFiltro)
      .order("data", { ascending: false });

    if (error) {
      console.error("Erro ao buscar custos da categoria:", error);
      setCustos([]);
    } else {
      setCustos(data || []);
    }

    setCarregando(false);
  }

  const custosCategoria = useMemo(() => {
    return [...custos].sort((a, b) =>
      String(b.data || "").localeCompare(String(a.data || ""))
    );
  }, [custos]);

  const totalCategoria = custosCategoria.reduce(
    (acc, custo) => acc + Number(custo.valor || 0),
    0
  );

  const formatarMoeda = (valor) =>
    Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  async function excluirCusto(id) {
    const confirmar = window.confirm("Deseja excluir este custo?");
    if (!confirmar) return;

    const { error } = await supabase.from("custos").delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir custo:", error);
      alert("Erro ao excluir custo.");
      return;
    }

    buscarCustos();
  }

  return (
    <div className="container clientes-page">
      <div className="cliente-detalhe-header">
        <div>
          <h1>{nomesCategorias[categoria]}</h1>
          <p className="subtitulo">Detalhamento da categoria</p>
        </div>

        <Link
          to={`/custos?mes=${mesFiltro}`}
          className="btn-secundario-ativo"
          style={{ textDecoration: "none" }}
        >
          Voltar
        </Link>
      </div>

      <div className="clientes-topbar" style={{ marginTop: 24 }}>
        <input
          type="month"
          value={mesFiltro}
          onChange={(e) => setSearchParams({ mes: e.target.value })}
          className="clientes-pesquisa-input"
          style={{ maxWidth: 220 }}
        />
      </div>

      <div
        className="cliente-dado-box resumo-servico-card"
        style={{ marginTop: 20, maxWidth: 320 }}
      >
        <span className="cliente-dado-label">Total da categoria</span>
        <strong>{formatarMoeda(totalCategoria)}</strong>
      </div>

      {carregando ? (
        <div className="clientes-vazio" style={{ marginTop: 20 }}>
          <h3>Carregando custos...</h3>
        </div>
      ) : custosCategoria.length === 0 ? (
        <div className="clientes-vazio" style={{ marginTop: 20 }}>
          <h3>Nenhum custo nessa categoria</h3>
          <p>Os lançamentos aparecerão aqui.</p>
        </div>
      ) : (
        <div className="clientes-grid-horizontal" style={{ marginTop: 24 }}>
          {custosCategoria.map((custo) => (
            <div key={custo.id} className="cliente-link-card">
              <div className="cliente-lista-item-topo">
                <h3>
                  {custo.funcionario_nome ||
                    custo.subtipo ||
                    custo.descricao ||
                    "Sem descrição"}
                </h3>

                <span>{formatarMoeda(custo.valor)}</span>
              </div>

              {custo.funcionario_nome ? (
                <>
                  <p><strong>Funcionário:</strong> {custo.funcionario_nome}</p>
                  <p>
                    <strong>Função:</strong>{" "}
                    {custo.funcionario_funcao || "Não informada"}
                  </p>
                  <p><strong>Tipo:</strong> {custo.subtipo || "Não informado"}</p>
                  <p>
                    <strong>Bruto:</strong> {formatarMoeda(custo.valor_bruto)}
                  </p>
                  <p>
                    <strong>Descontos:</strong> {formatarMoeda(custo.descontos)}
                  </p>
                  <p>
                    <strong>Líquido:</strong> {formatarMoeda(custo.valor_liquido)}
                  </p>
                </>
              ) : (
                <>
                  <p><strong>Subtipo:</strong> {custo.subtipo || "Não informado"}</p>
                  <p>
                    <strong>Fornecedor:</strong>{" "}
                    {custo.fornecedor || "Não informado"}
                  </p>
                  <p>
                    <strong>Natureza:</strong>{" "}
                    {custo.tipo_natureza || "Não informado"}
                  </p>
                </>
              )}

              <p>
                <strong>Centro:</strong>{" "}
                {custo.centro_custo || "Não informado"}
              </p>
              <p><strong>Status:</strong> {custo.status || "Não informado"}</p>
              <p>
                <strong>Pagamento:</strong>{" "}
                {custo.forma_pagamento || "Não informado"}
              </p>
              <p><strong>Data:</strong> {custo.data || "Não informada"}</p>

              {custo.descricao && (
                <p><strong>Descrição:</strong> {custo.descricao}</p>
              )}

              {custo.observacoes && (
                <p><strong>Observações:</strong> {custo.observacoes}</p>
              )}

              <small>
                <strong>Anexo:</strong> {custo.anexo_nome || "Não informado"}
              </small>

              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="btn-excluir"
                  onClick={() => excluirCusto(custo.id)}
                >
                  Excluir custo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustosCategoriaPage;