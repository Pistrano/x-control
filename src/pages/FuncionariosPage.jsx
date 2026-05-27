import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({ nome: "", funcao: "", telefone: "" });

  useEffect(() => { buscar(); }, []);

  async function buscar() {
    setCarregando(true);
    const { data, error } = await supabase.from("funcionarios").select("*").order("nome");
    if (!error) setFuncionarios(data || []);
    setCarregando(false);
  }

  function abrirNovo() {
    setEditandoId(null);
    setForm({ nome: "", funcao: "", telefone: "" });
    setMostrarForm(true);
  }

  function abrirEditar(f) {
    setEditandoId(f.id);
    setForm({ nome: f.nome || "", funcao: f.funcao || "", telefone: f.telefone || "" });
    setMostrarForm(true);
  }

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome.trim()) { alert("Informe o nome."); return; }

    if (editandoId) {
      const { error } = await supabase.from("funcionarios").update({ nome: form.nome.trim(), funcao: form.funcao.trim(), telefone: form.telefone.trim() }).eq("id", editandoId);
      if (error) { alert("Erro: " + error.message); return; }
    } else {
      const { error } = await supabase.from("funcionarios").insert([{ nome: form.nome.trim(), funcao: form.funcao.trim(), telefone: form.telefone.trim() }]);
      if (error) { alert("Erro: " + error.message); return; }
    }

    setMostrarForm(false);
    setEditandoId(null);
    buscar();
  }

  async function excluir(id) {
    if (!window.confirm("Excluir este funcionário?")) return;
    const { error } = await supabase.from("funcionarios").delete().eq("id", id);
    if (error) { alert("Erro: " + error.message); return; }
    buscar();
  }

  return (
    <div className="container clientes-page">
      <div className="clientes-header">
        <div>
          <h1>Funcionários</h1>
          <p className="subtitulo">Cadastro e controle financeiro da equipe</p>
        </div>
        <button type="button" className="btn-principal" onClick={abrirNovo}>
          + Novo funcionário
        </button>
      </div>

      {mostrarForm && (
        <form className="veiculo-form-card" onSubmit={salvar} style={{ marginTop: 24 }}>
          <h3 className="veiculo-form-titulo">{editandoId ? "Editar funcionário" : "Novo funcionário"}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nome *</label>
              <input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div className="form-group">
              <label>Função</label>
              <select value={form.funcao} onChange={(e) => setForm((p) => ({ ...p, funcao: e.target.value }))}>
                <option value="">Selecione</option>
                <option value="FUNILEIRO">Funileiro</option>
                <option value="LAVADOR">Lavador</option>
                <option value="MONTADOR">Montador</option>
                <option value="FINANCEIRA">Financeira</option>
                <option value="GERENTE">Gerente</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input value={form.telefone} onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))} placeholder="(65) 99999-0000" />
            </div>
          </div>
          <div className="form-actions form-actions-duplo">
            <button type="button" className="btn-secundario-ativo" onClick={() => setMostrarForm(false)}>Cancelar</button>
            <button type="submit" className="btn-principal">Salvar</button>
          </div>
        </form>
      )}

      <div style={{ marginTop: 28 }}>
        {carregando ? (
          <p style={{ color: "#aaa" }}>Carregando...</p>
        ) : funcionarios.length === 0 ? (
          <div className="clientes-vazio"><h3>Nenhum funcionário cadastrado</h3></div>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
            {funcionarios.map((f) => (
              <div key={f.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderLeft: "4px solid rgba(255,89,94,0.9)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <strong style={{ fontSize: 16, color: "#fff" }}>{f.nome}</strong>
                  <div style={{ fontSize: 13, color: "#bbb", marginTop: 4 }}>
                    {f.funcao || "Sem função"} {f.telefone ? `· ${f.telefone}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Link to={`/funcionarios/${f.id}`} className="btn-principal" style={{ textDecoration: "none", fontSize: 13 }}>
                    Entrar
                  </Link>
                  <button type="button" className="btn-secundario-ativo" style={{ fontSize: 13 }} onClick={() => abrirEditar(f)}>
                    Editar
                  </button>
                  <button type="button" className="btn-excluir" style={{ fontSize: 13 }} onClick={() => excluir(f.id)}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FuncionariosPage;
