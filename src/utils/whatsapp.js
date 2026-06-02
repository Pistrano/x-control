/**
 * Utilitário de notificações via WhatsApp
 * Abre o WhatsApp Web/App com a mensagem pré-preenchida.
 * O funcionário só precisa clicar em "Enviar".
 */

const MENSAGENS = {
  servico: {
    "Aguardando":   (nome, veiculo, placa) => `Olá ${nome}! 👋 Seu veículo *${veiculo}* (placa *${placa}*) foi recebido e está aguardando início do serviço. Em breve te atualizamos! 🔧`,
    "Em andamento": (nome, veiculo, placa) => `Olá ${nome}! ✅ O serviço do seu *${veiculo}* (placa *${placa}*) já começou. Avisamos quando estiver pronto!`,
    "Finalizado":   (nome, veiculo, placa) => `Olá ${nome}! 🎉 O serviço do seu *${veiculo}* (placa *${placa}*) está *pronto*! Entre em contato para combinar a retirada.`,
    "Entregue":     (nome, veiculo, placa) => `Olá ${nome}! 🙏 Seu *${veiculo}* (placa *${placa}*) foi entregue. Obrigado pela preferência na X Motors!`,
  },
  lavagem: {
    "andamento":  (nome, veiculo, placa) => `Olá ${nome}! 🚿 Seu *${veiculo}* (placa *${placa}*) está sendo lavado agora. Logo fica pronto!`,
    "finalizado": (nome, veiculo, placa) => `Olá ${nome}! ✅ A lavagem do seu *${veiculo}* (placa *${placa}*) foi *concluída*! Pode vir buscar quando quiser.`,
    "entregue":   (nome, veiculo, placa) => `Olá ${nome}! 🙏 Lavagem concluída e veículo entregue. Obrigado pela preferência na X Motors!`,
  },
  orcamento: {
    "envio":    (nome, veiculo, placa, valor, descricao, validade) =>
      `Olá ${nome}! 📋 Segue o orçamento para o seu *${veiculo}* (placa *${placa}*):\n\n🔧 Serviço: ${descricao || "Serviço automotivo"}\n💰 Valor: *R$ ${Number(valor || 0).toFixed(2).replace(".", ",")}*\n⏳ Válido por ${validade || 7} dia(s)\n\nEntre em contato para confirmar ou tirar dúvidas. X Motors 🚗`,
    "aprovado": (nome, veiculo, placa) =>
      `Olá ${nome}! ✅ O orçamento do seu *${veiculo}* (placa *${placa}*) foi *aprovado*! Em breve entraremos em contato para agendar o serviço. 🔧`,
    "recusado": (nome, veiculo, placa) =>
      `Olá ${nome}! Entendemos que o orçamento do *${veiculo}* (placa *${placa}*) não foi aprovado desta vez. Qualquer dúvida, estamos à disposição. X Motors 🚗`,
    "pendente": (nome, veiculo, placa) =>
      `Olá ${nome}! 🕐 Seu orçamento para o *${veiculo}* (placa *${placa}*) ainda está disponível. Qualquer dúvida, é só chamar!`,
  },
};

function formatarTelefone(telefone) {
  const digits = String(telefone || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return "55" + digits;
}

export function notificarWhatsApp({ telefone, tipo, status, nomeCliente, veiculo, placa, valor, descricao, validade }) {
  const numero = formatarTelefone(telefone);
  if (!numero) return false;

  const gerarMensagem = MENSAGENS[tipo]?.[status];
  if (!gerarMensagem) return false;

  const texto = gerarMensagem(
    nomeCliente || "Cliente",
    veiculo || "veículo",
    placa || "—",
    valor,
    descricao,
    validade
  );

  const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");
  return true;
}

export function temWhatsApp(telefone) {
  return Boolean(String(telefone || "").replace(/\D/g, "").length >= 8);
}
