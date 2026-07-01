const axios = require('axios');

const ZAPI_BASE_URL = process.env.ZAPI_BASE_URL || 'https://api.z-api.io/instances';

/**
 * Sends a WhatsApp text message via Z-API.
 * Each Operation has its own instanceId and token (set on the Operation model).
 *
 * @param {Object} params
 * @param {string} params.instanceId - Z-API instance ID for this operation's WhatsApp number
 * @param {string} params.token - Z-API instance token
 * @param {string} params.phone - recipient phone number (with country code, digits only, e.g. 5511999999999)
 * @param {string} params.message - text message to send
 */
async function sendWhatsappMessage({ instanceId, token, phone, message }) {
  if (!instanceId || !token) {
    throw new Error('Operação não possui instância de WhatsApp configurada');
  }

  // Normalize phone: remove non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');

  const url = `${ZAPI_BASE_URL}/${instanceId}/token/${token}/send-text`;

  const response = await axios.post(url, {
    phone: cleanPhone,
    message,
  });

  return response.data;
}

module.exports = { sendWhatsappMessage };
