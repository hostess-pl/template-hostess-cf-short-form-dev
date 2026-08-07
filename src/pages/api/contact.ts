export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { Resend } from 'resend';
import { RESEND_API_KEY, RESEND_FROM, RESEND_TO } from 'astro:env/server';
import siteConfig from '@/config/site.config';
import { trackLeadCaptured } from '@/lib/analyticsEvents';
import { detectDevice } from '@/lib/analyticsUtils';
import { checkAndConsumeApiQuota } from '@/lib/apiRateLimit';
import { getClientIp } from '@/lib/clientIp';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const MESSAGE_MIN_LENGTH = 10;

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().optional(),
  message: z
    .string()
    .trim()
    .min(MESSAGE_MIN_LENGTH, `Message must be at least ${MESSAGE_MIN_LENGTH} characters long.`),
  locale: z.enum(['en', 'pl', 'es']).default('en'),
  honeypot: z.string().optional(),
  consent_analytics: z.coerce.boolean().optional(),
  page_path: z.string().max(500).optional(),
  referrer: z.string().max(2000).optional().nullable(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  traffic_source: z.string().max(200).optional(),
  click_ids: z.string().max(80).optional(),
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const confirmationCopy = {
  en: {
    subject: 'Thank you for your message',
    title: 'Message received',
    body: 'Thank you for reaching out. I will review your inquiry and get back to you as soon as possible.',
  },
  pl: {
    subject: 'Dziękuję za wiadomość',
    title: 'Wiadomość otrzymana',
    body: 'Dziękuję za kontakt. Zapoznam się z zapytaniem i odezwę się tak szybko, jak to możliwe.',
  },
  es: {
    subject: 'Gracias por tu mensaje',
    title: 'Mensaje recibido',
    body: 'Gracias por contactar conmigo. Revisaré tu consulta y me pondré en contacto contigo lo antes posible.',
  },
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const clientIp = getClientIp(request);
    const quota = await checkAndConsumeApiQuota('contact', clientIp);
    if (!quota.allowed) {
      return new Response(
        JSON.stringify({ success: false, message: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(quota.retryAfterSec),
          },
        },
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, unknown> = {};

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = Object.fromEntries(formData);
    }

    const result = contactSchema.safeParse({
      name: body.name,
      email: body.email,
      phone: body.phone || '',
      message: body.message,
      locale: body.locale || 'en',
      honeypot: body.honeypot || '',
      consent_analytics: body.consent_analytics === true || body.consent_analytics === 'true',
      page_path: body.page_path || '',
      referrer: body.referrer ?? null,
      utm_source: body.utm_source || undefined,
      utm_medium: body.utm_medium || undefined,
      utm_campaign: body.utm_campaign || undefined,
      traffic_source: body.traffic_source || undefined,
      click_ids: body.click_ids || undefined,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const firstError =
        fieldErrors.message?.[0] ||
        fieldErrors.name?.[0] ||
        fieldErrors.email?.[0] ||
        'Please check the form and try again.';
      return new Response(
        JSON.stringify({
          success: false,
          message: firstError,
          errors: fieldErrors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (result.data.honeypot) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (!resend) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email service is not configured.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { name, email, phone, message, locale } = result.data;
    const toAddress = RESEND_TO || siteConfig.resend.managerEmail || siteConfig.email;
    const fromAddress = RESEND_FROM || siteConfig.resend.fromEmail;

    const leadHtml = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #FDFAF6; color: #2A2622;">
        <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #C4A46B;">New portfolio inquiry</p>
        <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 500;">${escapeHtml(name)}</h1>
        <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="margin: 0 0 8px;"><strong>Phone:</strong> ${escapeHtml(phone || '—')}</p>
        <p style="margin: 0 0 8px;"><strong>Language:</strong> ${escapeHtml(locale.toUpperCase())}</p>
        <hr style="border: none; border-top: 1px solid #E8DFD0; margin: 20px 0;" />
        <p style="margin: 0 0 8px;"><strong>Message:</strong></p>
        <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
      </div>`;

    const { error: leadError } = await resend.emails.send({
      from: fromAddress,
      to: [toAddress],
      replyTo: email,
      subject: `Portfolio inquiry from ${name}`,
      html: leadHtml,
    });

    if (leadError) {
      console.error('Resend lead error:', leadError);
      return new Response(
        JSON.stringify({ success: false, message: 'Could not send your message. Please try again.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const copy = confirmationCopy[locale];
    const confirmHtml = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #FDFAF6; color: #2A2622;">
        <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #C4A46B;">${escapeHtml(siteConfig.name)}</p>
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 500;">${escapeHtml(copy.title)}</h1>
        <p style="margin: 0; line-height: 1.6;">${escapeHtml(copy.body)}</p>
      </div>`;

    await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: copy.subject,
      html: confirmHtml,
    });

    if (result.data.email?.trim()) {
      const ua = request.headers.get('user-agent');
      const leadPromise = trackLeadCaptured({
        email: result.data.email.trim(),
        locale: result.data.locale,
        page_path: result.data.page_path?.trim() || '/',
        device_type: detectDevice(ua),
        referrer: result.data.referrer ?? null,
        utm_source: result.data.utm_source || undefined,
        utm_medium: result.data.utm_medium || undefined,
        utm_campaign: result.data.utm_campaign || undefined,
        traffic_source: result.data.traffic_source || undefined,
        click_ids: result.data.click_ids
          ? result.data.click_ids.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
      }).catch((e) => {
        console.error('[api/contact] lead analytics error:', e);
      });

      const cfContext = locals.cfContext;
      if (cfContext?.waitUntil) {
        cfContext.waitUntil(leadPromise);
      } else {
        void leadPromise;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Contact API error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
