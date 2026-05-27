import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

function FuncionarioDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [funcionario, setFuncionario] = useState(null);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoMovId, setEditandoMovId] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const hoje = new Date();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay() + 1);
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);

  const fmt = (d) => d.toISOString().slice(0, 10);

  const [filtro, setFiltro] = useState("semana");
  const [dataInicio, setDataInicio] = useState(fmt(inicioSemana));
  const [dataFim, setDataFim] = useState(fmt(fimSemana));

  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const [mesFiltro, setMesFiltro] = useState(mesAtual);

  const [form, setForm] = useState({
    data: fmt(hoje),
    pagamento: "",
    adiantamento: "",
    faltas: "0",
    valorFalta: "",
    observacao: "",
  });

  useEffect(() => { carregar(); }, [id]);

  async function carregar() {
    setCarregando(true);
    const { data: func } = await supabase.from("funcionarios").select("*").eq("id", id).single();
    const { data: movs } = await supabase.from("funcionarios_movimentacoes").select("*").eq("funcionario_id", id).order("data", { ascending: false });
    setFuncionario(func);
    setMovimentacoes(movs || []);
    setCarregando(false);
  }

  function abrirNovaMov() {
    setEditandoMovId(null);
    setForm({ data: fmt(hoje), pagamento: "", adiantamento: "", faltas: "0", valorFalta: "", observacao: "" });
    setMostrarForm(true);
  }

  function abrirEditarMov(mov) {
    setEditandoMovId(mov.id);
    setForm({
      data: mov.data || fmt(hoje),
      pagamento: mov.pagamento || "",
      adiantamento: mov.adiantamento || "",
      faltas: mov.faltas || "0",
      valorFalta: mov.valor_falta || "",
      observacao: mov.observacao || "",
    });
    setMostrarForm(true);
  }

  async function salvarMov(e) {
    e.preventDefault();
    setSalvando(true);

    const payload = {
      funcionario_id: id,
      data: form.data,
      pagamento: Number(form.pagamento || 0),
      adiantamento: Number(form.adiantamento || 0),
      faltas: Number(form.faltas || 0),
      valor_falta: Number(form.valorFalta || 0),
      observacao: form.observacao,
    };

    if (editandoMovId) {
      const { error } = await supabase.from("funcionarios_movimentacoes").update(payload).eq("id", editandoMovId);
      if (error) { alert("Erro: " + error.message); setSalvando(false); return; }
    } else {
      const { error } = await supabase.from("funcionarios_movimentacoes").insert([payload]);
      if (error) { alert("Erro: " + error.message); setSalvando(false); return; }
    }

    setSalvando(false);
    setMostrarForm(false);
    setEditandoMovId(null);
    carregar();
  }

  async function excluirMov(movId) {
    if (!window.confirm("Excluir esta movimentação?")) return;
    await supabase.from("funcionarios_movimentacoes").delete().eq("id", movId);
    carregar();
  }

  const movsFiltradas = useMemo(() => {
    return movimentacoes.filter((m) => {
      if (filtro === "todos") return true;
      if (filtro === "semana") return m.data >= dataInicio && m.data <= dataFim;
      if (filtro === "mes") return m.data?.slice(0, 7) === mesFiltro;
      return true;
    });
  }, [movimentacoes, filtro, dataInicio, dataFim, mesFiltro]);

  const resumo = useMemo(() => {
    const totalPago = movsFiltradas.reduce((a, m) => a + Number(m.pagamento || 0), 0);
    const totalAdiantamento = movsFiltradas.reduce((a, m) => a + Number(m.adiantamento || 0), 0);
    const totalFaltas = movsFiltradas.reduce((a, m) => a + Number(m.faltas || 0), 0);
    const totalDescontoFaltas = movsFiltradas.reduce((a, m) => a + (Number(m.faltas || 0) * Number(m.valor_falta || 0)), 0);
    const valorFinal = totalPago - totalAdiantamento - totalDescontoFaltas;
    return { totalPago, totalAdiantamento, totalFaltas, totalDescontoFaltas, valorFinal };
  }, [movsFiltradas]);

  function moeda(v) {
    return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  if (carregando) return <div className="container"><h1>Carregando...</h1></div>;
  if (!funcionario) return <div className="container"><h1>Funcionário não encontrado</h1></div>;

  return (
    <div className="container clientes-page">
      <div className="cliente-detalhe-header">
        <div>
          <h1>{funcionario.nome}</h1>
          <p className="subtitulo">{funcionario.funcao || "Sem função"}</p>
        </div>
        <div className="cliente-detalhe-top-actions">
          <button type="button" className="btn-principal" onClick={abrirNovaMov}>+ Nova movimentação</button>
          <Link to="/funcionarios" className="btn-secundario-ativo" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Voltar</Link>
        </div>
      </div>

      {/* Dados do funcionário */}
      <div className="cliente-dados-grid" style={{ marginTop: 24 }}>
        <div className="cliente-dado-box"><span className="cliente-dado-label">Nome</span><strong>{funcionario.nome}</strong></div>
        <div className="cliente-dado-box"><span className="cliente-dado-label">Função</span><strong>{funcionario.funcao || "—"}</strong></div>
        <div className="cliente-dado-box"><span className="cliente-dado-label">Telefone</span><strong>{funcionario.telefone || "—"}</strong></div>
      </div>

      {/* Formulário movimentação */}
      {mostrarForm && (
        <form className="veiculo-form-card" onSubmit={salvarMov} style={{ marginTop: 24 }}>
          <h3 className="veiculo-form-titulo">{editandoMovId ? "Editar movimentação" : "Nova movimentação"}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Data</label>
              <input type="date" value={form.data} onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Pagamento (R$)</label>
              <input type="number" value={form.pagamento} onChange={(e) => setForm((p) => ({ ...p, pagamento: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Adiantamento (R$)</label>
              <input type="number" value={form.adiantamento} onChange={(e) => setForm((p) => ({ ...p, adiantamento: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Faltas (dias)</label>
              <input type="number" value={form.faltas} onChange={(e) => setForm((p) => ({ ...p, faltas: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Valor por falta (R$)</label>
              <input type="number" value={form.valorFalta} onChange={(e) => setForm((p) => ({ ...p, valorFalta: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group form-group-full">
              <label>Observação</label>
              <input value={form.observacao} onChange={(e) => setForm((p) => ({ ...p, observacao: e.target.value }))} placeholder="Ex.: semana 25/05 a 29/05" />
            </div>
          </div>
          <div className="form-actions form-actions-duplo">
            <button type="button" className="btn-secundario-ativo" onClick={() => setMostrarForm(false)}>Cancelar</button>
            <button type="submit" className="btn-principal" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</button>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div style={{ marginTop: 32 }}>
        <h2 className="clientes-secao-titulo">Histórico financeiro</h2>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          {["todos", "semana", "mes"].map((f) => (
            <button key={f} type="button" className={filtro === f ? "btn-principal" : "btn-secundario-ativo"} onClick={() => setFiltro(f)}>
              {f === "todos" ? "Todos" : f === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>

        {filtro === "semana" && (
          <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
            <div className="form-group">
              <label style={{ color: "#d5d5d5", fontSize: 13, fontWeight: 600 }}>Início da semana</label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="clientes-pesquisa-input" style={{ marginTop: 6 }} />
            </div>
            <div className="form-group">
              <label style={{ color: "#d5d5d5", fontSize: 13, fontWeight: 600 }}>Fim da semana</label>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="clientes-pesquisa-input" style={{ marginTop: 6 }} />
            </div>
          </div>
        )}

        {filtro === "mes" && (
          <div style={{ marginTop: 14, maxWidth: 220 }}>
            <label style={{ color: "#d5d5d5", fontSize: 13, fontWeight: 600 }}>Mês</label>
            <input type="month" value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} className="clientes-pesquisa-input" style={{ marginTop: 6, display: "block" }} />
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="cliente-dados-grid" style={{ marginTop: 20 }}>
        <div className="cliente-dado-box resumo-servico-card"><span className="cliente-dado-label">Total pago</span><strong>{moeda(resumo.totalPago)}</strong></div>
        <div className="cliente-dado-box resumo-servico-card"><span className="cliente-dado-label">Adiantamentos</span><strong>{moeda(resumo.totalAdiantamento)}</strong></div>
        <div className="cliente-dado-box resumo-servico-card"><span className="cliente-dado-label">Total faltas</span><strong>{resumo.totalFaltas}</strong></div>
        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Valor final</span>
          <strong style={{ color: resumo.valorFinal < 0 ? "#ff595e" : "#4ade80" }}>{moeda(resumo.valorFinal)}</strong>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ marginTop: 24, overflowX: "auto" }}>
        {movsFiltradas.length === 0 ? (
          <div className="clientes-vazio"><h3>Nenhuma movimentação no período</h3></div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#aaa" }}>
                {["Data", "Pagamento", "Adiantamento", "Faltas", "Desconto faltas", "Valor final", "Observação", "Ações"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movsFiltradas.map((m) => {
                const descFalta = Number(m.faltas || 0) * Number(m.valor_falta || 0);
                const vFinal = Number(m.pagamento || 0) - Number(m.adiantamento || 0) - descFalta;
                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#e0e0e0" }}>
                    <td style={{ padding: "10px 14px" }}>{m.data ? new Date(m.data + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                    <td style={{ padding: "10px 14px" }}>{moeda(m.pagamento)}</td>
                    <td style={{ padding: "10px 14px" }}>{moeda(m.adiantamento)}</td>
                    <td style={{ padding: "10px 14px" }}>{m.faltas || 0}</td>
                    <td style={{ padding: "10px 14px" }}>{moeda(descFalta)}</td>
                    <td style={{ padding: "10px 14px", color: vFinal < 0 ? "#ff595e" : "#4ade80", fontWeight: 600 }}>{moeda(vFinal)}</td>
                    <td style={{ padding: "10px 14px", color: "#bbb" }}>{m.observacao || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" className="btn-secundario-ativo" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => abrirEditarMov(m)}>Editar</button>
                        <button type="button" className="btn-excluir" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => excluirMov(m.id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default FuncionarioDetalhePage;
