import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function EditarItemEstoquePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    categoria: "tintas",
    nome: "",
    codigo: "",
    marca: "",
    fornecedor: "",
    quantidade: "",
    unidade: "un",
    estoqueMinimo: "",
    valorUnitario: "",
    localizacao: "",
    observacoes: "",
    anexoNome: "",
    cor: "",
  });

  useEffect(() => {
    carregarItem();
  }, [id]);

  async function carregarItem() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("estoque")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("Erro ao carregar item: " + error.message);
      setCarregando(false);
      return;
    }

    setForm({
      categoria: data.categoria || "tintas",
      nome: data.nome || "",
      codigo: data.codigo || "",
      marca: data.marca || "",
      fornecedor: data.fornecedor || "",
      quantidade: data.quantidade ?? "",
      unidade: data.unidade || "un",
      estoqueMinimo: data.estoque_minimo ?? "",
      valorUnitario: data.valor_unitario ?? "",
      localizacao: data.localizacao || "",
      observacoes: data.observacoes || "",
      anexoNome: data.anexo_nome || "",
      cor: data.cor || "",
    });

    setCarregando(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleArquivo(e) {
    const file = e.target.files?.[0];

    setForm((prev) => ({
      ...prev,
      anexoNome: file ? file.name : prev.anexoNome,
    }));
  }

  async function salvarEdicao(e) {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Preencha o nome do item.");
      return;
    }

    setSalvando(true);

    const payload = {
      categoria: form.categoria,
      nome: form.nome.trim(),
      codigo: form.codigo.trim(),
      marca: form.marca.trim(),
      fornecedor: form.fornecedor.trim(),
      quantidade: Number(form.quantidade || 0),
      unidade: form.unidade,
      estoque_minimo: Number(form.estoqueMinimo || 0),
      valor_unitario: Number(form.valorUnitario || 0),
      localizacao: form.localizacao.trim(),
      observacoes: form.observacoes.trim(),
      anexo_nome: form.anexoNome,
      cor: form.cor.trim(),
    };

    const { error } = await supabase
      .from("estoque")
      .update(payload)
      .eq("id", id);

    if (error) {
      alert("Erro ao salvar edição: " + error.message);
      setSalvando(false);
      return;
    }

    setSalvando(false);
    navigate(`/estoque/${id}`);
  }

  if (carregando) {
    return (
      <div className="container">
        <h1>Carregando item...</h1>
      </div>
    );
  }

  return (
    <div className="container clientes-page">
      <div className="cliente-detalhe-header">
        <div>
          <h1>Editar item</h1>
          <p className="subtitulo">Atualize os dados do item do estoque</p>
        </div>

        <Link
          to={`/estoque/${id}`}
          className="btn-secundario-ativo"
          style={{ textDecoration: "none" }}
        >
          Voltar
        </Link>
      </div>

      <form
        className="cliente-form-card"
        onSubmit={salvarEdicao}
        style={{ marginTop: 24 }}
      >
        <div className="form-grid">
          <div className="form-group">
            <label>Categoria</label>
            <select name="categoria" value={form.categoria} onChange={handleChange}>
              <option value="tintas">Tintas</option>
              <option value="pecas">Peças</option>
              <option value="vernizes">Vernizes</option>
              <option value="lixas">Lixas</option>
              <option value="ferramentas">Ferramentas</option>
              <option value="consumiveis">Consumíveis</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          <div className="form-group">
            <label>Nome *</label>
            <input type="text" name="nome" value={form.nome} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Código</label>
            <input type="text" name="codigo" value={form.codigo} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Marca</label>
            <input type="text" name="marca" value={form.marca} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Fornecedor</label>
            <input type="text" name="fornecedor" value={form.fornecedor} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Quantidade</label>
            <input type="number" name="quantidade" value={form.quantidade} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Unidade</label>
            <select name="unidade" value={form.unidade} onChange={handleChange}>
              <option value="un">un</option>
              <option value="litros">litros</option>
              <option value="ml">ml</option>
              <option value="kg">kg</option>
              <option value="metros">metros</option>
              <option value="caixa">caixa</option>
            </select>
          </div>

          <div className="form-group">
            <label>Estoque mínimo</label>
            <input
              type="number"
              name="estoqueMinimo"
              value={form.estoqueMinimo}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Valor unitário</label>
            <input
              type="number"
              name="valorUnitario"
              value={form.valorUnitario}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Localização</label>
            <input
              type="text"
              name="localizacao"
              value={form.localizacao}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Cor</label>
            <input type="text" name="cor" value={form.cor} onChange={handleChange} />
          </div>

          <div className="form-group form-group-full">
            <label>Observações</label>
            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={handleChange}
              className="input-textarea"
            />
          </div>

          <div className="form-group form-group-full">
            <label>Anexo</label>
            <input type="file" onChange={handleArquivo} />
            {form.anexoNome && (
              <small style={{ display: "block", marginTop: 8 }}>
                Arquivo atual: {form.anexoNome}
              </small>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-principal" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar edição"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarItemEstoquePage;