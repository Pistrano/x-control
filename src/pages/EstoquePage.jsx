import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

function EstoquePage() {
  const [itens, setItens] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const categorias = [
    "tintas",
    "pecas",
    "vernizes",
    "lixas",
    "ferramentas",
    "consumiveis",
    "outros",
  ];

  const nomesCategorias = {
    tintas: "Tintas",
    pecas: "Peças",
    vernizes: "Vernizes",
    lixas: "Lixas",
    ferramentas: "Ferramentas",
    consumiveis: "Consumíveis",
    outros: "Outros",
  };

  const categoriaAtual = searchParams.get("categoria") || "tintas";

  useEffect(() => {
    buscarItens();
  }, []);

  async function buscarItens() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("estoque")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      alert("Erro ao carregar estoque: " + error.message);
      setItens([]);
    } else {
      setItens(data || []);
    }

    setCarregando(false);
  }

  async function atualizarEstoque(itemId, delta) {
    const itemAtual = itens.find((item) => String(item.id) === String(itemId));
    if (!itemAtual) return;

    let novaQuantidade = Number(itemAtual.quantidade || 0) + delta;
    if (novaQuantidade < 0) novaQuantidade = 0;

    const { error } = await supabase
      .from("estoque")
      .update({ quantidade: novaQuantidade })
      .eq("id", itemId);

    if (error) {
      alert("Erro ao atualizar estoque: " + error.message);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const usuario = userData?.user;

    const responsavel =
      usuario?.user_metadata?.nome ||
      usuario?.user_metadata?.name ||
      usuario?.email ||
      "Usuário";

    await supabase.from("movimentacoes_estoque").insert([
      {
        item_estoque_id: itemId,
        tipo_movimentacao: delta > 0 ? "entrada rápida" : "saída rápida",
        quantidade: Math.abs(delta),
        valor_unitario: Number(itemAtual.valor_unitario || 0),
        data: new Date().toISOString().slice(0, 10),
        observacao: "Movimentação rápida pela tela de estoque",
        responsavel,
      },
    ]);

    buscarItens();
  }

  async function excluirItem(itemId) {
    const confirmar = window.confirm("Deseja excluir este item?");
    if (!confirmar) return;

    await supabase
      .from("movimentacoes_estoque")
      .delete()
      .eq("item_estoque_id", itemId);

    const { error } = await supabase.from("estoque").delete().eq("id", itemId);

    if (error) {
      alert("Erro ao excluir item: " + error.message);
      return;
    }

    buscarItens();
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function getStatusInfo(item) {
    const quantidade = Number(item.quantidade || 0);
    const minimo = Number(item.estoque_minimo || 0);

    if (quantidade <= 0) {
      return {
        texto: "Sem estoque",
        classe: "estoque-status-zero",
        cardClasse: "estoque-alerta-zero",
      };
    }

    if (minimo > 0 && quantidade <= minimo) {
      return {
        texto: "Estoque baixo",
        classe: "estoque-status-baixo",
        cardClasse: "estoque-alerta-baixo",
      };
    }

    return {
      texto: "Em estoque",
      classe: "estoque-status-ok",
      cardClasse: "estoque-alerta-ok",
    };
  }

  const itensFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return itens.filter((item) => {
      const bateCategoria = item.categoria === categoriaAtual;

      const batePesquisa =
        !termo ||
        String(item.nome || "").toLowerCase().includes(termo) ||
        String(item.fornecedor || "").toLowerCase().includes(termo) ||
        String(item.marca || "").toLowerCase().includes(termo) ||
        String(item.codigo || "").toLowerCase().includes(termo);

      return bateCategoria && batePesquisa;
    });
  }, [itens, categoriaAtual, pesquisa]);

  const resumo = useMemo(() => {
    const totalItens = itens.length;

    const quantidadeTotal = itens.reduce(
      (acc, item) => acc + Number(item.quantidade || 0),
      0
    );

    const valorEstoque = itens.reduce(
      (acc, item) =>
        acc + Number(item.quantidade || 0) * Number(item.valor_unitario || 0),
      0
    );

    const estoqueBaixo = itens.filter((item) => {
      const quantidade = Number(item.quantidade || 0);
      const minimo = Number(item.estoque_minimo || 0);
      return minimo > 0 && quantidade > 0 && quantidade <= minimo;
    }).length;

    const semEstoque = itens.filter(
      (item) => Number(item.quantidade || 0) <= 0
    ).length;

    return {
      totalItens,
      quantidadeTotal,
      valorEstoque,
      estoqueBaixo,
      semEstoque,
    };
  }, [itens]);

  return (
    <div className="container clientes-page">
      <div className="clientes-header">
        <div>
          <h1>Estoque</h1>
          <p className="subtitulo">
            Controle de materiais, tintas, peças e itens da oficina
          </p>
        </div>
      </div>

      <div className="clientes-topbar">
        <input
          type="text"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar item, fornecedor, marca ou código..."
          className="clientes-pesquisa-input"
        />

        <Link
          to="/estoque/novo"
          className="btn-principal"
          style={{ textDecoration: "none" }}
        >
          + Novo item
        </Link>
      </div>

      <div className="cliente-dados-grid" style={{ marginTop: 24 }}>
        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Itens cadastrados</span>
          <strong>{resumo.totalItens}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Quantidade total</span>
          <strong>{resumo.quantidadeTotal}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Valor em estoque</span>
          <strong>{formatarMoeda(resumo.valorEstoque)}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Estoque baixo</span>
          <strong>{resumo.estoqueBaixo}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Sem estoque</span>
          <strong>{resumo.semEstoque}</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
        {categorias.map((categoria) => {
          const ativa = categoriaAtual === categoria;

          return (
            <button
              key={categoria}
              type="button"
              className={ativa ? "btn-principal" : "btn-secundario-ativo"}
              onClick={() => setSearchParams({ categoria })}
            >
              {nomesCategorias[categoria]}
            </button>
          );
        })}
      </div>

      <div className="clientes-lista-header" style={{ marginTop: 28 }}>
        <h2 className="clientes-secao-titulo">
          {nomesCategorias[categoriaAtual]}
        </h2>

        <span className="clientes-quantidade">
          {itensFiltrados.length}{" "}
          {itensFiltrados.length === 1 ? "item" : "itens"}
        </span>
      </div>

      {carregando ? (
        <div className="clientes-vazio" style={{ marginTop: 14 }}>
          <h3>Carregando estoque...</h3>
        </div>
      ) : itensFiltrados.length === 0 ? (
        <div className="clientes-vazio" style={{ marginTop: 14 }}>
          <h3>Nenhum item encontrado</h3>
          <p>Os itens dessa categoria aparecerão aqui.</p>
        </div>
      ) : (
        <div className="clientes-grid-horizontal" style={{ marginTop: 14 }}>
          {itensFiltrados.map((item) => {
            const status = getStatusInfo(item);

            return (
              <div
                key={item.id}
                className={`cliente-link-card estoque-card-compacto ${status.cardClasse}`}
              >
                <div className="cliente-lista-item-topo">
                  <h3>{item.nome}</h3>
                  <span className={`estoque-status-badge ${status.classe}`}>
                    {status.texto}
                  </span>
                </div>

                <p>
                  <strong>Qtd:</strong> {item.quantidade} {item.unidade}
                </p>

                <p>
                  <strong>Mínimo:</strong> {item.estoque_minimo || 0}{" "}
                  {item.unidade}
                </p>

                <p>
                  <strong>Fornecedor:</strong>{" "}
                  {item.fornecedor || "Não informado"}
                </p>

                <p>
                  <strong>Valor un:</strong>{" "}
                  {formatarMoeda(item.valor_unitario)}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="btn-principal"
                    onClick={() => atualizarEstoque(item.id, 1)}
                  >
                    +1
                  </button>

                  <button
                    type="button"
                    className="btn-secundario-ativo"
                    onClick={() => atualizarEstoque(item.id, -1)}
                  >
                    -1
                  </button>

                  <a
                    href={`/estoque/${item.id}`}
                    className="btn-secundario-ativo"
                    style={{ textDecoration: "none" }}
                  >
                    Detalhes
                  </a>

                  <button
                    type="button"
                    className="btn-excluir"
                    onClick={() => excluirItem(item.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default EstoquePage;
