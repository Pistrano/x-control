export function textoInclui(texto, termo) {
  return String(texto || "")
    .toLowerCase()
    .includes(String(termo || "").toLowerCase());
}

export function converterNumero(valor) {
  if (!valor) return 0;

  const numero = parseFloat(String(valor).replace(",", "."));
  return Number.isNaN(numero) ? 0 : numero;
}

export function calcularComissao(valorTotal, tipoComissao, comissaoDigitada) {
  const valorBase = converterNumero(valorTotal);
  const valorInformado = converterNumero(comissaoDigitada);

  if (tipoComissao === "percentual") {
    return (valorBase * valorInformado) / 100;
  }

  return valorInformado;
}

export function getInicioEFimSemanaAtual() {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const diferencaParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;

  const inicio = new Date(hoje);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(hoje.getDate() + diferencaParaSegunda);

  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 4);
  fim.setHours(23, 59, 59, 999);

  return { inicio, fim };
}

export function parseDataLocal(dataString) {
  if (!dataString) return null;

  const partes = String(dataString).split("-");
  if (partes.length !== 3) return null;

  const ano = Number(partes[0]);
  const mes = Number(partes[1]) - 1;
  const dia = Number(partes[2]);

  return new Date(ano, mes, dia, 12, 0, 0);
}

export function getDataPrincipalServico(servico) {
  return servico.dataEntrega || servico.dataSaida || "";
}

export function getCategoriaLabel(categoria) {
  const categorias = {
    alimentacao: "Alimentação",
    pecas: "Peças",
    despesas_ocasionais: "Despesas ocasionais",
    despesas_fixas: "Despesas fixas",
    manutencao: "Manutenção",
    funcionarios: "Funcionários",
    produto_geral: "Produto geral",
    peca_geral: "Peça geral",
    tinta: "Tinta",
    verniz: "Verniz",
    solvente: "Solvente",
    liquido: "Líquido",
    massa: "Massa",
    lixa: "Lixa",
    ferramenta: "Ferramenta",
    epi: "EPI",
    outros: "Outros",
  };

  return categorias[categoria] || categoria;
}