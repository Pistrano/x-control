import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

function RelatorioFunileirosPage() {
  const [clientes] = useState(() => {
    try {
      const salvo = localStorage.getItem("clientes_funilaria");
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [funileiroFiltro, setFunileiroFiltro] = useState("");
  const [semanaFiltro, setSemanaFiltro] = useState("");
  const [pesquisa, setPesquisa] = useState("");

  const servicos = useMemo(() => {
    const lista = [];

    clientes.forEach((cliente) => {
      (cliente.veiculos || []).forEach((veiculo) => {
        (veiculo.servicos || []).forEach((servico) => {
          lista.push({
            ...servico,
            clienteNome: cliente.nome,
            veiculoNome: `${veiculo.marca || ""} ${veiculo.modelo || ""}`.trim(),
            placa: veiculo.placa || "",
          });
        });
      });
    });

    return lista;
  }, [clientes]);

  const funileiros = useMemo(() => {
    const nomes = servicos.map((s) => s.funileiroResponsavel).filter(Boolean);
    return [...new Set(nomes)].sort();
  }, [servicos]);

  const semanas = useMemo(() => {
    const lista = servicos.map((s) => s.semanaReferencia).filter(Boolean);
    return [...new Set(lista)].sort();
  }, [servicos]);

  const filtrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return servicos.filter((s) => {
      const bateFunileiro =
        !funileiroFiltro || s.funileiroResponsavel === funileiroFiltro;

      const bateSemana =
        !semanaFiltro || s.semanaReferencia === semanaFiltro;

      const batePesquisa =
        !termo ||
        String(s.descricao || "").toLowerCase().includes(termo) ||
        String(s.clienteNome || "").toLowerCase().includes(termo) ||
        String(s.veiculoNome || "").toLowerCase().includes(termo) ||
        String(s.funileiroResponsavel || "").toLowerCase().includes(termo) ||
        String(s.placa || "").toLowerCase().includes(termo);

      return bateFunileiro && bateSemana && batePesquisa;
    });
  }, [servicos, funileiroFiltro, semanaFiltro, pesquisa]);

  const resumo = useMemo(() => {
    return filtrados.reduce(
      (acc, servico) => {
        acc.quantidade += 1;
        acc.totalBruto += Number(servico.valorTotal || 0);
        acc.totalComissao += Number(servico.comissao || 0);
        acc.totalLiquido += Number(servico.valorLiquido || 0);

        if (
          servico.statusPagamentoFunileiro === "pendente" ||
          servico.statusPagamentoFunileiro === "parcial"
        ) {
          acc.pendente += Number(servico.valorLiquido || 0);
        }

        return acc;
      },
      {
        quantidade: 0,
        totalBruto: 0,
        totalComissao: 0,
        totalLiquido: 0,
        pendente: 0,
      }
    );
  }, [filtrados]);

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function baixarPDF() {
    window.print();
  }

  return (
    <div className="container clientes-page">
      <div className="cliente-detalhe-header">
        <div>
          <h1>Relatório Semanal / Funileiros</h1>
          <p className="subtitulo">Prestação de contas por semana e por funileiro</p>
        </div>

        <div className="cliente-detalhe-top-actions no-print">
          <button type="button" className="btn-principal" onClick={baixarPDF}>
            Baixar PDF
          </button>

          <Link
            to="/relatorios"
            className="btn-secundario-ativo"
            style={{ textDecoration: "none" }}
          >
            Voltar
          </Link>
        </div>
      </div>

      <div className="clientes-topbar no-print" style={{ marginTop: 22, flexWrap: "wrap" }}>
        <input
          type="text"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar cliente, veículo, placa, serviço ou funileiro..."
          className="clientes-pesquisa-input"
        />

        <select
          value={funileiroFiltro}
          onChange={(e) => setFunileiroFiltro(e.target.value)}
          className="clientes-pesquisa-input"
          style={{ maxWidth: 260 }}
        >
          <option value="">Todos os funileiros</option>
          {funileiros.map((nome) => (
            <option key={nome} value={nome}>
              {nome}
            </option>
          ))}
        </select>

        <select
          value={semanaFiltro}
          onChange={(e) => setSemanaFiltro(e.target.value)}
          className="clientes-pesquisa-input"
          style={{ maxWidth: 320 }}
        >
          <option value="">Todas as semanas</option>
          {semanas.map((semana) => (
            <option key={semana} value={semana}>
              {semana}
            </option>
          ))}
        </select>
      </div>

      <div className="cliente-dados-grid" style={{ marginTop: 22 }}>
        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Serviços</span>
          <strong>{resumo.quantidade}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Total bruto</span>
          <strong>{formatarMoeda(resumo.totalBruto)}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Comissão</span>
          <strong>{formatarMoeda(resumo.totalComissao)}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Líquido</span>
          <strong>{formatarMoeda(resumo.totalLiquido)}</strong>
        </div>

        <div className="cliente-dado-box resumo-servico-card">
          <span className="cliente-dado-label">Pendente</span>
          <strong>{formatarMoeda(resumo.pendente)}</strong>
        </div>
      </div>

      <div className="clientes-grid-horizontal" style={{ marginTop: 22 }}>
        {filtrados.map((servico) => (
          <div key={servico.id} className="cliente-link-card">
            <div className="cliente-lista-item-topo">
              <h3>{servico.descricao || "Serviço sem descrição"}</h3>
              <span>{servico.statusPagamentoFunileiro || "pendente"}</span>
            </div>

            <p><strong>Cliente:</strong> {servico.clienteNome}</p>
            <p><strong>Veículo:</strong> {servico.veiculoNome}</p>
            <p><strong>Placa:</strong> {servico.placa || "Não informada"}</p>
            <p><strong>Funileiro:</strong> {servico.funileiroResponsavel || "Não informado"}</p>
            <p><strong>Semana:</strong> {servico.semanaReferencia || "Não informada"}</p>
            <p><strong>Total:</strong> {formatarMoeda(servico.valorTotal)}</p>
            <p><strong>Comissão:</strong> {formatarMoeda(servico.comissao)}</p>
            <p><strong>Líquido:</strong> {formatarMoeda(servico.valorLiquido)}</p>
            <small>
              <strong>Obs:</strong> {servico.observacaoFunileiro || "Não informada"}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RelatorioFunileirosPage;