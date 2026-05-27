import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../lib/supabase";

function NovoItemEstoquePage() {
  const navigate = useNavigate();
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

  const isPeca = form.categoria === "pecas";
  const isTinta = form.categoria === "tintas";

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
      anexoNome: file ? file.name : "",
    }));
  }

  async function salvarItem(e) {
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

    const { error } = await supabase.from("estoque").insert([payload]);

    if (error) {
      console.error("Erro ao salvar item:", error);
      alert("Erro ao salvar item: " + error.message);
      setSalvando(false);
      return;
    }

    setSalvando(false);
    navigate(`/estoque?categoria=${form.categoria}`);
  }

  return (
    <div className="container clientes-page">
      <div className="cliente-detalhe-header">
        <div>
          <h1>Novo item do estoque</h1>
          <p className="subtitulo">
            Cadastro de materiais, tintas, peças e insumos da oficina
          </p>
        </div>

        <Link
          to="/estoque"
          className="btn-secundario-ativo"
          style={{ textDecoration: "none" }}
        >
          Voltar
        </Link>
      </div>

      <form
        className="cliente-form-card"
        onSubmit={salvarItem}
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
            <label>Nome do item *</label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              placeholder={isPeca ? "Ex.: Para-choque dianteiro" : "Ex.: Tinta azul"}
            />
          </div>

          {isTinta && (
            <div className="form-group">
              <label>Cor</label>
              <input
                type="text"
                name="cor"
                value={form.cor}
                onChange={handleChange}
                placeholder="Ex.: Azul"
              />
            </div>
          )}

          <div className="form-group">
            <label>Código</label>
            <input
              type="text"
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </div>

          <div className="form-group">
            <label>Marca</label>
            <input
              type="text"
              name="marca"
              value={form.marca}
              onChange={handleChange}
              placeholder="Marca do item"
            />
          </div>

          <div className="form-group">
            <label>Fornecedor</label>
            <input
              type="text"
              name="fornecedor"
              value={form.fornecedor}
              onChange={handleChange}
              placeholder="Fornecedor ou loja"
            />
          </div>

          <div className="form-group">
            <label>Quantidade</label>
            <input
              type="number"
              name="quantidade"
              value={form.quantidade}
              onChange={handleChange}
              placeholder="0"
            />
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
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>{isPeca ? "Valor de compra da peça" : "Valor unitário"}</label>
            <input
              type="number"
              name="valorUnitario"
              value={form.valorUnitario}
              onChange={handleChange}
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Localização</label>
            <input
              type="text"
              name="localizacao"
              value={form.localizacao}
              onChange={handleChange}
              placeholder="Ex.: prateleira A / estoque principal"
            />
          </div>

          <div className="form-group form-group-full">
            <label>Observações</label>
            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={handleChange}
              className="input-textarea"
              placeholder="Observações do item"
            />
          </div>

          <div className="form-group form-group-full">
            <label>Anexo / nota / imagem</label>
            <input type="file" onChange={handleArquivo} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-principal" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar item"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NovoItemEstoquePage;