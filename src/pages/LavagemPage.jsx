import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

function LavagemPage() {
  const [lavagens, setLavagens] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("andamento");
  const [carregando, setCarregando] = useState(true);

  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(
    hoje.getMonth() + 1
  ).padStart(2, "0")}`;

  const [mesFiltro, setMesFiltro] = useState(mesAtual);

  useEffect(() => {
    carregarLavagens();

    const canal = supabase
      .channel("lavagens-tempo-real")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "servicos" },
        () => carregarLavagens()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  async function carregarLavagens() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("servicos")
      .select(`
        *,
        veiculos (
          id,
          marca,
          modelo,
          placa,
          cliente_id,
          clientes (
            id,
            nome
          )
        )
      `)
      .eq("eh_lavagem", true)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar lavagens: " + error.message);
      setLavagens([]);
    } else {
      setLavagens(data || []);
    }

    setCarregando(false);
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function normalizarStatus(status) {
    return String(status || "andamento").trim().toLowerCase();
  }

  function pegarMes(data) {
    if (!data) return "";
    return String(data).slice(0, 7);
  }

  const lavagensFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return lavagens.filter((lavagem) => {
      const status = normalizarStatus(lavagem.status_lavagem);

      const bateStatus =
        filtroStatus === "todas" || status === filtroStatus;

      const dataBase =
        lavagem.data_saida || lavagem.data_entrada || lavagem.created_at;

      const mesLavagem = pegarMes(dataBase);

      // ✅ Andamento aparece independente do mês
      // ✅ Finalizado/Entregue/Todas respeitam o mês
      const bateMes =
        filtroStatus === "andamento"
          ? true
          : !mesFiltro || mesLavagem === mesFiltro;

      const cliente = lavagem.veiculos?.clientes?.nome || "";
      const veiculo = `${lavagem.veiculos?.marca || ""} ${
        lavagem.veiculos?.modelo || ""
      }`;
      const placa = lavagem.veiculos?.placa || "";
      const funcionario = lavagem.funcionario_lavagem || "";

      const batePesquisa =
        !termo ||
        cliente.toLowerCase().includes(termo) ||
        veiculo.toLowerCase().includes(termo) ||
        placa.toLowerCase().includes(termo) ||
        funcionario.toLowerCase().includes(termo);

      return bateStatus && bateMes && batePesquisa;
    });
  }, [lavagens, pesquisa, filtroStatus, mesFiltro]);

  const resumo = useMemo(() => {
    const andamento = lavagens.filter(
      (item) => normalizarStatus(item.status_lavagem) === "andamento"
    ).length;

    const finalizado = lavagens.filter(
      (item) => normalizarStatus(item.status_lavagem) === "finalizado"
    ).length;

    const entregue = lavagens.filter(
      (item) => normalizarStatus(item.status_lavagem) === "entregue"
    ).length;

    const valorTotal = lavagens.reduce(
      (acc, item) => acc + Number(item.valor_lavagem || 0),
      0
    );

    return {
      total: lavagens.length,
      andamento,
      finalizado,
      entregue,
      valorTotal,
    };
  }, [lavagens]);

  if (carregando) {
    return (
      <div className="container">
        <h1>Carregando lavagens...</h1>
      </div>
    );
  }

  return (
    <div className="container clientes-page">
      <div className="clientes-header">
        <div>
          <h1>Lavagem</h1>
          <p className="subtitulo">
            Controle de lavagens vinculadas aos serviços
          </p>
        </div>
      </div>

      <div className="clientes-topbar">
        <input
          type="text"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar cliente, veículo, placa ou funcionário..."
          className="clientes-pesquisa-input"
        />

        <Link
          to="/lavagem/nova"
          className="btn-principal"
          style={{ textDecoration: "none" }}
        >
          + Nova lavagem
        </Link>
      </div>

      <div className="cliente-dados-grid" style={{ marginTop: 24 }}>
        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Lavagens</span>
          <strong>{resumo.total}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Andamento</span>
          <strong>{resumo.andamento}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Finalizadas</span>
          <strong>{resumo.finalizado}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Entregues</span>
          <strong>{resumo.entregue}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Valor total</span>
          <strong>{formatarMoeda(resumo.valorTotal)}</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
        <button
          type="button"
          className={
            filtroStatus === "andamento"
              ? "btn-principal"
              : "btn-secundario-ativo"
          }
          onClick={() => setFiltroStatus("andamento")}
        >
          Andamento
        </button>

        <button
          type="button"
          className={
            filtroStatus === "finalizado"
              ? "btn-principal"
              : "btn-secundario-ativo"
          }
          onClick={() => setFiltroStatus("finalizado")}
        >
          Finalizadas
        </button>

        <button
          type="button"
          className={
            filtroStatus === "entregue"
              ? "btn-principal"
              : "btn-secundario-ativo"
          }
          onClick={() => setFiltroStatus("entregue")}
        >
          Entregues
        </button>

        <button
          type="button"
          className={
            filtroStatus === "todas" ? "btn-principal" : "btn-secundario-ativo"
          }
          onClick={() => setFiltroStatus("todas")}
        >
          Todas
        </button>
      </div>

      <div style={{ marginTop: 18, maxWidth: 260 }}>
        <label
          style={{
            display: "block",
            color: "#d5d5d5",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Filtrar por mês
        </label>

        <input
          type="month"
          value={mesFiltro}
          onChange={(e) => setMesFiltro(e.target.value)}
          className="clientes-pesquisa-input"
        />

        {filtroStatus === "andamento" && (
          <small style={{ display: "block", color: "#aaa", marginTop: 6 }}>
            Andamento mostra todos os meses.
          </small>
        )}
      </div>

      <div className="clientes-lista-header" style={{ marginTop: 28 }}>
        <h2 className="clientes-secao-titulo">
          {filtroStatus === "todas"
            ? "Todas as lavagens"
            : `Lavagens ${filtroStatus}`}
        </h2>

        <span className="clientes-quantidade">
          {lavagensFiltradas.length} registros
        </span>
      </div>

      {lavagensFiltradas.length === 0 ? (
        <div className="clientes-vazio" style={{ marginTop: 14 }}>
          <h3>Nenhuma lavagem encontrada</h3>
          <p>As lavagens desse filtro aparecerão aqui.</p>
        </div>
      ) : (
        <div className="clientes-grid-horizontal" style={{ marginTop: 14 }}>
          {lavagensFiltradas.map((lavagem) => {
            const cliente = lavagem.veiculos?.clientes;
            const veiculo = lavagem.veiculos;

            return (
              <div key={lavagem.id} className="cliente-link-card">
                <div className="cliente-lista-item-topo">
                  <h3>{cliente?.nome || "Cliente não informado"}</h3>
                  <span>{lavagem.status_lavagem || "andamento"}</span>
                </div>

                <p>
                  <strong>Veículo:</strong>{" "}
                  {veiculo?.marca || ""} {veiculo?.modelo || ""}
                </p>

                <p>
                  <strong>Placa:</strong> {veiculo?.placa || "Não informada"}
                </p>

                <p>
                  <strong>Valor:</strong>{" "}
                  {formatarMoeda(lavagem.valor_lavagem)}
                </p>

                <p>
                  <strong>Funcionário:</strong>{" "}
                  {lavagem.funcionario_lavagem || "Não informado"}
                </p>

                <p>
                  <strong>Serviço:</strong>{" "}
                  {lavagem.descricao || "Lavagem"}
                </p>

                {cliente?.id && veiculo?.id && (
                  <Link
                    to={`/servicos/${cliente.id}/${veiculo.id}/${lavagem.id}`}
                    className="btn-secundario-ativo"
                    style={{
                      textDecoration: "none",
                      marginTop: 12,
                      display: "inline-flex",
                      width: "fit-content",
                    }}
                  >
                    Abrir serviço
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LavagemPage;