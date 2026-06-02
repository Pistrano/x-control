import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { notificarWhatsApp, temWhatsApp } from "../utils/whatsapp";
import { CheckCircle, XCircle, Clock, FileText, Send } from "lucide-react";

const STATUS_CONFIG = {
  pendente: { label: "Pendente", cor: "#f6a623", bg: "rgba(246,166,35,0.12)", icon: <Clock size={14} /> },
  aprovado: { label: "Aprovado", cor: "#25d366", bg: "rgba(37,211,102,0.12)", icon: <CheckCircle size={14} /> },
  recusado: { label: "Recusado", cor: "#e53935", bg: "rgba(229,57,53,0.12)", icon: <XCircle size={14} /> },
};

function OrcamentoDetalhePage() {
  const { orcamentoId } = useParams();
  const navigate = useNavigate();
  const isNovo = !orcamentoId || orcamentoId === "novo";

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // Para criação — lista de serviços disponíveis
  const [servicos, setServicos] = useState([]);

  // Dados do orçamento existente
  const [orcamento, setOrcamento] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [veiculo, setVeiculo] = useState(null);

  const [form, setForm] = useState({
    servico_id: "",
    descricao: "",
    valor_total: "",
    validade_dias: "7",
    observacoes: "",
    status: "pendente",
  });

  useEffect(() => { carregarDados(); }, [orcamentoId]);

  async function carregarDados() {
    setCarregando(true);

    if (isNovo) {
      // Carrega serviços existentes para vincular
      const { data } = await supabase
        .from("servicos")
        .select(`
          id, descricao, valor_total,
          veiculos (
            marca, modelo, placa,
            clientes ( id, nome, telefone )
          )
        `)
        .order("created_at", { ascending: false });
      setServicos(data || []);
    } else {
      const { data } = await supabase
        .from("orcamentos")
        .select(`
          *,
          servicos (
            id, descricao, valor_total,
            veiculos (
              marca, modelo, placa,
              clientes ( id, nome, telefone )
            )
          )
        `)
        .eq("id", orcamentoId)
        .single();

      if (data) {
        setOrcamento(data);
        setCliente(data.servicos?.veiculos?.clientes);
        setVeiculo(data.servicos?.veiculos);
        setForm({
          servico_id: data.servico_id || "",
          descricao: data.descricao || "",
          valor_total: data.valor_total || "",
          validade_dias: data.validade_dias || "7",
          observacoes: data.observacoes || "",
          status: data.status || "pendente",
        });
      }
    }

    setCarregando(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      // Auto-preenche descrição e valor ao selecionar serviço
      if (name === "servico_id" && value) {
        const srv = servicos.find((s) => s.id === value);
        return {
          ...prev,
          servico_id: value,
          descricao: srv?.descricao || prev.descricao,
          valor_total: srv?.valor_total || prev.valor_total,
        };
      }
      return { ...prev, [name]: value };
    });
  }

  async function salvar(e) {
    e.preventDefault();
    if (!form.servico_id) return alert("Selecione o serviço.");
    if (!form.valor_total) return alert("Informe o valor total.");

    setSalvando(true);

    const payload = {
      servico_id: form.servico_id,
      descricao: form.descricao,
      valor_total: Number(form.valor_total),
      validade_dias: Number(form.validade_dias || 7),
      observacoes: form.observacoes,
      status: form.status,
    };

    const { error } = isNovo
      ? await supabase.from("orcamentos").insert([{ ...payload, criado_em: new Date().toISOString() }])
      : await supabase.from("orcamentos").update(payload).eq("id", orcamentoId);

    if (error) {
      alert("Erro ao salvar: " + error.message);
      setSalvando(false);
      return;
    }

    setSalvando(false);
    navigate("/orcamentos");
  }

  async function alterarStatus(novoStatus) {
    const { error } = await supabase
      .from("orcamentos")
      .update({ status: novoStatus })
      .eq("id", orcamentoId);

    if (error) { alert("Erro: " + error.message); return; }

    setForm((prev) => ({ ...prev, status: novoStatus }));
    setOrcamento((prev) => ({ ...prev, status: novoStatus }));

    // Notifica via WhatsApp se cliente tiver número
    if (cliente && temWhatsApp(cliente.telefone)) {
      const nomeVeiculo = veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "veículo";
      notificarWhatsApp({
        telefone: cliente.telefone,
        tipo: "orcamento",
        status: novoStatus,
        nomeCliente: cliente.nome,
        veiculo: nomeVeiculo,
        placa: veiculo?.placa || "—",
        valor: Number(orcamento?.valor_total || form.valor_total),
      });
    }
  }

  async function excluir() {
    if (!window.confirm("Excluir este orçamento? Essa ação não pode ser desfeita.")) return;
    setExcluindo(true);
    await supabase.from("orcamentos").delete().eq("id", orcamentoId);
    navigate("/orcamentos");
  }

  function enviarWhatsApp() {
    if (!cliente || !temWhatsApp(cliente.telefone)) {
      alert("Cliente sem telefone cadastrado.");
      return;
    }
    const nomeVeiculo = veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "veículo";
    notificarWhatsApp({
      telefone: cliente.telefone,
      tipo: "orcamento",
      status: "envio",
      nomeCliente: cliente.nome,
      veiculo: nomeVeiculo,
      placa: veiculo?.placa || "—",
      valor: Number(orcamento?.valor_total || form.valor_total),
      descricao: form.descricao,
      validade: form.validade_dias,
    });
  }

  const statusAtual = form.status;
  const cfg = STATUS_CONFIG[statusAtual] || STATUS_CONFIG.pendente;

  // Para criação: cliente/veículo vêm do serviço selecionado
  const servicoSelecionado = isNovo ? servicos.find((s) => s.id === form.servico_id) : null;
  const clienteExibido = isNovo ? servicoSelecionado?.veiculos?.clientes : cliente;
  const veiculoExibido = isNovo ? servicoSelecionado?.veiculos : veiculo;

  if (carregando) return <div className="container"><h1 style={{ color: "#fff" }}>Carregando...</h1></div>;

  return (
    <div className="container clientes-page">
      <div className="cliente-detalhe-header">
        <div>
          <h1>{isNovo ? "Novo orçamento" : "Orçamento"}</h1>
          {!isNovo && clienteExibido && (
            <p className="subtitulo">
              {clienteExibido.nome} — {veiculoExibido ? `${veiculoExibido.marca} ${veiculoExibido.modelo}` : ""}
              {veiculoExibido?.placa ? ` (${veiculoExibido.placa})` : ""}
            </p>
          )}
        </div>
        <div className="cliente-detalhe-top-actions">
          {!isNovo && (
            <button type="button" className="btn-excluir" onClick={excluir} disabled={excluindo}>
              {excluindo ? "Excluindo..." : "Excluir"}
            </button>
          )}
          <button type="button" className="btn-secundario-ativo" onClick={() => navigate("/orcamentos")}>
            Voltar
          </button>
        </div>
      </div>

      {/* Badge de status (apenas edição) */}
      {!isNovo && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: cfg.bg, color: cfg.cor, border: `1px solid ${cfg.cor}44`,
            borderRadius: 20, padding: "6px 14px", fontSize: 14, fontWeight: 700,
          }}>
            {cfg.icon} {cfg.label}
          </span>

          {/* Ações de status */}
          {statusAtual !== "aprovado" && (
            <button
              type="button"
              onClick={() => alterarStatus("aprovado")}
              style={{
                background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.35)",
                color: "#25d366", borderRadius: 20, padding: "6px 14px", fontSize: 13,
                fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <CheckCircle size={13} /> Aprovar
            </button>
          )}
          {statusAtual !== "recusado" && (
            <button
              type="button"
              onClick={() => alterarStatus("recusado")}
              style={{
                background: "rgba(229,57,53,0.12)", border: "1px solid rgba(229,57,53,0.35)",
                color: "#e53935", borderRadius: 20, padding: "6px 14px", fontSize: 13,
                fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <XCircle size={13} /> Recusar
            </button>
          )}
          {statusAtual !== "pendente" && (
            <button
              type="button"
              onClick={() => alterarStatus("pendente")}
              style={{
                background: "rgba(246,166,35,0.12)", border: "1px solid rgba(246,166,35,0.35)",
                color: "#f6a623", borderRadius: 20, padding: "6px 14px", fontSize: 13,
                fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <Clock size={13} /> Pendente
            </button>
          )}

          {/* Enviar via WhatsApp */}
          <button
            type="button"
            onClick={enviarWhatsApp}
            style={{
              background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.25)",
              color: "#a5f3c0", borderRadius: 20, padding: "6px 14px", fontSize: 13,
              fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <Send size={13} /> Enviar via WhatsApp
          </button>
        </div>
      )}

      <form className="veiculo-form-card" onSubmit={salvar} style={{ marginTop: 24 }}>
        <h3 className="veiculo-form-titulo">
          <FileText size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />
          Dados do orçamento
        </h3>

        <div className="form-grid">
          {/* Serviço vinculado */}
          <div className="form-group form-group-full">
            <label>Serviço vinculado</label>
            {isNovo ? (
              <select name="servico_id" value={form.servico_id} onChange={handleChange} required>
                <option value="">Selecione o serviço</option>
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.veiculos?.clientes?.nome} — {s.veiculos?.marca} {s.veiculos?.modelo}
                    {s.veiculos?.placa ? ` (${s.veiculos.placa})` : ""}
                    {s.descricao ? ` — ${s.descricao.slice(0, 40)}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={`${clienteExibido?.nome || ""} — ${veiculoExibido?.marca || ""} ${veiculoExibido?.modelo || ""}${veiculoExibido?.placa ? ` (${veiculoExibido.placa})` : ""}`}
                disabled
                style={{ opacity: 0.6 }}
              />
            )}
          </div>

          {/* Descrição */}
          <div className="form-group form-group-full">
            <label>Descrição do serviço</label>
            <textarea
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              className="input-textarea"
              placeholder="Descreva os serviços incluídos no orçamento"
              rows={3}
            />
          </div>

          {/* Valor */}
          <div className="form-group">
            <label>Valor total (R$)</label>
            <input
              type="number"
              name="valor_total"
              value={form.valor_total}
              onChange={handleChange}
              placeholder="0,00"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Validade */}
          <div className="form-group">
            <label>Validade (dias)</label>
            <input
              type="number"
              name="validade_dias"
              value={form.validade_dias}
              onChange={handleChange}
              placeholder="7"
              min="1"
            />
          </div>

          {/* Observações */}
          <div className="form-group form-group-full">
            <label>Observações</label>
            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={handleChange}
              className="input-textarea"
              placeholder="Observações adicionais, condições, itens incluídos..."
              rows={3}
            />
          </div>
        </div>

        <div className="form-actions form-actions-duplo" style={{ marginTop: 24 }}>
          <button type="button" className="btn-secundario-ativo" onClick={() => navigate("/orcamentos")}>
            Cancelar
          </button>
          <button type="submit" className="btn-principal" disabled={salvando}>
            {salvando ? "Salvando..." : "💾 Salvar orçamento"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default OrcamentoDetalhePage;
