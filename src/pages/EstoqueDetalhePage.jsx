import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function EstoqueDetalhePage() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    setCarregando(true);

    const { data: itemData, error: itemError } = await supabase
      .from("estoque")
      .select("*")
      .eq("id", id)
      .single();

    if (itemError) {
      alert("Erro ao carregar item: " + itemError.message);
      setItem(null);
      setCarregando(false);
      return;
    }

    setItem(itemData);

    const { data: movData, error: movError } = await supabase
      .from("movimentacoes_estoque")
      .select("*")
      .eq("item_estoque_id", id)
      .order("created_at", { ascending: false });

    if (!movError) {
      setMovimentacoes(movData || []);
    }

    setCarregando(false);
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  if (carregando) {
    return (
      <div className="container">
        <h1>Carregando item...</h1>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container">
        <h1>Item não encontrado</h1>

        <Link
          to="/estoque"
          className="btn-secundario-ativo"
          style={{ textDecoration: "none", display: "inline-flex", marginTop: 20 }}
        >
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="container clientes-page">
      <div className="cliente-detalhe-header">
        <div>
          <h1>{item.nome}</h1>
          <p className="subtitulo">Detalhes do item de estoque</p>
        </div>

        <div className="cliente-detalhe-top-actions">
          <Link
            to={`/estoque/${item.id}/editar`}
            className="btn-principal"
            style={{ textDecoration: "none" }}
          >
            Editar item
          </Link>

          <Link
            to={`/estoque?categoria=${item.categoria}`}
            className="btn-secundario-ativo"
            style={{ textDecoration: "none" }}
          >
            Voltar
          </Link>
        </div>
      </div>

      <div className="cliente-dados-grid" style={{ marginTop: 24 }}>
        <div className="cliente-dado-box">
          <span className="cliente-dado-label">Quantidade</span>
          <strong>{item.quantidade || 0} {item.unidade || ""}</strong>
        </div>

        <div className="cliente-dado-box">
          <span className="cliente-dado-label">Estoque mínimo</span>
          <strong>{item.estoque_minimo || 0} {item.unidade || ""}</strong>
        </div>

        <div className="cliente-dado-box">
          <span className="cliente-dado-label">Valor unitário</span>
          <strong>{formatarMoeda(item.valor_unitario)}</strong>
        </div>

        <div className="cliente-dado-box">
          <span className="cliente-dado-label">Fornecedor</span>
          <strong>{item.fornecedor || "Não informado"}</strong>
        </div>

        <div className="cliente-dado-box">
          <span className="cliente-dado-label">Marca</span>
          <strong>{item.marca || "Não informada"}</strong>
        </div>

        <div className="cliente-dado-box">
          <span className="cliente-dado-label">Localização</span>
          <strong>{item.localizacao || "Não informada"}</strong>
        </div>
      </div>

      <div className="clientes-lista-header" style={{ marginTop: 28 }}>
        <h2 className="clientes-secao-titulo">Histórico</h2>
        <span className="clientes-quantidade">
          {movimentacoes.length} movimentações
        </span>
      </div>

      {movimentacoes.length === 0 ? (
        <div className="clientes-vazio" style={{ marginTop: 14 }}>
          <h3>Nenhuma movimentação registrada</h3>
        </div>
      ) : (
        <div className="clientes-grid-horizontal" style={{ marginTop: 14 }}>
          {movimentacoes.map((mov) => (
            <div key={mov.id} className="cliente-link-card">
              <div className="cliente-lista-item-topo">
                <h3>{mov.tipo_movimentacao}</h3>
                <span>{mov.quantidade} {item.unidade}</span>
              </div>

              <p><strong>Data:</strong> {mov.data || "Não informada"}</p>
              <p><strong>Responsável:</strong> {mov.responsavel || "Não identificado"}</p>
              <p><strong>Valor un.:</strong> {formatarMoeda(mov.valor_unitario)}</p>
              <small><strong>Obs:</strong> {mov.observacao || "Sem observação"}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EstoqueDetalhePage;