import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

function ServicosPage() {
  const location = useLocation();
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [servicosBase, setServicosBase] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(
    hoje.getMonth() + 1
  ).padStart(2, "0")}`;

  const [pesquisa, setPesquisa] = useState("");
  const [mesFinalizados, setMesFinalizados] = useState(mesAtual);

  async function carregarTudo() {
    setCarregando(true);

    const { data: clientesData, error: clientesError } = await supabase
      .from("clientes")
      .select("id, nome");

    const { data: veiculosData, error: veiculosError } = await supabase
      .from("veiculos")
      .select("id, cliente_id, marca, modelo, placa");

    const { data: servicosData, error: servicosError } = await supabase
      .from("servicos")
      .select("*");

    if (clientesError) console.error("Erro clientes:", clientesError);
    if (veiculosError) console.error("Erro veículos:", veiculosError);
    if (servicosError) console.error("Erro serviços:", servicosError);

    setClientes(clientesData || []);
    setVeiculos(veiculosData || []);
    setServicosBase(servicosData || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarTudo();
  }, [location.pathname]);

  useEffect(() => {
    const aoFocar = () => carregarTudo();
    window.addEventListener("focus", aoFocar);

    return () => {
      window.removeEventListener("focus", aoFocar);
    };
  }, []);

  const servicos = useMemo(() => {
    return servicosBase.map((servico) => {
      const veiculo = veiculos.find(
        (item) => String(item.id) === String(servico.veiculo_id)
      );

      const cliente = clientes.find(
        (item) => String(item.id) === String(veiculo?.cliente_id)
      );

      return {
        ...servico,
        clienteId: cliente?.id || "",
        clienteNome: cliente?.nome || "",
        veiculoId: veiculo?.id || "",
        veiculoNome: `${veiculo?.marca || ""} ${veiculo?.modelo || ""}`.trim(),
        placa: veiculo?.placa || "",
        funileiroResponsavel: servico.funileiro_responsavel || "",
        statusPagamento: servico.status_pagamento || "",
        tipoPagamento: servico.tipo_pagamento || "",
        valorTotal: servico.valor_total || 0,
        valorLiquido: servico.valor_liquido || 0,
        dataSaida: servico.data_saida || "",
      };
    });
  }, [clientes, veiculos, servicosBase]);

  const termo = pesquisa.trim().toLowerCase();

  const batePesquisa = (servico) => {
    return (
      !termo ||
      String(servico.descricao || "").toLowerCase().includes(termo) ||
      String(servico.clienteNome || "").toLowerCase().includes(termo) ||
      String(servico.veiculoNome || "").toLowerCase().includes(termo) ||
      String(servico.placa || "").toLowerCase().includes(termo) ||
      String(servico.funileiroResponsavel || "").toLowerCase().includes(termo)
    );
  };

  const pegarMes = (data) => {
    if (!data) return "";
    const texto = String(data).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      return texto.slice(0, 7);
    }

    if (texto.length >= 7) {
      return texto.slice(0, 7);
    }

    return "";
  };

  const textoStatusServico = (servico) => {
    const status = String(servico.status || "").trim();
    if (status) return status;
    if (servico.encerrado) return "Finalizado";
    return "Em andamento";
  };

  const normalizarStatus = (servico) => {
    const status = String(textoStatusServico(servico)).trim().toLowerCase();

    if (status.includes("entreg")) return "finalizado";
    if (status.includes("final")) return "finalizado";
    if (status.includes("aguard")) return "aguardando";
    if (status.includes("paus")) return "pausado";
    return "andamento";
  };

  const classeStatusServico = (status) => {
    const s = String(status || "").toLowerCase();

    if (s.includes("entreg")) return "finalizado";
    if (s.includes("final")) return "finalizado";
    if (s.includes("paus")) return "pausado";
    if (s.includes("aguard")) return "aguardando";
    return "andamento";
  };

  const ordenarPorNomeCliente = (a, b) => {
    const nomeA = String(a.clienteNome || "").toLowerCase();
    const nomeB = String(b.clienteNome || "").toLowerCase();

    if (nomeA < nomeB) return -1;
    if (nomeA > nomeB) return 1;
    return 0;
  };

  const ordenarPorDataDesc = (a, b, campo) => {
    const dataA = new Date(a?.[campo] || 0).getTime();
    const dataB = new Date(b?.[campo] || 0).getTime();
    return dataB - dataA;
  };

  function getLinkServico(servico) {
    if (servico.clienteId && servico.veiculoId && servico.id) {
      return `/servicos/${servico.clienteId}/${servico.veiculoId}/${servico.id}`;
    }

    return "/servicos";
  }

  const servicosFiltrados = servicos.filter((servico) => batePesquisa(servico));

  const servicosEmAndamento = servicosFiltrados
    .filter((servico) => normalizarStatus(servico) === "andamento")
    .sort(ordenarPorNomeCliente);

  const servicosAguardando = servicosFiltrados
    .filter((servico) => normalizarStatus(servico) === "aguardando")
    .sort(ordenarPorNomeCliente);

  const servicosPausados = servicosFiltrados
    .filter((servico) => normalizarStatus(servico) === "pausado")
    .sort(ordenarPorNomeCliente);

  const servicosFinalizados = servicosFiltrados
    .filter((servico) => {
      const ehFinalizado = normalizarStatus(servico) === "finalizado";
      const mesServico =
        pegarMes(servico.dataSaida) ||
        pegarMes(servico.data_saida) ||
        pegarMes(servico.created_at);

      const bateMes = !mesFinalizados || mesServico === mesFinalizados;

      return ehFinalizado && bateMes;
    })
    .sort((a, b) => ordenarPorDataDesc(a, b, "dataSaida"));

  const resumoMes = servicosFinalizados.reduce(
    (acc, servico) => {
      acc.quantidade += 1;
      acc.valorTotal += Number(servico.valorTotal || 0);
      acc.valorLiquido += Number(servico.valorLiquido || 0);
      return acc;
    },
    {
      quantidade: 0,
      valorTotal: 0,
      valorLiquido: 0,
    }
  );

  const formatarMoeda = (valor) => {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const renderizarBlocoCompacto = (titulo, lista, classeStatus) => (
    <div style={{ marginTop: 28 }}>
      <div className="clientes-lista-header">
        <h2 className="clientes-secao-titulo">{titulo}</h2>
        <span className="clientes-quantidade">
          {lista.length} {lista.length === 1 ? "serviço" : "serviços"}
        </span>
      </div>

      {lista.length === 0 ? (
        <div className="clientes-vazio" style={{ marginTop: 14 }}>
          <h3>Nenhum serviço nesta seção</h3>
          <p>Os serviços com esse status aparecerão aqui.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 240px))",
            gap: "12px",
            marginTop: "14px",
          }}
        >
          {lista.map((servico) => (
            <Link
              key={servico.id}
              to={getLinkServico(servico)}
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderLeft: "4px solid rgba(255, 89, 94, 0.9)",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  minHeight: "unset",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.14)",
                }}
              >
               <div
  style={{
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      minWidth: 0,
    }}
  >
    <div
      title={
        servico.prioridade
      }
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        flexShrink: 0,

        background:
          servico.prioridade ===
          "Urgente"
            ? "#ff5c5c"
            : servico.prioridade ===
              "Média"
            ? "#ffc107"
            : "#4caf50",

        boxShadow:
          servico.prioridade ===
          "Urgente"
            ? "0 0 8px rgba(255,92,92,.45)"
            : servico.prioridade ===
              "Média"
            ? "0 0 8px rgba(255,193,7,.35)"
            : "0 0 8px rgba(76,175,80,.35)",
      }}
    />

    <h3
      style={{
        margin: 0,
        fontSize: "16px",
      }}
    >
      {servico.clienteNome ||
        "Cliente sem nome"}
    </h3>
  </div>

  <span
    className={`status-badge ${classeStatusServico(
      classeStatus
    )}`}
    style={{
      flexShrink: 0,
      whiteSpace:
        "nowrap",
    }}
  >
    {textoStatusServico(
      servico
    )}
  </span>
</div>

  

                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#cfcfcf",
                    lineHeight: 1.35,
                  }}
                >
                  {servico.descricao || "Serviço sem descrição"}
                </p>

                {(!servico.clienteId || !servico.veiculoId) && (
                  <small style={{ color: "#ff8a80", fontSize: "11px" }}>
                    Serviço sem vínculo completo
                  </small>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="container clientes-page">
      <div className="clientes-header">
        <div>
          <h1>Serviços</h1>
          <p className="subtitulo">
            Visualize os serviços separados por status
          </p>
        </div>
      </div>

      <div className="clientes-topbar">
        <input
          type="text"
          placeholder="Pesquisar por cliente, serviço, veículo, placa ou funileiro"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="clientes-pesquisa-input"
        />
      </div>

      <div
        className="cliente-dados-grid"
        style={{ marginTop: 20, marginBottom: 12 }}
      >
        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">
            Quantidade finalizada/entregue no mês
          </span>
          <strong>{resumoMes.quantidade}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Valor total do mês</span>
          <strong>{formatarMoeda(resumoMes.valorTotal)}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Valor líquido do mês</span>
          <strong>{formatarMoeda(resumoMes.valorLiquido)}</strong>
        </div>
      </div>

      {carregando ? (
        <div className="clientes-vazio">
          <h3>Carregando serviços...</h3>
        </div>
      ) : (
        <>
          {renderizarBlocoCompacto(
            "Serviços em andamento",
            servicosEmAndamento,
            "andamento"
          )}

          {renderizarBlocoCompacto(
            "Serviços aguardando",
            servicosAguardando,
            "aguardando"
          )}

          {renderizarBlocoCompacto(
            "Serviços pausados",
            servicosPausados,
            "pausado"
          )}

          <div style={{ marginTop: 28 }}>
            <div className="clientes-lista-header">
              <h2 className="clientes-secao-titulo">
                Histórico finalizados/entregues
              </h2>
              <span className="clientes-quantidade">
                {servicosFinalizados.length}{" "}
                {servicosFinalizados.length === 1 ? "serviço" : "serviços"}
              </span>
            </div>

            <div style={{ marginTop: 14, marginBottom: 16, maxWidth: 260 }}>
              <label
                style={{
                  display: "block",
                  color: "#d5d5d5",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Filtrar histórico por mês
              </label>

              <input
                type="month"
                value={mesFinalizados}
                onChange={(e) => setMesFinalizados(e.target.value)}
                className="clientes-pesquisa-input"
              />
            </div>

            {servicosFinalizados.length === 0 ? (
              <div className="clientes-vazio">
                <h3>Nenhum serviço no histórico</h3>
                <p>
                  Os serviços finalizados ou entregues do mês aparecerão aqui.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 240px))",
                  gap: "12px",
                  marginTop: "14px",
                }}
              >
                {servicosFinalizados.map((servico) => (
                  <Link
                    key={servico.id}
                    to={getLinkServico(servico)}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderLeft: "4px solid rgba(255,255,255,0.35)",
                        borderRadius: "14px",
                        padding: "12px 14px",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.14)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "15px",
                            lineHeight: 1.25,
                            color: "#ffffff",
                          }}
                        >
                          {servico.clienteNome || "Cliente sem nome"}
                        </h3>

                        <span
                          className={`status-badge ${classeStatusServico(
                            textoStatusServico(servico)
                          )}`}
                          style={{
                            fontSize: "11px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {textoStatusServico(servico)}
                        </span>
                      </div>

                      <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 10,
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent:
        "space-between",
      alignItems: "flex-start",
      gap: 12,
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        flex: 1,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "15px",
          lineHeight: 1.25,
          color: "#ffffff",
        }}
      >
        {servico.clienteNome ||
          "Cliente sem nome"}
      </h3>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          width: "fit-content",
          padding: "6px 12px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,

          background:
            servico.prioridade ===
            "Urgente"
              ? "rgba(255,92,92,.12)"
              : servico.prioridade ===
                "Média"
              ? "rgba(255,193,7,.12)"
              : "rgba(76,175,80,.10)",

          color:
            servico.prioridade ===
            "Urgente"
              ? "#ff8a8a"
              : servico.prioridade ===
                "Média"
              ? "#ffd54f"
              : "#8dd89d",

          border:
            servico.prioridade ===
            "Urgente"
              ? "1px solid rgba(255,92,92,.18)"
              : servico.prioridade ===
                "Média"
              ? "1px solid rgba(255,193,7,.16)"
              : "1px solid rgba(76,175,80,.16)",
        }}
      >
        {servico.prioridade ===
        "Urgente"
          ? "Urgente"
          : servico.prioridade ===
            "Média"
          ? "Média"
          : "Normal"}
      </div>
    </div>

    <span
      className={`status-badge ${classeStatusServico(
        classeStatus
      )}`}
      style={{
        fontSize: "11px",
        whiteSpace:
          "nowrap",
        flexShrink: 0,
      }}
    >
      {textoStatusServico(
        servico
      )}
    </span>
  </div>

  <p
    style={{
      margin: 0,
      fontSize: "13px",
      color: "#cfcfcf",
      lineHeight: 1.35,
    }}
  >
    {servico.descricao ||
      "Serviço sem descrição"}
  </p>
</div>

                      <small
                        style={{
                          color: "#a9a9a9",
                          fontSize: "12px",
                        }}
                      >
                        Saída: {servico.dataSaida || "Não informada"}
                      </small>

                      {(!servico.clienteId || !servico.veiculoId) && (
                        <small
                          style={{
                            display: "block",
                            marginTop: 6,
                            color: "#ff8a80",
                            fontSize: "11px",
                          }}
                        >
                          Serviço sem vínculo completo
                        </small>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ServicosPage;