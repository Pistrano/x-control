import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { notificarWhatsApp, temWhatsApp } from "../utils/whatsapp";

function NovaLavagemPage() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);

  const [tipoCliente, setTipoCliente] = useState("existente");
  const [tipoVeiculo, setTipoVeiculo] = useState("existente");

  const [clienteId, setClienteId] = useState("");
  const [veiculoId, setVeiculoId] = useState("");

  const [novoCliente, setNovoCliente] = useState({ nome: "", telefone: "", cpf_cnpj: "", observacoes: "" });
  const [novoVeiculo, setNovoVeiculo] = useState({ marca: "", modelo: "", placa: "", ano: "", observacoes: "" });

  const [form, setForm] = useState({
    valorLavagem: "",
    valorCusto: "",
    statusLavagem: "andamento",
    funcionarioLavagem: "",
    observacoes: "",
  });

  const [salvando, setSalvando] = useState(false);

  useEffect(() => { carregarClientes(); }, []);
  useEffect(() => {
    if (clienteId) carregarVeiculos(clienteId);
    else { setVeiculos([]); setVeiculoId(""); }
  }, [clienteId]);

  async function carregarClientes() {
    const { data, error } = await supabase.from("clientes").select("*").order("nome", { ascending: true });
    if (error) { alert("Erro ao carregar clientes: " + error.message); return; }
    setClientes(data || []);
  }

  async function carregarVeiculos(idCliente) {
    const { data, error } = await supabase.from("veiculos").select("*").eq("cliente_id", idCliente).order("modelo", { ascending: true });
    if (error) { alert("Erro ao carregar veículos: " + error.message); return; }
    setVeiculos(data || []);
  }

  function calcularLiquido() {
    return Math.max(Number(form.valorLavagem || 0) - Number(form.valorCusto || 0), 0);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function salvarLavagem(e) {
    e.preventDefault();
    setSalvando(true);

    let clienteFinalId = clienteId;
    let veiculoFinalId = veiculoId;
    let clienteFinal = clientes.find((c) => String(c.id) === String(clienteId));
    let veiculoFinal = veiculos.find((v) => String(v.id) === String(veiculoId));

    // Criar novo cliente se necessário
    if (tipoCliente === "novo") {
      if (!novoCliente.nome.trim()) { alert("Informe o nome do cliente."); setSalvando(false); return; }
      const { data, error } = await supabase.from("clientes").insert([{
        nome: novoCliente.nome.trim(),
        telefone: novoCliente.telefone || "",
        cpf_cnpj: novoCliente.cpf_cnpj || "",
        observacoes: novoCliente.observacoes || "",
      }]).select().single();
      if (error) { alert("Erro ao criar cliente: " + error.message); setSalvando(false); return; }
      clienteFinalId = data.id;
      clienteFinal = data;
    }

    if (!clienteFinalId) { alert("Selecione ou cadastre um cliente."); setSalvando(false); return; }

    // Criar novo veículo se necessário
    if (tipoVeiculo === "novo") {
      if (!novoVeiculo.marca.trim() || !novoVeiculo.modelo.trim()) { alert("Informe marca e modelo do veículo."); setSalvando(false); return; }
      const { data, error } = await supabase.from("veiculos").insert([{
        cliente_id: clienteFinalId,
        marca: novoVeiculo.marca || "",
        modelo: novoVeiculo.modelo || "",
        placa: novoVeiculo.placa || "",
        ano: novoVeiculo.ano || "",
        observacoes: novoVeiculo.observacoes || "",
      }]).select().single();
      if (error) { alert("Erro ao criar veículo: " + error.message); setSalvando(false); return; }
      veiculoFinalId = data.id;
      veiculoFinal = data;
    }

    if (!veiculoFinalId) { alert("Selecione ou cadastre um veículo."); setSalvando(false); return; }

    const valorLavagem = Number(form.valorLavagem || 0);
    const valorCusto = Number(form.valorCusto || 0);
    const valorLiquido = calcularLiquido();
    const lavagemEncerrada = form.statusLavagem === "finalizado" || form.statusLavagem === "entregue";
    const statusPrincipal = lavagemEncerrada ? "Finalizado" : "Em andamento";

    const { error } = await supabase.from("servicos").insert([{
      veiculo_id: veiculoFinalId,
      tipo_servico: "Lavagem",
      descricao: "Lavagem",
      status: statusPrincipal,
      status_pagamento: "Pendente",
      tipo_pagamento: "",
      valor: valorLavagem,
      valor_total: valorLavagem,
      valor_gasto: valorCusto,
      comissao: 0,
      valor_liquido: valorLiquido,
      funileiro_responsavel: "",
      data_entrada: new Date().toISOString().slice(0, 10),
      data_saida: lavagemEncerrada ? new Date().toISOString().slice(0, 10) : null,
      observacoes: form.observacoes || "Lavagem cadastrada pela aba Lavagem",
      encerrado: lavagemEncerrada,
      eh_lavagem: true,
      valor_lavagem: valorLavagem,
      status_lavagem: form.statusLavagem,
      funcionario_lavagem: form.funcionarioLavagem || "",
    }]);

    if (error) { alert("Erro ao salvar lavagem: " + error.message); setSalvando(false); return; }

    // Notificação automática via WhatsApp
    const telefone = clienteFinal?.telefone;
    if (temWhatsApp(telefone)) {
      const nomeVeiculo = veiculoFinal ? `${veiculoFinal.marca} ${veiculoFinal.modelo}` : "veículo";
      const placa = veiculoFinal?.placa || "—";
      notificarWhatsApp({
        telefone,
        tipo: "lavagem",
        status: form.statusLavagem,
        nomeCliente: clienteFinal?.nome,
        veiculo: nomeVeiculo,
        placa,
      });
    }

    setSalvando(false);
    navigate("/lavagem");
  }

  const clienteSelecionado = clientes.find((c) => String(c.id) === String(clienteId));
  const clienteTemWhats = tipoCliente === "novo"
    ? temWhatsApp(novoCliente.telefone)
    : temWhatsApp(clienteSelecionado?.telefone);

  return (
    <div className="container clientes-page">
      <div className="cliente-detalhe-header">
        <div>
          <h1>Nova lavagem</h1>
          <p className="subtitulo">Cadastre uma lavagem com cliente e veículo existente ou novo</p>
        </div>
        <button type="button" className="btn-secundario-ativo" onClick={() => navigate("/lavagem")}>Voltar</button>
      </div>

      {/* Banner WhatsApp */}
      {clienteTemWhats ? (
        <div style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 12, padding: "12px 16px", marginTop: 16, fontSize: 14, color: "#a5f3c0" }}>
          📱 Cliente com WhatsApp — será notificado automaticamente ao salvar.
        </div>
      ) : (clienteId || tipoCliente === "novo") ? (
        <div style={{ background: "rgba(255,193,7,0.12)", border: "1px solid rgba(255,193,7,0.35)", borderRadius: 12, padding: "12px 16px", marginTop: 16, fontSize: 14, color: "#ffe082" }}>
          ⚠️ Cliente sem telefone — notificação não será enviada.
        </div>
      ) : null}

      <form className="veiculo-form-card" onSubmit={salvarLavagem} style={{ marginTop: 24 }}>
        {/* CLIENTE */}
        <h3 className="veiculo-form-titulo">Cliente</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Tipo de cliente</label>
            <select value={tipoCliente} onChange={(e) => { setTipoCliente(e.target.value); setClienteId(""); setVeiculoId(""); }}>
              <option value="existente">Cliente existente</option>
              <option value="novo">Novo cliente</option>
            </select>
          </div>

          {tipoCliente === "existente" ? (
            <div className="form-group">
              <label>Cliente</label>
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Selecione o cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Nome do cliente</label>
                <input name="nome" value={novoCliente.nome} onChange={(e) => setNovoCliente((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome do cliente" />
              </div>
              <div className="form-group">
                <label>WhatsApp / Telefone</label>
                <input name="telefone" value={novoCliente.telefone} onChange={(e) => setNovoCliente((p) => ({ ...p, telefone: e.target.value }))} placeholder="(65) 99999-0000" />
              </div>
              <div className="form-group">
                <label>CPF/CNPJ</label>
                <input name="cpf_cnpj" value={novoCliente.cpf_cnpj} onChange={(e) => setNovoCliente((p) => ({ ...p, cpf_cnpj: e.target.value }))} placeholder="Opcional" />
              </div>
            </>
          )}
        </div>

        {/* VEÍCULO */}
        <h3 className="veiculo-form-titulo" style={{ marginTop: 24 }}>Veículo</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Tipo de veículo</label>
            <select value={tipoVeiculo} onChange={(e) => { setTipoVeiculo(e.target.value); setVeiculoId(""); }}>
              <option value="existente">Veículo existente</option>
              <option value="novo">Novo veículo</option>
            </select>
          </div>

          {tipoVeiculo === "existente" ? (
            <div className="form-group">
              <label>Veículo</label>
              <select value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)} disabled={!clienteId}>
                <option value="">{clienteId ? "Selecione o veículo" : "Selecione o cliente primeiro"}</option>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.placa}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Marca</label>
                <input name="marca" value={novoVeiculo.marca} onChange={(e) => setNovoVeiculo((p) => ({ ...p, marca: e.target.value }))} placeholder="Ex.: Toyota" />
              </div>
              <div className="form-group">
                <label>Modelo</label>
                <input name="modelo" value={novoVeiculo.modelo} onChange={(e) => setNovoVeiculo((p) => ({ ...p, modelo: e.target.value }))} placeholder="Ex.: Corolla" />
              </div>
              <div className="form-group">
                <label>Placa</label>
                <input name="placa" value={novoVeiculo.placa} onChange={(e) => setNovoVeiculo((p) => ({ ...p, placa: e.target.value }))} placeholder="ABC-1234" />
              </div>
              <div className="form-group">
                <label>Ano</label>
                <input name="ano" value={novoVeiculo.ano} onChange={(e) => setNovoVeiculo((p) => ({ ...p, ano: e.target.value }))} placeholder="2020" />
              </div>
            </>
          )}
        </div>

        {/* DADOS DA LAVAGEM */}
        <h3 className="veiculo-form-titulo" style={{ marginTop: 24 }}>Dados da lavagem</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Valor da lavagem (R$)</label>
            <input type="number" name="valorLavagem" value={form.valorLavagem} onChange={handleFormChange} placeholder="0" />
          </div>
          <div className="form-group">
            <label>Valor de custo (R$)</label>
            <input type="number" name="valorCusto" value={form.valorCusto} onChange={handleFormChange} placeholder="0" />
          </div>
          <div className="form-group">
            <label>Valor líquido (R$)</label>
            <input type="number" value={calcularLiquido()} readOnly />
          </div>
          <div className="form-group">
            <label>Status da lavagem</label>
            <select name="statusLavagem" value={form.statusLavagem} onChange={handleFormChange}>
              <option value="andamento">Andamento</option>
              <option value="finalizado">Finalizado</option>
              <option value="entregue">Entregue</option>
            </select>
          </div>
          <div className="form-group">
            <label>Funcionário responsável</label>
            <input name="funcionarioLavagem" value={form.funcionarioLavagem} onChange={handleFormChange} placeholder="Nome do funcionário" />
          </div>
          <div className="form-group form-group-full">
            <label>Observações</label>
            <textarea name="observacoes" value={form.observacoes} onChange={handleFormChange} className="input-textarea" placeholder="Observações da lavagem" />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-principal" disabled={salvando}>
            {salvando ? "Salvando..." : clienteTemWhats ? "💾 Salvar e notificar" : "💾 Salvar lavagem"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NovaLavagemPage;
