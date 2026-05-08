import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TEMPLATES = {
  English: {
    r1_subject: '[@Plant] Updated 3rd party GFSI Certificate Request',
    r1_body: `Hi [@Name],

Hope you are doing well. Would you have available the newest copy of the BRCGS / SQF certificate, animal welfare, HACCP letter and letter of guarantee for [@Plant], if applicable, please?

Thank you in advance.

Kind regards,

Gabriela Hidalgo
Food Safety & Quality Assurance Specialist
AJC Group LLC
Avenida Carlos Gomes 300, Sala 802
Bairro Auxiliadora, Porto Alegre, RS, Brazil
Headquarters: +1 404 252 6750
Mobile: +1 469 610 7425
www.ajcgroup.com`,
    r2_subject: '[@Plant] Updated 3rd party GFSI Certificate Request - Follow up',
    r2_body: `Hi [@Name],

How are you? Do you have any updates regarding the certificate for [@Plant]?

Kind regards,

Gabriela Hidalgo
Food Safety & Quality Assurance Specialist
AJC Group LLC
Avenida Carlos Gomes 300, Sala 802
Bairro Auxiliadora, Porto Alegre, RS, Brazil
Headquarters: +1 404 252 6750
Mobile: +1 469 610 7425
www.ajcgroup.com`,
  },
  Spanish: {
    r1_subject: '[@Plant] Solicitud de certificado GFSI de terceros',
    r1_body: `Hola [@Name],

Espero que se encuentre bien. Me gustaría solicitar sus copias más recientes del certificado APPCC (BRC, SQF o cualquier otra auditoría de terceros), carta de garantia y certificado de bienestar animal, por favor.

Gracias de antemano por su apoyo.

Gabriela Hidalgo
Food Safety & Quality Assurance Specialist
AJC Group LLC
Avenida Carlos Gomes 300, Sala 802
Bairro Auxiliadora, Porto Alegre, RS, Brazil
Headquarters: +1 404 252 6750
Mobile: +1 469 610 7425
www.ajcgroup.com`,
    r2_subject: '[@Plant] Solicitud de Certificado GFSI de terceros - Seguimiento',
    r2_body: `Hola [@Name],

¿Tiene alguna novedad sobre la solicitud de documentación para [@Plant]?

Saludos cordiales,

Gabriela Hidalgo
Food Safety & Quality Assurance Specialist
AJC Group LLC
Avenida Carlos Gomes 300, Sala 802
Bairro Auxiliadora, Porto Alegre, RS, Brazil
Headquarters: +1 404 252 6750
Mobile: +1 469 610 7425
www.ajcgroup.com`,
  },
  Portuguese: {
    r1_subject: '[@Plant] Solicitação de Certificado GFSI de terceiros',
    r1_body: `Olá [@Name],

Espero que estejas bem. Por gentileza, poderias me enviar as cópias mais recentes do certificado HACCP (BRC, SQF ou qualquer outra auditoria de terceiros), Carta de Garantia de Qualidade e Certificado de Bem estar Animal para [@Plant], por favor?

Lhe agradeço antecipadamente por seu apoio.

Gabriela Hidalgo
Food Safety & Quality Assurance Specialist
AJC Group LLC
Avenida Carlos Gomes 300, Sala 802
Bairro Auxiliadora, Porto Alegre, RS, Brazil
Headquarters: +1 404 252 6750
Mobile: +1 469 610 7425
www.ajcgroup.com`,
    r2_subject: '[@Plant] Solicitação de Certificado GFSI de terceiros - Acompanhamento',
    r2_body: `Olá [@Name],

Tudo bem? Tens alguma atualização a respeito dos certificados solicitados para [@Plant]?

Atenciosamente,

Gabriela Hidalgo
Food Safety & Quality Assurance Specialist
AJC Group LLC
Avenida Carlos Gomes 300, Sala 802
Bairro Auxiliadora, Porto Alegre, RS, Brazil
Headquarters: +1 404 252 6750
Mobile: +1 469 610 7425
www.ajcgroup.com`,
  },
  French: {
    r1_subject: "[@Plant] Demande de certificat GFSI d'une tierce partie",
    r1_body: `Bonjour [@Name],

Auriez-vous l'amabilité de nous transmettre la copie la plus récente du certificat BRCGS / SQF, du bien-être animal, de la lettre HACCP et de la lettre de garantie pour [@Plant], le cas échéant?

Merci d'avance.

Cordialement,

Gabriela Hidalgo
Food Safety & Quality Assurance Specialist
AJC Group LLC
Avenida Carlos Gomes 300, Sala 802
Bairro Auxiliadora, Porto Alegre, RS, Brazil
Headquarters: +1 404 252 6750
Mobile: +1 469 610 7425
www.ajcgroup.com`,
    r2_subject: "[@Plant] Demande de certificat GFSI d'une tierce partie - Suivi",
    r2_body: `Bonjour [@Name],

Comment allez-vous ? Avez-vous des nouvelles concernant la documentation de [@Plant] ?

Cordialement,

Gabriela Hidalgo
Food Safety & Quality Assurance Specialist
AJC Group LLC
Avenida Carlos Gomes 300, Sala 802
Bairro Auxiliadora, Porto Alegre, RS, Brazil
Headquarters: +1 404 252 6750
Mobile: +1 469 610 7425
www.ajcgroup.com`,
  },
};

function fillTemplate(text, name, plant) {
  return text
    .replace(/\[@Name\]/g, name || '')
    .replace(/\[@Plant\]/g, plant || '')
    .replace(/\[@Plant Est\. No\.\]/g, plant || '');
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admin users or scheduled/service calls
    const todayStr = new Date().toISOString().slice(0, 10);

    const certs = await base44.asServiceRole.entities.SupplierCertification.list();

    let sent = 0;
    const errors = [];

    for (const cert of certs) {
      if (!cert.expiration_date || !cert.contact_email) continue;
      if (cert.status === 'Updated') continue;

      const lang = cert.language || 'English';
      const tmpl = TEMPLATES[lang] || TEMPLATES['English'];
      const name = cert.contact_name || '';
      const plant = cert.plant_est_no || '';

      const r1Date = addDays(cert.expiration_date, -7);
      const r2Date = addDays(cert.expiration_date, 14);

      // Reminder 1
      if (todayStr === r1Date && !cert.reminder1_sent) {
        const subject = fillTemplate(tmpl.r1_subject, name, plant);
        const body = fillTemplate(tmpl.r1_body, name, plant);
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: cert.contact_email,
          subject,
          body,
        });
        await base44.asServiceRole.entities.SupplierCertification.update(cert.id, { reminder1_sent: true });
        sent++;
      }

      // Reminder 2
      if (todayStr === r2Date && !cert.reminder2_sent) {
        const subject = fillTemplate(tmpl.r2_subject, name, plant);
        const body = fillTemplate(tmpl.r2_body, name, plant);
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: cert.contact_email,
          subject,
          body,
        });
        await base44.asServiceRole.entities.SupplierCertification.update(cert.id, { reminder2_sent: true });
        sent++;
      }
    }

    return Response.json({ success: true, emails_sent: sent, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});