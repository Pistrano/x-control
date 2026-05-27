// (código completo, corrigido com sincronia correta)

import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function ServicoDetalhePage() {
  const { clienteId, veiculoId, servicoId } = useParams();
  const navigate = useNavigate();

  const isNovo = !servicoId || String(servicoId) === "novo";

  const [cliente, setCliente] = useState(null);
  const [veiculo, setVeiculo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    descricao: "",
    status: "Aguardando",
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

  useEffect(() => {
    carregarDados();
  }, [clienteId, veiculoId, servicoId]);

  async function carregarDados() {
    setCarregando(true);

    const { data: clienteData } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", clienteId)
      .single();

    const { data: veiculoData } = await supabase
      .from("veiculos")
      .select("*")
      .eq("id", veiculoId)
      .single();

    setCliente(clienteData);
    setVeiculo(veiculoData);

    if (!isNovo) {
      const { data } = await supabase
        .from("servicos")
        .select("*")
        .eq("id", servicoId)
        .single();

      setForm({
        ...form,
        descricao: data.descricao || "",
        status: data.status || "Aguardando",
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
    }

    setCarregando(false);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => {
      if (name === "status") {
        const ehFinal =
          value.toLowerCase().includes("final") ||
          value.toLowerCase().includes("entreg");

        return {
          ...prev,
          status: value,
          encerrado: ehFinal,
          dataSaida:
            ehFinal && !prev.dataSaida
              ? new Date().toISOString().slice(0, 10)
              : prev.dataSaida,
        };
      }

      // 🔥 IMPORTANTE: lavagem NÃO finaliza serviço sozinha
      if (name === "statusLavagem") {
        return {
          ...prev,
          statusLavagem: value,
        };
      }

      return {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
    });
  }

  async function salvarServico(e) {
    e.preventDefault();
    setSalvando(true);

    const servicoFinalizado =
      form.status.toLowerCase().includes("final") ||
      form.status.toLowerCase().includes("entreg");

    const lavagemFinalizada =
      !form.ehLavagem ||
      form.statusLavagem === "finalizado" ||
      form.statusLavagem === "entregue";

    // 🔥 REGRA PRINCIPAL
    const estaEncerrado = servicoFinalizado && lavagemFinalizada;

    const payload = {
      veiculo_id: veiculoId,
      descricao: form.descricao,
      status: estaEncerrado ? "Finalizado" : form.status,
      valor_total: Number(form.valorTotal || 0),
      valor_gasto: Number(form.valorGasto || 0),
      comissao: Number(form.comissao || 0),
      valor_liquido: Number(form.valorLiquido || 0),
      data_entrada: form.dataEntrada || null,
      data_saida: estaEncerrado
        ? form.dataSaida || new Date().toISOString().slice(0, 10)
        : null,
      observacoes: form.observacoes,
      encerrado: estaEncerrado,

      eh_lavagem: form.ehLavagem,
      valor_lavagem: Number(form.valorLavagem || 0),
      status_lavagem: form.statusLavagem,
      funcionario_lavagem: form.funcionarioLavagem,
    };

    if (isNovo) {
      await supabase.from("servicos").insert([payload]);
    } else {
      await supabase
        .from("servicos")
        .update(payload)
        .eq("id", servicoId);
    }

    setSalvando(false);
    navigate("/servicos");
  }

  if (carregando) return <h1>Carregando...</h1>;

  return (
    <div>
      <h1>Serviço</h1>

      <form onSubmit={salvarServico}>
        <input
          name="descricao"
          value={form.descricao}
          onChange={handleChange}
        />

        <select name="status" value={form.status} onChange={handleChange}>
          <option>Aguardando</option>
          <option>Em andamento</option>
          <option>Finalizado</option>
          <option>Entregue</option>
        </select>

        <label>
          <input
            type="checkbox"
            name="ehLavagem"
            checked={form.ehLavagem}
            onChange={handleChange}
          />
          Tem lavagem?
        </label>

        {form.ehLavagem && (
          <>
            <input
              name="valorLavagem"
              value={form.valorLavagem}
              onChange={handleChange}
            />

            <select
              name="statusLavagem"
              value={form.statusLavagem}
              onChange={handleChange}
            >
              <option value="andamento">Andamento</option>
              <option value="finalizado">Finalizado</option>
              <option value="entregue">Entregue</option>
            </select>
          </>
        )}

        <button type="submit" disabled={salvando}>
          Salvar
        </button>
      </form>
    </div>
  );
}

export default ServicoDetalhePage;