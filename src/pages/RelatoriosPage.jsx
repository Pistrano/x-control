import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

function RelatoriosPage() {
  const [clientes] = useState(() => {
    try {
      const salvo = localStorage.getItem("clientes_funilaria");
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [custos] = useState(() => {
    try {
      const salvo = localStorage.getItem("custos_funilaria");
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [estoque] = useState(() => {
    try {
      const salvo = localStorage.getItem("estoque_funilaria");
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  const servicos = useMemo(() => {
    const lista = [];

    clientes.forEach((cliente) => {
      (cliente.veiculos || []).forEach((veiculo) => {
        (veiculo.servicos || []).forEach((servico) => {
          lista.push({
            ...servico,
            clienteNome: cliente.nome,
            veiculoNome: `${veiculo.marca || ""} ${veiculo.modelo || ""}`.trim(),
          });
        });
      });
    });

    return lista;
  }, [clientes]);

  const resumoHome = useMemo(() => {
    const servicosMes = servicos.filter((s) =>
      String(s.dataEntrada || "").startsWith(mesAtual)
    );

    const custosMes = custos.filter(
      (custo) => String(custo.mesReferencia || "") === mesAtual
    );

    const valorEstoque = estoque.reduce(
      (acc, item) =>
        acc + Number(item.quantidade || 0) * Number(item.valorUnitario || 0),
      0
    );

    const estoqueBaixo = estoque.filter((item) => {
      const q = Number(item.quantidade || 0);
      const min = Number(item.estoqueMinimo || 0);
      return q > 0 && q <= min;
    }).length;

    return {
      funileiros: servicos.filter((s) => s.funileiroResponsavel).length,
      financeiro: custosMes.reduce((acc, item) => acc + Number(item.valor || 0), 0),
      estoqueValor: valorEstoque,
      estoqueBaixo,
      servicosSemana: servicosMes.length,
    };
  }, [servicos, custos, estoque, mesAtual]);

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <div className="container clientes-page">
      <div className="clientes-header">
        <div>
          <h1>Relatórios</h1>
          <p className="subtitulo">Central de relatórios do sistema</p>
        </div>
      </div>

      <div className="clientes-grid-horizontal" style={{ marginTop: 18 }}>
        <Link
          to="/relatorios/funileiros"
          className="cliente-link-card"
          style={{ textDecoration: "none" }}
        >
          <div className="cliente-lista-item-topo">
            <h3>Semanal / Funileiros</h3>
            <span>Abrir</span>
          </div>
          <p>Prestação de contas por funileiro e por semana.</p>
          <small>
            <strong>Registros com funileiro:</strong> {resumoHome.funileiros}
          </small>
        </Link>

        <Link
          to="/relatorios/financeiro"
          className="cliente-link-card"
          style={{ textDecoration: "none" }}
        >
          <div className="cliente-lista-item-topo">
            <h3>Financeiro</h3>
            <span>Abrir</span>
          </div>
          <p>Custos mensais, fixos, variáveis e pendências.</p>
          <small>
            <strong>Total do mês:</strong> {formatarMoeda(resumoHome.financeiro)}
          </small>
        </Link>

        <Link
          to="/relatorios/estoque"
          className="cliente-link-card"
          style={{ textDecoration: "none" }}
        >
          <div className="cliente-lista-item-topo">
            <h3>Estoque</h3>
            <span>Abrir</span>
          </div>
          <p>Resumo do inventário e situação dos itens.</p>
          <small>
            <strong>Valor em estoque:</strong> {formatarMoeda(resumoHome.estoqueValor)}
          </small>
        </Link>

        <Link
          to="/relatorios/servicos"
          className="cliente-link-card"
          style={{ textDecoration: "none" }}
        >
          <div className="cliente-lista-item-topo">
            <h3>Semanal de Serviços</h3>
            <span>Abrir</span>
          </div>
          <p>Serviços separados por semana para conferência.</p>
          <small>
            <strong>Serviços do período:</strong> {resumoHome.servicosSemana}
          </small>
        </Link>
      </div>
    </div>
  );
}

export default RelatoriosPage;