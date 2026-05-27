import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    telefone: "",
    cpfCnpj: "",
  });

  useEffect(() => {
    buscarClientes();
  }, []);

  async function buscarClientes() {
    setCarregando(true);

    const { data: clientesData, error: clientesError } = await supabase
      .from("clientes")
      .select("id, nome, telefone, cpf_cnpj")
      .order("nome", { ascending: true });

    if (clientesError) {
      console.error("Erro ao buscar clientes:", clientesError);
      setCarregando(false);
      return;
    }

    const { data: veiculosData, error: veiculosError } = await supabase
      .from("veiculos")
      .select("id, cliente_id");

    if (veiculosError) {
      console.error("Erro ao buscar veículos:", veiculosError);
    }

    const clientesComContagem = (clientesData || []).map((cliente) => {
      const quantidadeVeiculos = (veiculosData || []).filter(
        (veiculo) => String(veiculo.cliente_id) === String(cliente.id)
      ).length;

      return {
        ...cliente,
        veiculosCount: quantidadeVeiculos,
      };
    });

    setClientes(clientesComContagem);
    setCarregando(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setNovoCliente((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function salvarCliente(e) {
    e.preventDefault();

    if (!novoCliente.nome.trim()) {
      alert("Preencha o nome do cliente.");
      return;
    }

    const { error } = await supabase.from("clientes").insert([
      {
        nome: novoCliente.nome.trim(),
        telefone: novoCliente.telefone.trim(),
        cpf_cnpj: novoCliente.cpfCnpj.trim(),
      },
    ]);

    if (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar cliente.");
      return;
    }

    setNovoCliente({
      nome: "",
      telefone: "",
      cpfCnpj: "",
    });

    setMostrarNovoCliente(false);
    buscarClientes();
  }

  const termo = pesquisa.trim().toLowerCase();

  const clientesFiltrados = clientes.filter((cliente) => {
    if (!termo) return true;

    return (
      String(cliente.nome || "").toLowerCase().includes(termo) ||
      String(cliente.telefone || "").toLowerCase().includes(termo) ||
      String(cliente.cpf_cnpj || "").toLowerCase().includes(termo)
    );
  });

  return (
    <div className="container clientes-page">
      <div className="clientes-header">
        <div>
          <h1>Clientes</h1>
          <p className="subtitulo">
            Cadastre e selecione um cliente para abrir a ficha completa
          </p>
        </div>
      </div>

      <div className="clientes-topbar">
        <input
          type="text"
          placeholder="Pesquisar por nome, telefone ou CPF/CNPJ"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="clientes-pesquisa-input"
        />

        <button
          type="button"
          className="btn-principal"
          onClick={() => setMostrarNovoCliente((prev) => !prev)}
        >
          {mostrarNovoCliente ? "Fechar cadastro" : "+ Novo cliente"}
        </button>
      </div>

      {mostrarNovoCliente && (
        <form
          className="cliente-form-card"
          onSubmit={salvarCliente}
          style={{ marginTop: 20 }}
        >
          <h3 className="bloco-titulo">Novo cliente</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Nome *</label>
              <input
                name="nome"
                placeholder="Digite o nome do cliente"
                value={novoCliente.nome}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Número de telefone</label>
              <input
                name="telefone"
                placeholder="Digite o telefone"
                value={novoCliente.telefone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group form-group-full">
              <label>CPF/CNPJ</label>
              <input
                name="cpfCnpj"
                placeholder="Opcional"
                value={novoCliente.cpfCnpj}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-principal">
              Salvar cliente
            </button>
          </div>
        </form>
      )}

      <div className="clientes-lista-header" style={{ marginTop: 24 }}>
        <h2 className="clientes-secao-titulo">Clientes cadastrados</h2>
        <span className="clientes-quantidade">
          {clientesFiltrados.length}{" "}
          {clientesFiltrados.length === 1 ? "cliente" : "clientes"}
        </span>
      </div>

      {carregando ? (
        <div className="clientes-vazio">
          <h3>Carregando clientes...</h3>
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="clientes-vazio">
          <h3>Nenhum cliente encontrado</h3>
          <p>Cadastre um novo cliente para começar.</p>
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
          {clientesFiltrados.map((cliente) => (
            <Link
              key={cliente.id}
              to={`/clientes/${cliente.id}`}
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
                    {cliente.nome || "Cliente sem nome"}
                  </h3>

                  <span
                    style={{
                      fontSize: "11px",
                      color: "#bdbdbd",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cliente.veiculosCount || 0} veículo(s)
                  </span>
                </div>

                <p
                  style={{
                    margin: "0 0 6px 0",
                    fontSize: "13px",
                    color: "#cfcfcf",
                    lineHeight: 1.35,
                  }}
                >
                  {cliente.telefone?.trim()
                    ? cliente.telefone
                    : "Telefone não informado"}
                </p>

                <small
                  style={{
                    color: "#a9a9a9",
                    fontSize: "12px",
                  }}
                >
                  {cliente.cpf_cnpj?.trim()
                    ? cliente.cpf_cnpj
                    : "CPF/CNPJ não informado"}
                </small>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClientesPage;