import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { notificarWhatsApp, temWhatsApp } from "../utils/whatsapp";

function ServicoDetalhePage() {
  const { clienteId, veiculoId, servicoId } = useParams();
  const navigate = useNavigate();
  const isNovo = !servicoId || String(servicoId) === "novo";

  const [cliente, setCliente] = useState(null);
  const [veiculo, setVeiculo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [notificacaoEnviada, setNotificacaoEnviada] = useState(null);
  const [funileiros, setFunileiros] = useState([]);

  const [statusAnterior, setStatusAnterior] = useState("Aguardando");
  const [statusLavagemAnterior, setStatusLavagemAnterior] = useState("andamento");

  const [form, setForm] = useState({
    descricao: "",
    status: "Aguardando",
    statusPagamento: "",
    tipoPagamento: "",
    funiRespOnsavel: "",
    valorTotal: "",
    valorGasto: "",
    comissao: "",
    valorLiquido: "",
    dataEntrada: "",
    dataSaida: "",
    observacoes: "",
    encerrado: false,
    ehLavagem: false,
    valorLavagem: "",
    statusLavagem: "andamento",
    funcionarioLavagem: "",
  });

  useEffect(() => { carregarDados(); }, [clienteId, veiculoId, servicoId]);

  async function carregarDados() {
    setCarregando(true);

    const { data: clienteData } = await supabase.from("clientes").select("*").eq("id", clienteId).single();
    const { data: veiculoData } = await supabase.from("veiculos").select("*").eq("id", veiculoId).single();
    const { data: funileirosData } = await supabase
      .from("funcionarios")
      .select("id, nome")
      .eq("funcao", "FUNILEIRO")
      .order("nome");

    setCliente(clienteData);
    setVeiculo(veiculoData);
    setFunileiros(funileirosData || []);

    if (!isNovo) {
      const { data } = await supabase.from("servicos").select("*").eq("id", servicoId).single();
      if (data) {
        setForm({
          descricao: data.descricao || "",
          status: data.status || "Aguardando",
          statusPagamento: data.status_pagamento || "",
          tipoPagamento: data.tipo_pagamento || "",
          funiRespOnsavel: data.funileiro_responsavel || "",
          valorTotal: data.valor_total || "",
          valorGasto: data.valor_gasto || "",
          comissao: data.comissao || "",
          valorLiquido: data.valor_liquido || "",
          dataEntrada: data.data_entrada || "",
          dataSaida: data.data_saida || "",
          observacoes: data.observacoes || "",
          encerrado: data.encerrado || false,
          ehLavagem: data.eh_lavagem || false,
          valorLavagem: data.valor_lavagem || "",
          statusLavagem: data.status_lavagem || "andamento",
          funcionarioLavagem: data.funcionario_lavagem || "",
        });
        setStatusAnterior(data.status || "Aguardando");
        setStatusLavagemAnterior(data.status_lavagem || "andamento");
      }
    }
    setCarregando(false);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      if (name === "status") {
        const ehFinal = value.toLowerCase().includes("final") || value.toLowerCase().includes("entreg");
        return {
          ...prev,
          status: value,
          encerrado: ehFinal,
          dataSaida: ehFinal && !prev.dataSaida ? new Date().toISOString().slice(0, 10) : prev.dataSaida,
        };
      }
      if (name === "statusLavagem") return { ...prev, statusLavagem: value };
      return { ...prev, [name]: type === "checkbox" ? checked : value };
    });
  }

  function dispararNotificacao(tipo, status) {
    if (!temWhatsApp(cliente?.telefone)) return false;
    const nomeVeiculo = veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "veículo";
    return notificarWhatsApp({
      telefone: cliente.telefone,
      tipo,
      status,
      nomeCliente: cliente?.nome,
      veiculo: nomeVeiculo,
      placa: veiculo?.placa || "—",
    });
  }

  function reenviarNotificacao(tipo, status) {
    const ok = dispararNotificacao(tipo, status);
    if (ok) {
      setNotificacaoEnviada(`${tipo}-${status}`);
      setTimeout(() => setNotificacaoEnviada(null), 3000);
    } else {
      alert("Este cliente não possui telefone/WhatsApp cadastrado. Edite o cadastro do cliente para adicionar.");
    }
  }

  async function salvarServico(e) {
    e.preventDefault();
    setSalvando(true);

    const servicoFinalizado = form.status.toLowerCase().includes("final") || form.status.toLowerCase().includes("entreg");
    const lavagemFinalizada = !form.ehLavagem || form.statusLavagem === "finalizado" || form.statusLavagem === "entregue";
    const estaEncerrado = servicoFinalizado && lavagemFinalizada;

    const payload = {
      veiculo_id: veiculoId,
      descricao: form.descricao,
      status: estaEncerrado ? "Finalizado" : form.status,
      status_pagamento: form.statusPagamento,
      tipo_pagamento: form.tipoPagamento,
      funileiro_responsavel: form.funiRespOnsavel,
      valor_total: Number(form.valorTotal || 0),
      valor_gasto: Number(form.valorGasto || 0),
      comissao: Number(form.comissao || 0),
      valor_liquido: Number(form.valorLiquido || 0),
      data_entrada: form.dataEntrada || null,
      data_saida: estaEncerrado ? (form.dataSaida || new Date().toISOString().slice(0, 10)) : null,
      observacoes: form.observacoes,
      encerrado: estaEncerrado,
      eh_lavagem: form.ehLavagem,
      valor_lavagem: Number(form.valorLavagem || 0),
      status_lavagem: form.statusLavagem,
      funcionario_lavagem: form.funcionarioLavagem,
    };

    const { error } = isNovo
      ? await supabase.from("servicos").insert([payload])
      : await supabase.from("servicos").update(payload).eq("id", servicoId);

    if (error) {
      console.error("Erro ao salvar serviço:", error);
      alert("Erro ao salvar serviço: " + error.message);
      setSalvando(false);
      return;
    }

    const statusFinal = estaEncerrado ? "Finalizado" : form.status;
    if (statusFinal !== statusAnterior) dispararNotificacao("servico", statusFinal);
    if (form.ehLavagem && form.statusLavagem !== statusLavagemAnterior) dispararNotificacao("lavagem", form.statusLavagem);

    setSalvando(false);
    navigate("/servicos");
  }

  const clienteTemWhats = temWhatsApp(cliente?.telefone);
  const nomeVeiculo = veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "";

  if (carregando) return <div className="container"><h1>Carregando serviço...</h1></div>;

  return (
    <div className="container clientes-page">
      <div className="cliente-detalhe-header">
        <div>
          <h1>{isNovo ? "Novo serviço" : "Editar serviço"}</h1>
          <p className="subtitulo">
            {cliente?.nome} — {nomeVeiculo} {veiculo?.placa ? `(${veiculo.placa})` : ""}
          </p>
        </div>
        <div className="cliente-detalhe-top-actions">
          <button type="button" className="btn-secundario-ativo" onClick={() => navigate("/servicos")}>
            Voltar
          </button>
        </div>
      </div>

      {/* Banner WhatsApp */}
      {!clienteTemWhats ? (
        <div style={{ background: "rgba(255,193,7,0.12)", border: "1px solid rgba(255,193,7,0.35)", borderRadius: 12, padding: "12px 16px", marginTop: 16, fontSize: 14, color: "#ffe082" }}>
          ⚠️ Cliente sem telefone cadastrado — notificações desativadas.{" "}
          <Link to={`/clientes/${clienteId}`} style={{ color: "#ffe082", textDecoration: "underline" }}>Editar cliente</Link>
        </div>
      ) : (
        <div style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 12, padding: "12px 16px", marginTop: 16, fontSize: 14, color: "#a5f3c0" }}>
          📱 WhatsApp ativo — o cliente será notificado automaticamente quando o status mudar ao salvar.
        </div>
      )}

      <form className="veiculo-form-card" onSubmit={salvarServico} style={{ marginTop: 24 }}>
        <h3 className="veiculo-form-titulo">Dados do serviço</h3>

        <div className="form-grid">
          <div className="form-group form-group-full">
            <label>Descrição</label>
            <input name="descricao" value={form.descricao} onChange={handleChange} placeholder="Descreva o serviço" />
          </div>

          <div className="form-group">
            <label>Status do serviço</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Aguardando">Aguardando</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Finalizado">Finalizado</option>
              <option value="Entregue">Entregue</option>
            </select>
          </div>

          <div className="form-group">
            <label>Status de pagamento</label>
            <select name="statusPagamento" value={form.statusPagamento} onChange={handleChange}>
              <option value="">Selecione</option>
              <option value="Pendente">Pendente</option>
              <option value="Parcial">Parcial</option>
              <option value="Pago">Pago</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tipo de pagamento</label>
            <input name="tipoPagamento" value={form.tipoPagamento} onChange={handleChange} placeholder="PIX, cartão, dinheiro..." />
          </div>

          <div className="form-group">
            <label>Funileiro responsável</label>
            <select name="funiRespOnsavel" value={form.funiRespOnsavel} onChange={handleChange}>
              <option value="">Selecione o funileiro</option>
              {form.funiRespOnsavel &&
                !funileiros.some((funileiro) => funileiro.nome === form.funiRespOnsavel) && (
                  <option value={form.funiRespOnsavel}>{form.funiRespOnsavel}</option>
                )}
              {funileiros.map((funileiro) => (
                <option key={funileiro.id} value={funileiro.nome}>
                  {funileiro.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Valor total (R$)</label>
            <input type="number" name="valorTotal" value={form.valorTotal} onChange={handleChange} placeholder="0" />
          </div>

          <div className="form-group">
            <label>Valor gasto (R$)</label>
            <input type="number" name="valorGasto" value={form.valorGasto} onChange={handleChange} placeholder="0" />
          </div>

          <div className="form-group">
            <label>Comissão (R$)</label>
            <input type="number" name="comissao" value={form.comissao} onChange={handleChange} placeholder="0" />
          </div>

          <div className="form-group">
            <label>Valor líquido (R$)</label>
            <input type="number" name="valorLiquido" value={form.valorLiquido} onChange={handleChange} placeholder="0" />
          </div>

          <div className="form-group">
            <label>Data de entrada</label>
            <input type="date" name="dataEntrada" value={form.dataEntrada} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Data de saída</label>
            <input type="date" name="dataSaida" value={form.dataSaida} onChange={handleChange} />
          </div>

          <div className="form-group form-group-full">
            <label>Observações</label>
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className="input-textarea" placeholder="Observações do serviço" />
          </div>
        </div>

        {/* LAVAGEM */}
        <h3 className="veiculo-form-titulo" style={{ marginTop: 24 }}>Lavagem</h3>
        <div className="form-grid">
          <div className="form-group form-group-full">
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" name="ehLavagem" checked={form.ehLavagem} onChange={handleChange} style={{ width: 18, height: 18 }} />
              Este serviço inclui lavagem
            </label>
          </div>

          {form.ehLavagem && (
            <>
              <div className="form-group">
                <label>Valor da lavagem (R$)</label>
                <input type="number" name="valorLavagem" value={form.valorLavagem} onChange={handleChange} placeholder="0" />
              </div>

              <div className="form-group">
                <label>Status da lavagem</label>
                <select name="statusLavagem" value={form.statusLavagem} onChange={handleChange}>
                  <option value="andamento">Andamento</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="entregue">Entregue</option>
                </select>
              </div>

              <div className="form-group">
                <label>Funcionário da lavagem</label>
                <input name="funcionarioLavagem" value={form.funcionarioLavagem} onChange={handleChange} placeholder="Nome do funcionário" />
              </div>
            </>
          )}
        </div>

        {/* NOTIFICAÇÕES MANUAIS */}
        {!isNovo && (
          <div style={{ marginTop: 28 }}>
            <h3 className="veiculo-form-titulo">📱 Reenviar notificação WhatsApp</h3>
            {clienteTemWhats ? (
              <>
                <p style={{ fontSize: 13, color: "#aaa", marginBottom: 14 }}>
                  Abre o WhatsApp com a mensagem pronta — é só clicar em Enviar.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {["Aguardando", "Em andamento", "Finalizado", "Entregue"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="btn-secundario-ativo"
                      style={{ fontSize: 13, background: notificacaoEnviada === `servico-${s}` ? "rgba(37,211,102,0.18)" : undefined }}
                      onClick={() => reenviarNotificacao("servico", s)}
                    >
                      {notificacaoEnviada === `servico-${s}` ? `✓ Aberto` : `🔧 Serviço: ${s}`}
                    </button>
                  ))}
                  {form.ehLavagem && ["andamento", "finalizado", "entregue"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="btn-secundario-ativo"
                      style={{ fontSize: 13, background: notificacaoEnviada === `lavagem-${s}` ? "rgba(37,211,102,0.18)" : undefined }}
                      onClick={() => reenviarNotificacao("lavagem", s)}
                    >
                      {notificacaoEnviada === `lavagem-${s}` ? `✓ Aberto` : `🚿 Lavagem: ${s}`}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: "#f6a623" }}>
                ⚠️ Cadastre o telefone do cliente para habilitar.{" "}
                <Link to={`/clientes/${clienteId}`} style={{ color: "#f6a623", textDecoration: "underline" }}>Editar cliente</Link>
              </p>
            )}
          </div>
        )}

        <div className="form-actions form-actions-duplo" style={{ marginTop: 28 }}>
          <button type="button" className="btn-secundario-ativo" onClick={() => navigate("/servicos")}>Cancelar</button>
          <button type="submit" className="btn-principal" disabled={salvando}>
            {salvando ? "Salvando..." : clienteTemWhats ? "💾 Salvar e notificar" : "💾 Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ServicoDetalhePage;
