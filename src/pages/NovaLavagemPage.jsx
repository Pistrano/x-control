import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function NovaLavagemPage() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);

  const [tipoCliente, setTipoCliente] = useState("existente");
  const [tipoVeiculo, setTipoVeiculo] = useState("existente");

  const [clienteId, setClienteId] = useState("");
  const [veiculoId, setVeiculoId] = useState("");

  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    telefone: "",
    cpf_cnpj: "",
    observacoes: "",
  });

  const [novoVeiculo, setNovoVeiculo] = useState({
    marca: "",
    modelo: "",
    placa: "",
    ano: "",
    observacoes: "",
  });

  const [form, setForm] = useState({
    valorLavagem: "",
    valorCusto: "",
    statusLavagem: "andamento",
    funcionarioLavagem: "",
    observacoes: "",
  });

  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarClientes();
  }, []);

  useEffect(() => {
    if (clienteId) {
      carregarVeiculos(clienteId);
    } else {
      setVeiculos([]);
      setVeiculoId("");
    }
  }, [clienteId]);

  async function carregarClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      alert("Erro ao carregar clientes: " + error.message);
      return;
    }

    setClientes(data || []);
  }

  async function carregarVeiculos(idCliente) {
    const { data, error } = await supabase
      .from("veiculos")
      .select("*")
      .eq("cliente_id", idCliente)
      .order("modelo", { ascending: true });

    if (error) {
      alert("Erro ao carregar veículos: " + error.message);
      return;
    }

    setVeiculos(data || []);
  }

  function calcularLiquido() {
    const valor = Number(form.valorLavagem || 0);
    const custo = Number(form.valorCusto || 0);
    return Math.max(valor - custo, 0);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleNovoClienteChange(e) {
    const { name, value } = e.target;
    setNovoCliente((prev) => ({ ...prev, [name]: value }));
  }

  function handleNovoVeiculoChange(e) {
    const { name, value } = e.target;
    setNovoVeiculo((prev) => ({ ...prev, [name]: value }));
  }

  async function salvarLavagem(e) {
    e.preventDefault();
    setSalvando(true);

    let clienteFinalId = clienteId;
    let veiculoFinalId = veiculoId;

    if (tipoCliente === "novo") {
      if (!novoCliente.nome.trim()) {
        alert("Informe o nome do cliente.");
        setSalvando(false);
        return;
      }

      const { data, error } = await supabase
        .from("clientes")
        .insert([
          {
            nome: novoCliente.nome.trim(),
            telefone: novoCliente.telefone || "",
            cpf_cnpj: novoCliente.cpf_cnpj || "",
            observacoes: novoCliente.observacoes || "",
          },
        ])
        .select()
        .single();

      if (error) {
        alert("Erro ao criar cliente: " + error.message);
        setSalvando(false);
        return;
      }

      clienteFinalId = data.id;
    }

    if (!clienteFinalId) {
      alert("Selecione ou cadastre um cliente.");
      setSalvando(false);
      return;
    }

    if (tipoVeiculo === "novo") {
      if (!novoVeiculo.marca.trim() || !novoVeiculo.modelo.trim()) {
        alert("Informe marca e modelo do veículo.");
        setSalvando(false);
        return;
      }

      const { data, error } = await supabase
        .from("veiculos")
        .insert([
          {
            cliente_id: clienteFinalId,
            marca: novoVeiculo.marca || "",
            modelo: novoVeiculo.modelo || "",
            placa: novoVeiculo.placa || "",
            ano: novoVeiculo.ano || "",
            observacoes: novoVeiculo.observacoes || "",
          },
        ])
        .select()
        .single();

      if (error) {
        alert("Erro ao criar veículo: " + error.message);
        setSalvando(false);
        return;
      }

      veiculoFinalId = data.id;
    }

    if (!veiculoFinalId) {
      alert("Selecione ou cadastre um veículo.");
      setSalvando(false);
      return;
    }

    const valorLavagem = Number(form.valorLavagem || 0);
    const valorCusto = Number(form.valorCusto || 0);
    const valorLiquido = calcularLiquido();

    const lavagemEncerrada =
      form.statusLavagem === "finalizado" ||
      form.statusLavagem === "entregue";

    const statusPrincipal = lavagemEncerrada ? "Finalizado" : "Em andamento";

    const { error } = await supabase.from("servicos").insert([
      {
        veiculo_id: veiculoFinalId,
        descricao: "Lavagem",
        status: statusPrincipal,
        status_pagamento: "Pendente",
        tipo_pagamento: "",
        valor_total: valorLavagem,
        valor_gasto: valorCusto,
        comissao: 0,
        valor_liquido: valorLiquido,
        funileiro_responsavel: "",
        data_entrada: new Date().toISOString().slice(0, 10),
        data_saida: lavagemEncerrada
          ? new Date().toISOString().slice(0, 10)
          : null,
        observacoes: form.observacoes || "Lavagem cadastrada pela aba Lavagem",
        encerrado: lavagemEncerrada,

        eh_lavagem: true,
        valor_lavagem: valorLavagem,
        status_lavagem: form.statusLavagem,
        funcionario_lavagem: form.funcionarioLavagem || "",
      },
    ]);

    if (error) {
      alert("Erro ao salvar lavagem: " + error.message);
      setSalvando(false);
      return;
    }

    setSalvando(false);
    navigate("/lavagem");
  }

  return (
    <div className="container clientes-page">
      <div className="cliente-detalhe-header">
        <div>
          <h1>Nova lavagem</h1>
          <p className="subtitulo">
            Cadastre uma lavagem com cliente e veículo existente ou novo
          </p>
        </div>

        <button
          type="button"
          className="btn-secundario-ativo"
          onClick={() => navigate("/lavagem")}
        >
          Voltar
        </button>
      </div>

      <form
        className="veiculo-form-card"
        onSubmit={salvarLavagem}
        style={{ marginTop: 24 }}
      >
        <h3 className="veiculo-form-titulo">Cliente</h3>

        <div className="form-grid">
          <div className="form-group">
            <label>Tipo de cliente</label>
            <select
              value={tipoCliente}
              onChange={(e) => {
                setTipoCliente(e.target.value);
                setClienteId("");
                setVeiculoId("");
              }}
            >
              <option value="existente">Cliente existente</option>
              <option value="novo">Novo cliente</option>
            </select>
          </div>

          {tipoCliente === "existente" ? (
            <div className="form-group">
              <label>Cliente</label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
              >
                <option value="">Selecione o cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Nome do cliente</label>
                <input
                  name="nome"
                  value={novoCliente.nome}
                  onChange={handleNovoClienteChange}
                  placeholder="Nome do cliente"
                />
              </div>

              <div className="form-group">
                <label>Telefone</label>
                <input
                  name="telefone"
                  value={novoCliente.telefone}
                  onChange={handleNovoClienteChange}
                  placeholder="Telefone"
                />
              </div>

              <div className="form-group">
                <label>CPF/CNPJ</label>
                <input
                  name="cpf_cnpj"
                  value={novoCliente.cpf_cnpj}
                  onChange={handleNovoClienteChange}
                  placeholder="CPF ou CNPJ"
                />
              </div>

              <div className="form-group form-group-full">
                <label>Observações do cliente</label>
                <textarea
                  name="observacoes"
                  value={novoCliente.observacoes}
                  onChange={handleNovoClienteChange}
                  className="input-textarea"
                  placeholder="Observações do cliente"
                />
              </div>
            </>
          )}
        </div>

        <h3 className="veiculo-form-titulo" style={{ marginTop: 24 }}>
          Veículo
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label>Tipo de veículo</label>
            <select
              value={tipoVeiculo}
              onChange={(e) => {
                setTipoVeiculo(e.target.value);
                setVeiculoId("");
              }}
            >
              <option value="existente">Veículo existente</option>
              <option value="novo">Novo veículo</option>
            </select>
          </div>

          {tipoVeiculo === "existente" ? (
            <div className="form-group">
              <label>Veículo</label>
              <select
                value={veiculoId}
                onChange={(e) => setVeiculoId(e.target.value)}
                disabled={!clienteId}
              >
                <option value="">
                  {clienteId
                    ? "Selecione o veículo"
                    : "Selecione o cliente primeiro"}
                </option>

                {veiculos.map((veiculo) => (
                  <option key={veiculo.id} value={veiculo.id}>
                    {veiculo.marca} {veiculo.modelo} - {veiculo.placa}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Marca</label>
                <input
                  name="marca"
                  value={novoVeiculo.marca}
                  onChange={handleNovoVeiculoChange}
                  placeholder="Ex.: Toyota"
                />
              </div>

              <div className="form-group">
                <label>Modelo</label>
                <input
                  name="modelo"
                  value={novoVeiculo.modelo}
                  onChange={handleNovoVeiculoChange}
                  placeholder="Ex.: Corolla"
                />
              </div>

              <div className="form-group">
                <label>Placa</label>
                <input
                  name="placa"
                  value={novoVeiculo.placa}
                  onChange={handleNovoVeiculoChange}
                  placeholder="ABC-1234"
                />
              </div>

              <div className="form-group">
                <label>Ano</label>
                <input
                  name="ano"
                  value={novoVeiculo.ano}
                  onChange={handleNovoVeiculoChange}
                  placeholder="2020"
                />
              </div>

              <div className="form-group form-group-full">
                <label>Observações do veículo</label>
                <textarea
                  name="observacoes"
                  value={novoVeiculo.observacoes}
                  onChange={handleNovoVeiculoChange}
                  className="input-textarea"
                  placeholder="Observações do veículo"
                />
              </div>
            </>
          )}
        </div>

        <h3 className="veiculo-form-titulo" style={{ marginTop: 24 }}>
          Dados da lavagem
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label>Valor da lavagem</label>
            <input
              type="number"
              name="valorLavagem"
              value={form.valorLavagem}
              onChange={handleFormChange}
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Valor de custo</label>
            <input
              type="number"
              name="valorCusto"
              value={form.valorCusto}
              onChange={handleFormChange}
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Valor líquido</label>
            <input type="number" value={calcularLiquido()} readOnly />
          </div>

          <div className="form-group">
            <label>Status da lavagem</label>
            <select
              name="statusLavagem"
              value={form.statusLavagem}
              onChange={handleFormChange}
            >
              <option value="andamento">Andamento</option>
              <option value="finalizado">Finalizado</option>
              <option value="entregue">Entregue</option>
            </select>
          </div>

          <div className="form-group">
            <label>Funcionário responsável</label>
            <input
              name="funcionarioLavagem"
              value={form.funcionarioLavagem}
              onChange={handleFormChange}
              placeholder="Nome do funcionário"
            />
          </div>

          <div className="form-group form-group-full">
            <label>Observações da lavagem</label>
            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={handleFormChange}
              className="input-textarea"
              placeholder="Observações da lavagem"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-principal" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar lavagem"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NovaLavagemPage;