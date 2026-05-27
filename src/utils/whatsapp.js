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
};

function formatarTelefone(telefone) {
  const digits = String(telefone || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return "55" + digits;
}

export function notificarWhatsApp({ telefone, tipo, status, nomeCliente, veiculo, placa }) {
  const numero = formatarTelefone(telefone);
  if (!numero) return false;

  const gerarMensagem = MENSAGENS[tipo]?.[status];
  if (!gerarMensagem) return false;

  const texto = gerarMensagem(
    nomeCliente || "Cliente",
    veiculo || "veículo",
    placa || "—"
  );

  const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");
  return true;
}

export function temWhatsApp(telefone) {
  return Boolean(String(telefone || "").replace(/\D/g, "").length >= 8);
}
