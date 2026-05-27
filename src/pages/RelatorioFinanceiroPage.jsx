import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

function RelatorioFinanceiroPage() {
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  const [mesFiltro, setMesFiltro] = useState(mesAtual);
  const [pesquisa, setPesquisa] = useState("");

  const [custos] = useState(() => {
    try {
      const salvo = localStorage.getItem("custos_funilaria");
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const custosMes = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return custos.filter((custo) => {
      const bateMes = String(custo.mesReferencia || "") === mesFiltro;

      const batePesquisa =
        !termo ||
        String(custo.categoria || "").toLowerCase().includes(termo) ||
        String(custo.subtipo || "").toLowerCase().includes(termo) ||
        String(custo.descricao || "").toLowerCase().includes(termo) ||
        String(custo.fornecedor || "").toLowerCase().includes(termo) ||
        String(custo.funcionarioNome || "").toLowerCase().includes(termo) ||
        String(custo.formaPagamento || "").toLowerCase().includes(termo);

      return bateMes && batePesquisa;
    });
  }, [custos, mesFiltro, pesquisa]);

  const resumo = useMemo(() => {
    return custosMes.reduce(
      (acc, custo) => {
        const valor = Number(custo.valor || 0);
        acc.total += valor;
        if (custo.tipoNatureza === "fixo") acc.fixos += valor;
        if (custo.tipoNatureza === "variavel") acc.variaveis += valor;
        if (custo.status === "pendente" || custo.status === "parcial") {
          acc.pendentes += valor;
        }
        return acc;
      },
      { total: 0, fixos: 0, variaveis: 0, pendentes: 0 }
    );
  }, [custosMes]);

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function baixarPDF() {
    window.print();
  }

  return (
    <div className="container clientes-page">
      <div className="cliente-detalhe-header">
        <div>
          <h1>Relatório Financeiro</h1>
          <p className="subtitulo">Custos e pendências do período</p>
        </div>

        <div className="cliente-detalhe-top-actions no-print">
          <button type="button" className="btn-principal" onClick={baixarPDF}>
            Baixar PDF
          </button>

          <Link
            to="/relatorios"
            className="btn-secundario-ativo"
            style={{ textDecoration: "none" }}
          >
            Voltar
          </Link>
        </div>
      </div>

      <div className="clientes-topbar no-print" style={{ marginTop: 22, flexWrap: "wrap" }}>
        <input
          type="month"
          value={mesFiltro}
          onChange={(e) => setMesFiltro(e.target.value)}
          className="clientes-pesquisa-input"
          style={{ maxWidth: 220 }}
        />

        <input
          type="text"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar categoria, descrição, fornecedor, funcionário..."
          className="clientes-pesquisa-input"
        />
      </div>

      <div className="cliente-dados-grid" style={{ marginTop: 22 }}>
        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Custo total</span>
          <strong>{formatarMoeda(resumo.total)}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Fixos</span>
          <strong>{formatarMoeda(resumo.fixos)}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Variáveis</span>
          <strong>{formatarMoeda(resumo.variaveis)}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Pendentes</span>
          <strong>{formatarMoeda(resumo.pendentes)}</strong>
        </div>
      </div>

      <div className="clientes-grid-horizontal" style={{ marginTop: 22 }}>
        {custosMes.map((custo) => (
          <div key={custo.id} className="cliente-link-card">
            <div className="cliente-lista-item-topo">
              <h3>{custo.funcionarioNome || custo.subtipo || custo.descricao || "Custo"}</h3>
              <span>{formatarMoeda(custo.valor)}</span>
            </div>

            <p><strong>Categoria:</strong> {custo.categoria}</p>
            <p><strong>Status:</strong> {custo.status || "Não informado"}</p>
            <p><strong>Natureza:</strong> {custo.tipoNatureza || "Não informada"}</p>
            <p><strong>Pagamento:</strong> {custo.formaPagamento || "Não informado"}</p>
            <small>
              <strong>Competência:</strong> {custo.mesReferencia || "Não informada"}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RelatorioFinanceiroPage;