import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

function RelatorioEstoquePage() {
  const [pesquisa, setPesquisa] = useState("");

  const estoque = useMemo(() => {
    try {
      const salvo = localStorage.getItem("estoque_funilaria");
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  }, []);

  const itensFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return estoque.filter((item) => {
      return (
        !termo ||
        String(item.nome || "").toLowerCase().includes(termo) ||
        String(item.categoria || "").toLowerCase().includes(termo) ||
        String(item.fornecedor || "").toLowerCase().includes(termo) ||
        String(item.marca || "").toLowerCase().includes(termo) ||
        String(item.codigo || "").toLowerCase().includes(termo)
      );
    });
  }, [estoque, pesquisa]);

  const resumo = useMemo(() => {
    let totalItens = itensFiltrados.length;
    let valorEstoque = 0;
    let baixos = 0;
    let zerados = 0;

    itensFiltrados.forEach((item) => {
      const quantidade = Number(item.quantidade || 0);
      const minimo = Number(item.estoqueMinimo || 0);
      const valorUnitario = Number(item.valorUnitario || 0);

      valorEstoque += quantidade * valorUnitario;

      if (quantidade <= 0) zerados++;
      else if (quantidade <= minimo) baixos++;
    });

    return {
      totalItens,
      valorEstoque,
      baixos,
      zerados,
    };
  }, [itensFiltrados]);

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
          <h1>Relatório de Estoque</h1>
          <p className="subtitulo">Resumo atual do inventário</p>
        </div>

        <div className="cliente-detalhe-top-actions no-print">
          <button
            type="button"
            className="btn-principal"
            onClick={baixarPDF}
          >
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

      <div className="clientes-topbar no-print" style={{ marginTop: 22 }}>
        <input
          type="text"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar item, categoria, fornecedor, marca ou código..."
          className="clientes-pesquisa-input"
        />
      </div>

      <div className="cliente-dados-grid" style={{ marginTop: 22 }}>
        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Itens cadastrados</span>
          <strong>{resumo.totalItens}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Valor em estoque</span>
          <strong>{formatarMoeda(resumo.valorEstoque)}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Estoque baixo</span>
          <strong>{resumo.baixos}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Sem estoque</span>
          <strong>{resumo.zerados}</strong>
        </div>
      </div>

      {itensFiltrados.length === 0 ? (
        <div className="clientes-vazio" style={{ marginTop: 22 }}>
          <h3>Nenhum item encontrado</h3>
          <p>Não há itens para exibir com esse filtro.</p>
        </div>
      ) : (
        <div className="clientes-grid-horizontal" style={{ marginTop: 22 }}>
          {itensFiltrados.map((item) => (
            <div key={item.id} className="cliente-link-card">
              <div className="cliente-lista-item-topo">
                <h3>{item.nome || "Item sem nome"}</h3>
                <span>{item.categoria || "Sem categoria"}</span>
              </div>

              <p>
                <strong>Quantidade:</strong> {item.quantidade || 0}{" "}
                {item.unidade || ""}
              </p>

              <p>
                <strong>Fornecedor:</strong>{" "}
                {item.fornecedor || "Não informado"}
              </p>

              <p>
                <strong>Marca:</strong> {item.marca || "Não informada"}
              </p>

              {item.codigo && (
                <p>
                  <strong>Código:</strong> {item.codigo}
                </p>
              )}

              <p>
                <strong>Valor un.:</strong>{" "}
                {formatarMoeda(item.valorUnitario)}
              </p>

              <small>
                <strong>Valor total:</strong>{" "}
                {formatarMoeda(
                  Number(item.quantidade || 0) *
                    Number(item.valorUnitario || 0)
                )}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RelatorioEstoquePage;