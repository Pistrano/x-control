import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FileText, Plus, Clock, CheckCircle, XCircle, Search } from "lucide-react";

const STATUS_CONFIG = {
  pendente: { label: "Pendente", cor: "#f6a623", bg: "rgba(246,166,35,0.12)", icon: <Clock size={13} /> },
  aprovado: { label: "Aprovado", cor: "#25d366", bg: "rgba(37,211,102,0.12)", icon: <CheckCircle size={13} /> },
  recusado: { label: "Recusado", cor: "#e53935", bg: "rgba(229,57,53,0.12)", icon: <XCircle size={13} /> },
};

function OrcamentosPage() {
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  useEffect(() => { carregarOrcamentos(); }, []);

  async function carregarOrcamentos() {
    setCarregando(true);
    const { data, error } = await supabase
      .from("orcamentos")
      .select(`
        *,
        servicos (
          descricao,
          valor_total,
          veiculos (
            marca, modelo, placa,
            clientes ( nome, telefone )
          )
        )
      `)
      .order("criado_em", { ascending: false });

    if (!error) setOrcamentos(data || []);
    setCarregando(false);
  }

  const filtrados = orcamentos.filter((o) => {
    const nomeCliente = o.servicos?.veiculos?.clientes?.nome?.toLowerCase() || "";
    const veiculo = `${o.servicos?.veiculos?.marca || ""} ${o.servicos?.veiculos?.modelo || ""}`.toLowerCase();
    const placa = o.servicos?.veiculos?.placa?.toLowerCase() || "";
    const texto = busca.toLowerCase();
    const matchBusca = !busca || nomeCliente.includes(texto) || veiculo.includes(texto) || placa.includes(texto);
    const matchStatus = filtroStatus === "todos" || o.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const contadores = {
    pendente: orcamentos.filter((o) => o.status === "pendente").length,
    aprovado: orcamentos.filter((o) => o.status === "aprovado").length,
    recusado: orcamentos.filter((o) => o.status === "recusado").length,
  };

  return (
    <div className="container clientes-page">
      <div className="clientes-header">
        <div>
          <h1>Orçamentos</h1>
          <p className="subtitulo">{orcamentos.length} orçamento{orcamentos.length !== 1 ? "s" : ""} cadastrado{orcamentos.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          type="button"
          className="btn-principal"
          onClick={() => navigate("/orcamentos/novo")}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <Plus size={18} /> Novo orçamento
        </button>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 22 }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFiltroStatus(filtroStatus === key ? "todos" : key)}
            style={{
              background: filtroStatus === key ? cfg.bg : "linear-gradient(180deg,#20232a,#191c22)",
              border: `1px solid ${filtroStatus === key ? cfg.cor : "rgba(255,255,255,0.07)"}`,
              borderRadius: 16,
              padding: "14px 16px",
              cursor: "pointer",
              textAlign: "left",
              transition: "0.2s",
            }}
          >
            <div style={{ color: cfg.cor, fontSize: 22, fontWeight: 800 }}>{contadores[key]}</div>
            <div style={{ color: "#aaa", fontSize: 12, marginTop: 2 }}>{cfg.label}</div>
          </button>
        ))}
      </div>

      {/* Busca */}
      <div style={{ position: "relative", marginBottom: 18 }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#666" }} />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente, veículo ou placa..."
          style={{
            width: "100%", background: "#1a1d23", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "11px 14px 11px 40px", color: "#fff", fontSize: 14,
          }}
        />
      </div>

      {carregando ? (
        <p style={{ color: "#aaa" }}>Carregando...</p>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#666" }}>
          <FileText size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p>Nenhum orçamento encontrado.</p>
          <button
            type="button"
            className="btn-principal"
            onClick={() => navigate("/orcamentos/novo")}
            style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <Plus size={16} /> Criar primeiro orçamento
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtrados.map((o) => {
            const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pendente;
            const cliente = o.servicos?.veiculos?.clientes;
            const veiculo = o.servicos?.veiculos;
            const dataFormatada = o.criado_em ? new Date(o.criado_em).toLocaleDateString("pt-BR") : "—";
            const valorFormatado = o.valor_total != null
              ? Number(o.valor_total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              : "—";

            return (
              <div
                key={o.id}
                onClick={() => navigate(`/orcamentos/${o.id}`)}
                className="cliente-card"
                style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ background: cfg.bg, border: `1px solid ${cfg.cor}33`, borderRadius: 12, padding: "10px 12px", color: cfg.cor }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{cliente?.nome || "Cliente"}</div>
                    <div style={{ color: "#888", fontSize: 13, marginTop: 2 }}>
                      {veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "—"}
                      {veiculo?.placa ? ` • ${veiculo.placa}` : ""}
                      {" • "}{dataFormatada}
                    </div>
                    {o.descricao && (
                      <div style={{ color: "#666", fontSize: 12, marginTop: 3 }}>{o.descricao.slice(0, 60)}{o.descricao.length > 60 ? "…" : ""}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{valorFormatado}</div>
                  <span style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: cfg.bg, color: cfg.cor,
                    border: `1px solid ${cfg.cor}44`,
                    borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 600,
                  }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrcamentosPage;
