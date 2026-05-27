import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

function NovoCustoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const hoje = new Date();
  const dataAtual = `${hoje.getFullYear()}-${String(
    hoje.getMonth() + 1
  ).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

  const mesUrl = searchParams.get("mes");
  const competenciaInicial = mesUrl || dataAtual.slice(0, 7);

  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    categoria: "alimentacao",
    subtipo: "",
    centroCusto: "oficina",
    tipoNatureza: "variavel",
    competencia: competenciaInicial,
    dataPagamento: dataAtual,
    valor: "",
    fornecedor: "",
    formaPagamento: "",
    status: "pago",
    descricao: "",
    observacoes: "",
    anexoNome: "",
    funcionarioNome: "",
    funcionarioFuncao: "",
    funcionarioTipoPagamento: "salario",
    valorBruto: "",
    descontos: "",
  });

  const isFuncionario = form.categoria === "funcionarios";

  const subtipoOptions = useMemo(() => {
    const mapa = {
      alimentacao: [
        "Almoço equipe",
        "Lanche",
        "Café / copa",
        "Refeição externa",
        "Outro",
      ],
      pecas: [
        "Peça automotiva",
        "Material pintura",
        "Material funilaria",
        "Ferramenta",
        "Consumível oficina",
        "Outro",
      ],
      despesas_ocasionais: [
        "Emergencial",
        "Reparo inesperado",
        "Compra pontual",
        "Terceirizado",
        "Outro",
      ],
      despesas_fixas: [
        "Aluguel",
        "Energia",
        "Água",
        "Internet",
        "Software / Sistema",
        "Telefone",
        "Contabilidade",
        "Outro",
      ],
      manutencao: [
        "Equipamento oficina",
        "Infraestrutura",
        "Ferramentas",
        "Máquinas",
        "Veículos internos",
        "Outro",
      ],
    };

    return mapa[form.categoria] || [];
  }, [form.categoria]);

  const valorLiquidoFuncionario =
    Number(form.valorBruto || 0) - Number(form.descontos || 0);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "categoria" ? { subtipo: "" } : {}),
    }));
  }

  function handleArquivo(e) {
    const file = e.target.files?.[0];

    setForm((prev) => ({
      ...prev,
      anexoNome: file ? file.name : "",
    }));
  }

  async function salvarCusto(e) {
    e.preventDefault();

    setSalvando(true);

    const payload = {
      categoria: form.categoria,
      subtipo: isFuncionario ? form.funcionarioTipoPagamento : form.subtipo,
      centro_custo: form.centroCusto,
      tipo_natureza: isFuncionario ? "fixo" : form.tipoNatureza,
      competencia: form.competencia,
      mes_referencia: form.competencia,
      data: form.dataPagamento,
      valor: isFuncionario ? valorLiquidoFuncionario : Number(form.valor || 0),
      fornecedor: form.fornecedor,
      forma_pagamento: form.formaPagamento,
      quem_pagou: "",
      status: form.status,
      descricao: form.descricao,
      observacoes: form.observacoes,
      anexo_nome: form.anexoNome,
      funcionario_nome: form.funcionarioNome,
      funcionario_funcao: form.funcionarioFuncao,
      valor_bruto: Number(form.valorBruto || 0),
      descontos: Number(form.descontos || 0),
      valor_liquido: valorLiquidoFuncionario,
    };

    const { error } = await supabase.from("custos").insert([payload]);

    if (error) {
      console.error("Erro ao salvar custo:", error);
      alert("Erro ao salvar custo.");
      setSalvando(false);
      return;
    }

    setSalvando(false);
    navigate(`/custos?mes=${form.competencia}`);
  }

  return (
    <div className="container clientes-page">
      <div className="cliente-detalhe-header">
        <div>
          <h1>Novo custo</h1>
          <p className="subtitulo">
            Cadastro profissional de despesas e custos operacionais
          </p>
        </div>

        <Link
          to={`/custos?mes=${form.competencia}`}
          className="btn-secundario-ativo"
          style={{ textDecoration: "none" }}
        >
          Voltar
        </Link>
      </div>

      <form
        className="cliente-form-card"
        onSubmit={salvarCusto}
        style={{ marginTop: 24 }}
      >
        <div className="form-grid">
          <div className="form-group">
            <label>Categoria</label>
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
            >
              <option value="alimentacao">Alimentação</option>
              <option value="pecas">Peças</option>
              <option value="despesas_ocasionais">Despesas ocasionais</option>
              <option value="despesas_fixas">Despesas fixas</option>
              <option value="manutencao">Manutenção</option>
              <option value="funcionarios">Funcionários</option>
            </select>
          </div>

          <div className="form-group">
            <label>Centro de custo</label>
            <select
              name="centroCusto"
              value={form.centroCusto}
              onChange={handleChange}
            >
              <option value="oficina">Oficina</option>
              <option value="administrativo">Administrativo</option>
              <option value="producao">Produção</option>
              <option value="estoque">Estoque</option>
              <option value="comercial">Comercial / Atendimento</option>
              <option value="financeiro">Financeiro</option>
              <option value="geral">Geral</option>
            </select>
          </div>

          <div className="form-group">
            <label>Competência</label>
            <input
              type="month"
              name="competencia"
              value={form.competencia}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Data pagamento</label>
            <input
              type="date"
              name="dataPagamento"
              value={form.dataPagamento}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="parcial">Parcial</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {!isFuncionario && (
            <>
              <div className="form-group">
                <label>Fixo / Variável</label>
                <select
                  name="tipoNatureza"
                  value={form.tipoNatureza}
                  onChange={handleChange}
                >
                  <option value="fixo">Fixo</option>
                  <option value="variavel">Variável</option>
                </select>
              </div>

              <div className="form-group">
                <label>Subtipo</label>
                <select
                  name="subtipo"
                  value={form.subtipo}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>
                  {subtipoOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Valor</label>
                <input
                  type="number"
                  name="valor"
                  value={form.valor}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label>Fornecedor / local</label>
                <input
                  type="text"
                  name="fornecedor"
                  value={form.fornecedor}
                  onChange={handleChange}
                  placeholder="Fornecedor ou local"
                />
              </div>
            </>
          )}

          {isFuncionario && (
            <>
              <div className="form-group">
                <label>Funcionário</label>
                <input
                  type="text"
                  name="funcionarioNome"
                  value={form.funcionarioNome}
                  onChange={handleChange}
                  placeholder="Nome do funcionário"
                />
              </div>

              <div className="form-group">
                <label>Função</label>
                <input
                  type="text"
                  name="funcionarioFuncao"
                  value={form.funcionarioFuncao}
                  onChange={handleChange}
                  placeholder="Função / cargo"
                />
              </div>

              <div className="form-group">
                <label>Tipo pagamento</label>
                <select
                  name="funcionarioTipoPagamento"
                  value={form.funcionarioTipoPagamento}
                  onChange={handleChange}
                >
                  <option value="salario">Salário</option>
                  <option value="comissao">Comissão</option>
                  <option value="adiantamento">Adiantamento</option>
                  <option value="diaria">Diária</option>
                  <option value="hora_extra">Hora extra</option>
                  <option value="bonus">Bônus</option>
                  <option value="vale">Vale / Benefício</option>
                  <option value="ferias">Férias</option>
                  <option value="rescisao">Rescisão</option>
                </select>
              </div>

              <div className="form-group">
                <label>Valor bruto</label>
                <input
                  type="number"
                  name="valorBruto"
                  value={form.valorBruto}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label>Descontos</label>
                <input
                  type="number"
                  name="descontos"
                  value={form.descontos}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label>Valor líquido</label>
                <input type="number" value={valorLiquidoFuncionario} disabled />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Forma pagamento</label>
            <input
              type="text"
              name="formaPagamento"
              value={form.formaPagamento}
              onChange={handleChange}
              placeholder="Pix, transferência, dinheiro..."
            />
          </div>

          <div className="form-group form-group-full">
            <label>Descrição</label>
            <input
              type="text"
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              placeholder="Descrição do custo"
            />
          </div>

          <div className="form-group form-group-full">
            <label>Observações</label>
            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={handleChange}
              className="input-textarea"
              placeholder="Observações internas"
            />
          </div>

          <div className="form-group form-group-full">
            <label>Nota fiscal / comprovante</label>
            <input type="file" onChange={handleArquivo} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-principal" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar custo"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NovoCustoPage;