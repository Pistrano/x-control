import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

function ClienteDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [servicosPorVeiculo, setServicosPorVeiculo] = useState({});
  const [carregando, setCarregando] = useState(true);

  const [mostrarEditarCliente, setMostrarEditarCliente] = useState(false);
  const [clienteForm, setClienteForm] = useState({
    nome: "",
    telefone: "",
    cpfCnpj: "",
  });

  const [mostrarNovoVeiculo, setMostrarNovoVeiculo] = useState(false);
  const [veiculoEditandoId, setVeiculoEditandoId] = useState(null);
  const [veiculoForm, setVeiculoForm] = useState({
    marca: "",
    modelo: "",
    ano: "",
    placa: "",
  });

  const [veiculoVistoriaAbertaId, setVeiculoVistoriaAbertaId] = useState(null);
  const [veiculoServicosAbertoId, setVeiculoServicosAbertoId] = useState(null);

  useEffect(() => {
    carregarTudo();
  }, [id]);

  async function carregarTudo() {
    setCarregando(true);

    const { data: clienteData, error: clienteError } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .single();

    if (clienteError) {
      console.error("Erro ao buscar cliente:", clienteError);
      setCarregando(false);
      return;
    }

    setCliente(clienteData);

    setClienteForm({
      nome: clienteData.nome || "",
      telefone: clienteData.telefone || "",
      cpfCnpj: clienteData.cpf_cnpj || "",
    });

    const { data: veiculosData, error: veiculosError } = await supabase
      .from("veiculos")
      .select("*")
      .eq("cliente_id", id)
      .order("created_at", { ascending: false });

    if (veiculosError) {
      console.error("Erro ao buscar veículos:", veiculosError);
      setVeiculos([]);
      setServicosPorVeiculo({});
      setCarregando(false);
      return;
    }

    setVeiculos(veiculosData || []);

    if (!veiculosData || veiculosData.length === 0) {
      setServicosPorVeiculo({});
      setCarregando(false);
      return;
    }

    const idsVeiculos = veiculosData.map((veiculo) => veiculo.id);

    const { data: servicosData, error: servicosError } = await supabase
      .from("servicos")
      .select("*")
      .in("veiculo_id", idsVeiculos);

    if (servicosError) {
      console.error("Erro ao buscar serviços:", servicosError);
    }

    const agrupados = {};
    (servicosData || []).forEach((servico) => {
      if (!agrupados[servico.veiculo_id]) {
        agrupados[servico.veiculo_id] = [];
      }
      agrupados[servico.veiculo_id].push(servico);
    });

    setServicosPorVeiculo(agrupados);
    setCarregando(false);
  }

  function handleClienteChange(e) {
    const { name, value } = e.target;
    setClienteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function salvarEdicaoCliente(e) {
    e.preventDefault();

    if (!clienteForm.nome.trim()) {
      alert("Preencha o nome do cliente.");
      return;
    }

    const { error } = await supabase
      .from("clientes")
      .update({
        nome: clienteForm.nome.trim(),
        telefone: clienteForm.telefone.trim(),
        cpf_cnpj: clienteForm.cpfCnpj.trim(),
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao editar cliente:", error);
      alert(`Erro ao editar cliente: ${error.message}`);
      return;
    }

    setMostrarEditarCliente(false);
    carregarTudo();
  }

  async function excluirCliente() {
    const confirmar = window.confirm("Tem certeza que deseja excluir este cliente?");
    if (!confirmar) return;

    if (veiculos.length > 0) {
      alert("Não é possível excluir cliente com veículos cadastrados.");
      return;
    }

    const { error } = await supabase.from("clientes").delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir cliente:", error);
      alert(`Erro ao excluir cliente: ${error.message}`);
      return;
    }

    navigate("/clientes");
  }

  function resetVeiculoForm() {
    setVeiculoForm({
      marca: "",
      modelo: "",
      ano: "",
      placa: "",
    });
    setVeiculoEditandoId(null);
    setMostrarNovoVeiculo(false);
  }

  function handleVeiculoChange(e) {
    const { name, value } = e.target;
    setVeiculoForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function salvarVeiculo(e) {
    e.preventDefault();

    if (
      !veiculoForm.marca.trim() ||
      !veiculoForm.modelo.trim() ||
      !veiculoForm.placa.trim()
    ) {
      alert("Preencha marca, modelo e placa.");
      return;
    }

    if (veiculoEditandoId) {
      const { error } = await supabase
        .from("veiculos")
        .update({
          marca: veiculoForm.marca.trim(),
          modelo: veiculoForm.modelo.trim(),
          ano: veiculoForm.ano.trim() ? Number(veiculoForm.ano) : null,
          placa: veiculoForm.placa.trim(),
        })
        .eq("id", veiculoEditandoId);

      if (error) {
        console.error("Erro ao editar veículo:", error);
        alert(`Erro ao editar veículo: ${error.message}`);
        return;
      }
    } else {
      const { error } = await supabase.from("veiculos").insert([
        {
          cliente_id: id,
          marca: veiculoForm.marca.trim(),
          modelo: veiculoForm.modelo.trim(),
          ano: veiculoForm.ano.trim() ? Number(veiculoForm.ano) : null,
          placa: veiculoForm.placa.trim(),
        },
      ]);

      if (error) {
        console.error("Erro ao salvar veículo:", error);
        alert(`Erro ao salvar veículo: ${error.message}`);
        return;
      }
    }

    resetVeiculoForm();
    carregarTudo();
  }

  function editarVeiculo(veiculo) {
    setVeiculoEditandoId(veiculo.id);
    setVeiculoForm({
      marca: veiculo.marca || "",
      modelo: veiculo.modelo || "",
      ano: veiculo.ano || "",
      placa: veiculo.placa || "",
    });
    setMostrarNovoVeiculo(true);
  }

  async function excluirVeiculo(veiculoId) {
    const veiculoServicos = servicosPorVeiculo[veiculoId] || [];

    if (veiculoServicos.length > 0) {
      alert("Não é possível excluir um veículo que possui serviços cadastrados.");
      return;
    }

    const confirmar = window.confirm("Deseja excluir este veículo?");
    if (!confirmar) return;

    const { error } = await supabase.from("veiculos").delete().eq("id", veiculoId);

    if (error) {
      console.error("Erro ao excluir veículo:", error);
      alert(`Erro ao excluir veículo: ${error.message}`);
      return;
    }

    if (String(veiculoVistoriaAbertaId) === String(veiculoId)) {
      setVeiculoVistoriaAbertaId(null);
    }

    if (String(veiculoServicosAbertoId) === String(veiculoId)) {
      setVeiculoServicosAbertoId(null);
    }

    carregarTudo();
  }

  function toggleVistoria(veiculoId) {
    setVeiculoVistoriaAbertaId((prev) =>
      String(prev) === String(veiculoId) ? null : veiculoId
    );
  }

  function toggleServicos(veiculoId) {
    setVeiculoServicosAbertoId((prev) =>
      String(prev) === String(veiculoId) ? null : veiculoId
    );
  }

  function textoStatusServico(servico) {
    const status = String(servico.status || "").trim();
    if (status) return status;
    return servico.encerrado ? "Finalizado" : "Em andamento";
  }

  const totalVeiculos = useMemo(() => veiculos.length, [veiculos]);

  if (carregando) {
    return (
      <div className="container">
        <h1>Carregando cliente...</h1>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="container">
        <h1>Cliente não encontrado</h1>
        <Link
          to="/clientes"
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
          <h1>{cliente.nome}</h1>
          <p className="subtitulo">Ficha completa do cliente</p>
        </div>

        <div className="cliente-detalhe-top-actions">
          <button
            type="button"
            className="btn-principal"
            onClick={() => setMostrarEditarCliente((prev) => !prev)}
          >
            {mostrarEditarCliente ? "Fechar edição" : "Editar cliente"}
          </button>

          <button
            type="button"
            className="btn-principal"
            onClick={() => {
              if (mostrarNovoVeiculo && !veiculoEditandoId) {
                setMostrarNovoVeiculo(false);
              } else {
                setVeiculoEditandoId(null);
                setMostrarNovoVeiculo(true);
              }
            }}
          >
            {mostrarNovoVeiculo && !veiculoEditandoId
              ? "Fechar veículo"
              : "+ Adicionar veículo"}
          </button>

          <button
            type="button"
            className="btn-excluir"
            onClick={excluirCliente}
          >
            Excluir cliente
          </button>

          <Link
            to="/clientes"
            className="btn-secundario-ativo"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Voltar
          </Link>
        </div>
      </div>

      {mostrarEditarCliente && (
        <form
          className="veiculo-form-card"
          onSubmit={salvarEdicaoCliente}
          style={{ marginTop: 24 }}
        >
          <h3 className="veiculo-form-titulo">Editar cliente</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Nome *</label>
              <input
                type="text"
                name="nome"
                value={clienteForm.nome}
                onChange={handleClienteChange}
                placeholder="Nome"
              />
            </div>

            <div className="form-group">
              <label>Telefone</label>
              <input
                type="text"
                name="telefone"
                value={clienteForm.telefone}
                onChange={handleClienteChange}
                placeholder="Telefone"
              />
            </div>

            <div className="form-group form-group-full">
              <label>CPF/CNPJ</label>
              <input
                type="text"
                name="cpfCnpj"
                value={clienteForm.cpfCnpj}
                onChange={handleClienteChange}
                placeholder="CPF/CNPJ"
              />
            </div>
          </div>

          <div className="form-actions form-actions-duplo">
            <button
              type="button"
              className="btn-secundario-ativo"
              onClick={() => setMostrarEditarCliente(false)}
            >
              Cancelar
            </button>

            <button type="submit" className="btn-principal">
              Salvar cliente
            </button>
          </div>
        </form>
      )}

      <div className="cliente-dados-grid" style={{ marginTop: 24 }}>
        <div className="cliente-dado-box">
          <span className="cliente-dado-label">Nome</span>
          <strong>{cliente.nome}</strong>
        </div>

        <div className="cliente-dado-box">
          <span className="cliente-dado-label">Telefone</span>
          <strong>
            {cliente.telefone?.trim() ? cliente.telefone : "Não informado"}
          </strong>
        </div>

        <div className="cliente-dado-box">
          <span className="cliente-dado-label">CPF/CNPJ</span>
          <strong>
            {cliente.cpf_cnpj?.trim() ? cliente.cpf_cnpj : "Não informado"}
          </strong>
        </div>

        <div className="cliente-dado-box">
          <span className="cliente-dado-label">Total de veículos</span>
          <strong>{totalVeiculos}</strong>
        </div>
      </div>

      {mostrarNovoVeiculo && (
        <form
          className="veiculo-form-card"
          onSubmit={salvarVeiculo}
          style={{ marginTop: 24 }}
        >
          <h3 className="veiculo-form-titulo">
            {veiculoEditandoId ? "Editar veículo" : "Novo veículo"}
          </h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Marca *</label>
              <input
                type="text"
                name="marca"
                value={veiculoForm.marca}
                onChange={handleVeiculoChange}
                placeholder="Ex.: Fiat"
              />
            </div>

            <div className="form-group">
              <label>Modelo *</label>
              <input
                type="text"
                name="modelo"
                value={veiculoForm.modelo}
                onChange={handleVeiculoChange}
                placeholder="Ex.: Strada"
              />
            </div>

            <div className="form-group">
              <label>Ano</label>
              <input
                type="text"
                name="ano"
                value={veiculoForm.ano}
                onChange={handleVeiculoChange}
                placeholder="Ex.: 2022"
              />
            </div>

            <div className="form-group">
              <label>Placa *</label>
              <input
                type="text"
                name="placa"
                value={veiculoForm.placa}
                onChange={handleVeiculoChange}
                placeholder="Ex.: ABC1D23"
              />
            </div>
          </div>

          <div className="form-actions form-actions-duplo">
            <button
              type="button"
              className="btn-secundario-ativo"
              onClick={resetVeiculoForm}
            >
              Cancelar
            </button>

            <button type="submit" className="btn-principal">
              {veiculoEditandoId ? "Salvar edição" : "Salvar veículo"}
            </button>
          </div>
        </form>
      )}

      <div className="veiculos-lista" style={{ marginTop: 28 }}>
        <h3 className="veiculos-lista-titulo">Veículos cadastrados</h3>

        {veiculos.length === 0 ? (
          <div className="veiculos-vazio">
            <p>Nenhum veículo cadastrado para este cliente.</p>
          </div>
        ) : (
          <div className="veiculos-grid">
            {veiculos.map((veiculo) => {
              const vistoriaAberta =
                String(veiculoVistoriaAbertaId) === String(veiculo.id);
              const servicosAbertos =
                String(veiculoServicosAbertoId) === String(veiculo.id);
              const servicosVeiculo = servicosPorVeiculo[veiculo.id] || [];

              return (
                <div key={veiculo.id} className="veiculo-card">
                  <div className="veiculo-card-topo">
                    <div>
                      <h4>
                        {veiculo.marca} {veiculo.modelo}
                      </h4>
                      <span className="veiculo-placa">{veiculo.placa}</span>
                    </div>
                  </div>

                  <div
                    className="veiculo-info"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "8px 14px",
                    }}
                  >
                    <p><strong>Marca:</strong> {veiculo.marca}</p>
                    <p><strong>Modelo:</strong> {veiculo.modelo}</p>
                    <p>
                      <strong>Ano:</strong>{" "}
                      {veiculo.ano ? veiculo.ano : "Não informado"}
                    </p>
                    <p><strong>Placa:</strong> {veiculo.placa}</p>
                    <p><strong>Vistoria:</strong> Em breve</p>
                    <p><strong>Serviços:</strong> {servicosVeiculo.length}</p>
                  </div>

                  <div
                    className="veiculo-acoes"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                      marginTop: 16,
                    }}
                  >
                    <button
                      type="button"
                      className="btn-acao-veiculo"
                      onClick={() => toggleVistoria(veiculo.id)}
                    >
                      {vistoriaAberta ? "Fechar vistoria" : "Vistoria"}
                    </button>

                    <button
                      type="button"
                      className="btn-acao-veiculo"
                      onClick={() => toggleServicos(veiculo.id)}
                    >
                      {servicosAbertos ? "Fechar serviços" : "Serviços"}
                    </button>

                    <button
                      type="button"
                      className="btn-acao-veiculo"
                      onClick={() => editarVeiculo(veiculo)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="btn-acao-veiculo btn-acao-veiculo-destaque"
                      onClick={() =>
                        navigate(`/servicos/${cliente.id}/${veiculo.id}/novo`)
                      }
                    >
                      Novo serviço
                    </button>

                    <button
                      type="button"
                      className="btn-acao-veiculo btn-acao-veiculo-excluir"
                      onClick={() => excluirVeiculo(veiculo.id)}
                    >
                      Excluir
                    </button>
                  </div>

                  {vistoriaAberta && (
                    <div className="bloco-interno-veiculo" style={{ marginTop: 18 }}>
                      <h4 className="bloco-interno-titulo">Fotos da vistoria</h4>
                      <p className="texto-suave">
                        A vistoria com fotos será ligada ao banco depois.
                      </p>
                    </div>
                  )}

                  {servicosAbertos && (
                    <div className="bloco-interno-veiculo" style={{ marginTop: 18 }}>
                      <h4 className="bloco-interno-titulo">Serviços cadastrados</h4>

                      {servicosVeiculo.length > 0 ? (
                        <div
                          className="servicos-lista-veiculo"
                          style={{
                            display: "grid",
                            gap: "10px",
                          }}
                        >
                          {servicosVeiculo.map((servico) => (
                            <div
                              key={servico.id}
                              className="servico-item-veiculo"
                              style={{
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "12px",
                                padding: "12px 14px",
                                background: "rgba(255,255,255,0.02)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  gap: "10px",
                                  marginBottom: "8px",
                                }}
                              >
                                <strong>{servico.descricao || "Serviço sem descrição"}</strong>
                                <span className="status-badge andamento">
                                  {textoStatusServico(servico)}
                                </span>
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gap: "4px",
                                  marginBottom: "10px",
                                }}
                              >
                                <span>
                                  <strong>Pagamento:</strong>{" "}
                                  {servico.status_pagamento || "Não informado"}
                                </span>
                                <span>
                                  <strong>Funileiro:</strong>{" "}
                                  {servico.funileiro_responsavel || "Não informado"}
                                </span>
                              </div>

                              <button
                                type="button"
                                className="btn-acao-veiculo btn-acao-veiculo-destaque"
                                onClick={() =>
                                  navigate(
                                    `/servicos/${cliente.id}/${veiculo.id}/${servico.id}`
                                  )
                                }
                              >
                                Abrir serviço
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="texto-suave">
                          Nenhum serviço cadastrado para este veículo.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClienteDetalhePage;