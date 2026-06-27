import { apiPost } from './api';

function normalizeRecipients(users = []) {
  return users
    .filter((u) => u?.email && String(u.email).trim())
    .map((u) => ({
      userId: u.id,
      name: `${u.nombre || ''} ${u.apellido || ''}`.trim(),
      email: String(u.email).trim(),
    }));
}

export default {
  async enviarMasivo({ subject, body, recipients }) {
    const payload = {
      subject: subject?.trim() || '',
      body: body?.trim() || '',
      recipients: normalizeRecipients(recipients),
    };

    const response = await apiPost('/correos/masivos', payload, true);

    if (!response) {
      throw new Error('No fue posible enviar los correos masivos.');
    }

    return response;
  },
};
