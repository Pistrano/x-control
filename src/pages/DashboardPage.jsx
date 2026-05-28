import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

function DashboardPage() {
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [custos, setCustos] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState("");

  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    carregarDashboard();

    const canal = supabase
      .channel("dashboard-tempo-real")
      .on("postgres_changes", { event: "*", schema: "public", table: "clientes" }, carregarDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "veiculos" }, carregarDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "servicos" }, carregarDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "custos" }, carregarDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "estoque" }, carregarDashboard)
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  async function carregarDashboard() {
    const [clientesRes, veiculosRes, servicosRes, custosRes, estoqueRes] =
      await Promise.all([
        supabase.from("clientes").select("*"),
        supabase.from("veiculos").select("*"),
        supabase.from("servicos").select("*"),
        supabase.from("custos").select("*"),
        supabase.from("estoque").select("*"),
      ]);

    if (clientesRes.error) console.error("Erro clientes:", clientesRes.error); else setClientes(clientesRes.data || []);
    if (veiculosRes.error) console.error("Erro veiculos:", veiculosRes.error); else setVeiculos(veiculosRes.data || []);
    if (servicosRes.error) console.error("Erro servicos:", servicosRes.error); else setServicos(servicosRes.data || []);
    if (custosRes.error) console.error("Erro custos:", custosRes.error); else setCustos(custosRes.data || []);
    if (estoqueRes.error) console.error("Erro estoque:", estoqueRes.error); else setEstoque(estoqueRes.data || []);

    setUltimaAtualizacao(new Date().toLocaleTimeString("pt-BR"));
    setCarregando(false);
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data) {
    if (!data) return "Sem data";
    return String(data).slice(0, 10).split("-").reverse().join("/");
  }

  const resumo = useMemo(() => {
    const servicosMes = servicos.filter((servico) => {
      const data = servico.data_saida || servico.data_entrada || servico.created_at || "";
      return String(data).slice(0, 7) === mesAtual;
    });

    const custosMes = custos.filter((custo) => {
      const mes = custo.mes_referencia || String(custo.data || "").slice(0, 7);
      return mes === mesAtual;
    });

    const servicosAtivos = servicos.filter((servico) => {
      const status = String(servico.status || "").toLowerCase();
      return !status.includes("final") && servico.encerrado !== true;
    });

    const servicosFinalizados = servicos.filter((servico) => {
      const status = String(servico.status || "").toLowerCase();
      return status.includes("final") || servico.encerrado === true;
    });

    const faturamentoMes = servicosMes.reduce(
      (acc, servico) => acc + Number(servico.valor_total || 0),
      0
    );

    const lucroLiquidoMes = servicosMes.reduce(
      (acc, servico) => acc + Number(servico.valor_liquido || 0),
      0
    );

    const custosMesTotal = custosMes.reduce(
      (acc, custo) => acc + Number(custo.valor || 0),
      0
    );

    const valorEstoque = estoque.reduce(
      (acc, item) =>
        acc + Number(item.quantidade || 0) * Number(item.valor_unitario || 0),
      0
    );

    const estoqueBaixoLista = estoque.filter((item) => {
      const quantidade = Number(item.quantidade || 0);
      const minimo = Number(item.estoque_minimo || 0);
      return minimo > 0 && quantidade > 0 && quantidade <= minimo;
    });

    const semEstoqueLista = estoque.filter(
      (item) => Number(item.quantidade || 0) <= 0
    );
const funcionariosRanking = {};

servicosFinalizados.forEach((servico) => {
  const funcionario =
    servico.funileiro_responsavel?.trim();

  if (!funcionario) return;

  funcionariosRanking[funcionario] =
    (funcionariosRanking[funcionario] || 0) + 1;
});

const funcionarioDestaque =
  Object.entries(funcionariosRanking)
    .sort((a, b) => b[1] - a[1])[0];

const percentualCustos =
  faturamentoMes > 0
    ? (custosMesTotal / faturamentoMes) * 100
    : 0;

const insights = [];

if (estoqueBaixoLista.length > 0) {
  insights.push({
    titulo: "Estoque crítico",
    descricao: `${estoqueBaixoLista.length} itens precisam de atenção`,
    tipo: "alerta",
  });
}

if (percentualCustos > 55) {
  insights.push({
    titulo: "Custos elevados",
    descricao: `Custos consomem ${Math.round(percentualCustos)}% do faturamento`,
    tipo: "financeiro",
  });
}

if (funcionarioDestaque) {
  insights.push({
    titulo: "Funcionário destaque",
    descricao: `${funcionarioDestaque[0]} concluiu ${funcionarioDestaque[1]} serviços`,
    tipo: "destaque",
  });
}

if (lucroLiquidoMes > 0) {
  insights.push({
    titulo: "Lucro positivo",
    descricao: `${formatarMoeda(lucroLiquidoMes)} líquidos este mês`,
    tipo: "positivo",
  });
}

const hojeTexto =
  new Date().toISOString().slice(0, 10);

const amanha = new Date();
amanha.setDate(
  amanha.getDate() + 1
);

const amanhaTexto =
  amanha.toISOString().slice(0, 10);

const entregasHoje =
  servicos
    .filter((servico) => {
      return (
        servico.previsao_entrega ===
          hojeTexto &&
        servico.encerrado !== true
      );
    })
    .slice(0, 5);

const entregasAmanha =
  servicos.filter((servico) => {
    return (
      servico.previsao_entrega ===
        amanhaTexto &&
      servico.encerrado !== true
    );
  });

const atrasados =
  servicos
    .filter((servico) => {
      return (
        servico.previsao_entrega &&
        servico.previsao_entrega <
          hojeTexto &&
        servico.encerrado !== true
      );
    })
    .slice(0, 5);

const servicosUrgentes =
  servicos.filter(
    (servico) =>
      servico.prioridade ===
        "Urgente" &&
      servico.encerrado !== true
  );

    return {
  totalClientes: clientes.length,
  totalVeiculos: veiculos.length,
  servicosAtivos: servicosAtivos.length,
  servicosFinalizados:
    servicosFinalizados.length,

    entregasHoje,
entregasAmanha,
atrasados,

  faturamentoMes,
  custosMesTotal,

  lucroEstimado:
    lucroLiquidoMes - custosMesTotal,

  valorEstoque,

  estoqueBaixo:
    estoqueBaixoLista.length,

  semEstoque:
    semEstoqueLista.length,

  itensCriticos: [
    ...semEstoqueLista,
    ...estoqueBaixoLista
  ].slice(0, 5),

  servicosRecentes: [...servicos]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0) -
        new Date(a.created_at || 0)
    )
    .slice(0, 5),

  insights,
  funcionarioDestaque,
  servicosUrgentes,
};
  }, [clientes, veiculos, servicos, custos, estoque, mesAtual]);

  const maiorValorGrafico = Math.max(
    resumo.faturamentoMes,
    resumo.custosMesTotal,
    Math.abs(resumo.lucroEstimado),
    1
  );

  const cards = [
    { titulo: "Clientes", valor: resumo.totalClientes, texto: "clientes cadastrados", link: "/clientes" },
    { titulo: "Veículos", valor: resumo.totalVeiculos, texto: "veículos cadastrados", link: "/clientes" },
    { titulo: "Serviços ativos", valor: resumo.servicosAtivos, texto: "em andamento / aguardando", link: "/servicos" },
    { titulo: "Finalizados", valor: resumo.servicosFinalizados, texto: "serviços encerrados", link: "/servicos" },
    { titulo: "Faturamento", valor: formatarMoeda(resumo.faturamentoMes), texto: `mês ${mesAtual}`, link: "/servicos" },
    { titulo: "Custos", valor: formatarMoeda(resumo.custosMesTotal), texto: `mês ${mesAtual}`, link: "/custos" },
    { titulo: "Lucro estimado", valor: formatarMoeda(resumo.lucroEstimado), texto: "líquido - custos", link: "/relatorios" },
    { titulo: "Valor em estoque", valor: formatarMoeda(resumo.valorEstoque), texto: "inventário atual", link: "/estoque" },
  ];

  if (carregando) {
    return (
      <div className="container">
        <h1>Carregando dashboard...</h1>
      </div>
    );
  }

  return (
    <div className="container clientes-page">
      <div className="clientes-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitulo">Visão geral da X-Control em tempo real</p>
          <small style={{ color: "#aaa" }}>
            ● Atualização automática ativa — última atualização: {ultimaAtualizacao}
          </small>
        </div>
      </div>

      <div className="cliente-dados-grid" style={{ marginTop: 24 }}>
        {cards.map((card) => (
          <Link
            key={card.titulo}
            to={card.link}
            className="cliente-dado-box resumo-servico-card"
            style={{ textDecoration: "none" }}
          >
            <span className="cliente-dado-label">{card.titulo}</span>
            <strong>{card.valor}</strong>
            <small style={{ color: "#aaa", marginTop: 6 }}>{card.texto}</small>
          </Link>
        ))}
      </div>

      <div className="clientes-lista-header" style={{ marginTop: 34 }}>
        <h2 className="clientes-secao-titulo">Resumo financeiro do mês</h2>
      </div>

      <div className="cliente-dado-box resumo-servico-card" style={{ marginTop: 14 }}>
        {[
          ["Faturamento", resumo.faturamentoMes],
          ["Custos", resumo.custosMesTotal],
          ["Lucro estimado", resumo.lucroEstimado],
        ].map(([label, valor]) => (
          <div key={label} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <strong>{label}</strong>
              <span>{formatarMoeda(valor)}</span>
            </div>

            <div style={{ height: 12, background: "rgba(255,255,255,0.08)", borderRadius: 999 }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min((Math.abs(valor) / maiorValorGrafico) * 100, 100)}%`,
                  background: valor < 0 ? "#ff3333" : "#e50914",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        ))}
      </div>
{resumo.servicosUrgentes
  .length > 0 && (
  <div
    style={{
      background:
        "rgba(255,92,92,.08)",

      border:
        "1px solid rgba(255,92,92,.18)",

      borderRadius: 18,
      padding: "18px 22px",
      marginTop: 28,
      marginBottom: 16,
    }}
  >
    <strong
      style={{
        color: "#ff8a8a",
        fontSize: 16,
      }}
    >
      ⚠️ Serviços urgentes
    </strong>

    <p
      style={{
        marginTop: 8,
        color: "#c7ccd2",
      }}
    >
      Existem{" "}
      <strong>
        {
          resumo
            .servicosUrgentes
            .length
        }
      </strong>{" "}
      serviços urgentes
      aguardando atenção.
    </p>
  </div>
)}
      <section style={{ marginTop: 34 }}>
  <h2
    className="clientes-secao-titulo"
    style={{ marginBottom: 18 }}
  >
    Insights do sistema
  </h2>

  <div className="insights-grid">
    {resumo.insights.length === 0 ? (
      <div className="cliente-link-card">
        <h3>Tudo saudável</h3>
        <p>
          Nenhum insight importante
          encontrado.
        </p>
      </div>
    ) : (
      resumo.insights.map(
        (insight, index) => (
          <div
            key={index}
            className="cliente-link-card"
          >
            <div className="cliente-lista-item-topo">
              <h3>
                {insight.titulo}
              </h3>

              <span>
                {insight.tipo ===
                "destaque"
                  ? "🏆"
                  : insight.tipo ===
                    "financeiro"
                  ? "💸"
                  : insight.tipo ===
                    "positivo"
                  ? "📈"
                  : "⚠️"}
              </span>
            </div>

            <p>
              {insight.descricao}
            </p>
          </div>
        )
      )
    )}
  </div>
</section>

<section
  style={{
    marginTop: 34,
    width: "100%",
  }}
>
  <h2
    className="clientes-secao-titulo"
    style={{ marginBottom: 18 }}
  >
    Agenda inteligente
  </h2>

  <div className="insights-grid">
    <div className="cliente-link-card">
      <div
        className="cliente-lista-item-topo"
      >
        <h3>
          🚗 Entregas hoje
        </h3>

        <span>
          {
            resumo.entregasHoje
              .length
          }
        </span>
      </div>

      {resumo.entregasHoje
        .length === 0 ? (
        <p>
          Nenhuma entrega
          prevista hoje.
        </p>
      ) : (
        resumo.entregasHoje.map(
          (servico) => (
            <div
              key={servico.id}
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop:
                  "1px solid rgba(255,255,255,.06)",
              }}
            >
              <strong>
                {servico.descricao ||
                  "Serviço"}
              </strong>

              <p
                style={{
                  marginTop: 4,
                  color: "#9ba3af",
                  fontSize: 13,
                }}
              >
                Previsto:
                {" "}
                {formatarData(
                  servico.previsao_entrega
                )}
              </p>
            </div>
          )
        )
      )}
    </div>

    <div className="cliente-link-card">
      <div
        className="cliente-lista-item-topo"
      >
        <h3>
          ⚠️ Atrasados
        </h3>

        <span>
          {
            resumo.atrasados
              .length
          }
        </span>
      </div>

      {resumo.atrasados
        .length === 0 ? (
        <p>
          Nenhum serviço
          atrasado.
        </p>
      ) : (
        resumo.atrasados.map(
          (servico) => (
            <div
              key={servico.id}
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop:
                  "1px solid rgba(255,255,255,.06)",
              }}
            >
              <strong>
                {servico.descricao ||
                  "Serviço"}
              </strong>

              <p
                style={{
                  marginTop: 4,
                  color:
                    "#ff8787",
                  fontSize: 13,
                }}
              >
                Prazo:
                {" "}
                {formatarData(
                  servico.previsao_entrega
                )}
              </p>
            </div>
          )
        )
      )}
    </div>

    <div className="cliente-link-card">
      <h3>
        🕒 Amanhã
      </h3>

      <strong
        style={{
          fontSize: "2rem",
        }}
      >
        {
          resumo.entregasAmanha
            .length
        }
      </strong>

      <p>
        entregas previstas
        amanhã
      </p>
    </div>
  </div>
</section>

<div
  className="clientes-lista-header"
  style={{ marginTop: 34 }}
>
  <h2 className="clientes-secao-titulo">
    Alertas do estoque
  </h2>
</div>

      <div className="clientes-grid-horizontal" style={{ marginTop: 14 }}>
        {resumo.itensCriticos.length === 0 ? (
          <div className="cliente-link-card">
            <h3>Estoque saudável</h3>
            <p>Nenhum item crítico no momento.</p>
          </div>
        ) : (
          resumo.itensCriticos.map((item) => (
            <Link
              key={item.id}
              to={`/estoque/${item.id}`}
              className="cliente-link-card"
              style={{ textDecoration: "none" }}
            >
              <div className="cliente-lista-item-topo">
                <h3>{item.nome}</h3>
                <span>{Number(item.quantidade || 0) <= 0 ? "Sem estoque" : "Baixo"}</span>
              </div>
              <p>
                <strong>Qtd:</strong> {item.quantidade || 0} {item.unidade || ""}
              </p>
              <p>
                <strong>Mínimo:</strong> {item.estoque_minimo || 0} {item.unidade || ""}
              </p>
            </Link>
          ))
        )}
      </div>

      <div className="clientes-lista-header" style={{ marginTop: 34 }}>
        <h2 className="clientes-secao-titulo">Últimos serviços</h2>
      </div>

      <div className="clientes-grid-horizontal" style={{ marginTop: 14 }}>
        {resumo.servicosRecentes.length === 0 ? (
          <div className="cliente-link-card">
            <h3>Nenhum serviço ainda</h3>
            <p>Os serviços recentes aparecerão aqui.</p>
          </div>
        ) : (
          resumo.servicosRecentes.map((servico) => (
            <div key={servico.id} className="cliente-link-card">
              <div className="cliente-lista-item-topo">
                <h3>{servico.descricao || "Serviço sem descrição"}</h3>
                <span>{servico.status || "Sem status"}</span>
              </div>
              <p>
                <strong>Valor:</strong> {formatarMoeda(servico.valor_total)}
              </p>
              <p>
                <strong>Entrada:</strong> {formatarData(servico.data_entrada || servico.created_at)}
              </p>
              <p>
                <strong>Funileiro:</strong> {servico.funileiro_responsavel || "Não informado"}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="clientes-lista-header" style={{ marginTop: 34 }}>
        <h2 className="clientes-secao-titulo">Atalhos rápidos</h2>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
        <Link to="/clientes" className="btn-principal" style={{ textDecoration: "none" }}>Clientes</Link>
        <Link to="/servicos" className="btn-principal" style={{ textDecoration: "none" }}>Serviços</Link>
        <Link to="/custos" className="btn-principal" style={{ textDecoration: "none" }}>Custos</Link>
        <Link to="/estoque" className="btn-principal" style={{ textDecoration: "none" }}>Estoque</Link>
        <Link to="/relatorios" className="btn-secundario-ativo" style={{ textDecoration: "none" }}>Relatórios</Link>
      </div>
    </div>
  );
}

export default DashboardPage;