(function (global) {
  const EVENT_DATE = '8 de noviembre de 2025';
  const EVENT_LOCATION = 'Villa La Perla (Reserva La Calixtina, Calvillo)';
  const DEFAULT_EMOJI = '💍';

  const DEFAULT_WHATSAPP_TEMPLATE = [
    '{guestIntro}',
    '',
    '{confirmationLine}',
    '{seatsLine}',
    '',
    'Gracias por la invitación. {emoji}',
    '',
    '{urlLine}'
  ].join('\n');

  function sanitizeName(value) {
    if (!value || typeof value !== 'string') {
      return 'Invitad@';
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : 'Invitad@';
  }

  function normalizeRelation(value) {
    const relation = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return relation === 'familia' ? 'familia' : 'amigo';
  }

  function normalizeTreatment(value) {
    const treatment = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (treatment === 'grupal' || treatment === 'acompanado' || treatment === 'individual') {
      return treatment;
    }
    return 'individual';
  }

  function parseSeats(value) {
    const seatsNumber = Number(value);
    return Number.isFinite(seatsNumber) && seatsNumber > 0 ? seatsNumber : null;
  }

  function hasFamilyPrefix(name) {
    if (typeof name !== 'string') return false;
    return /^\s*familia\b/i.test(name);
  }

  function buildGreetingTemplate(name, relation, treatment) {
    const normalizedRelation = normalizeRelation(relation);
    const normalizedTreatment = normalizeTreatment(treatment);
    if (normalizedRelation === 'familia') {
      if (hasFamilyPrefix(name)) {
        return 'Querida {name}';
      }
      if (normalizedTreatment === 'grupal') {
        return 'Querida Familia {name}';
      }
      return 'Querida {name}';
    }
    return 'Hola {name}';
  }

  function getToneContext(relation, treatment) {
    const normalizedRelation = normalizeRelation(relation);
    const normalizedTreatment = normalizeTreatment(treatment);
    const isPlural =
      normalizedRelation === 'familia' ||
      normalizedTreatment === 'grupal' ||
      normalizedTreatment === 'acompanado';
    return {
      relation: normalizedRelation,
      treatment: normalizedTreatment,
      plural: isPlural,
      friendAccompanied: normalizedRelation === 'amigo' && normalizedTreatment === 'acompanado'
    };
  }

  function hasSeatsValue(seats) {
    return Number.isFinite(seats) && seats > 0;
  }

  function buildBodyTemplates(context, seats) {
    const templates = [];
    const { plural, relation, treatment } = context;
    const seatsAvailable = hasSeatsValue(seats);

    templates.push(
      plural
        ? 'Nos llena de alegría invitarles a la celebración civil de nuestra boda.'
        : 'Nos llena de alegría invitarte a la celebración civil de nuestra boda.'
    );

    if (treatment === 'grupal') {
      if (seatsAvailable) {
        if (seats === 1) {
          templates.push('Tienen {seats} lugar reservado para compartir este día en familia.');
        } else {
          templates.push('Tienen {seats} lugares reservados para compartir este día en familia.');
        }
      } else {
        templates.push('Queremos celebrar con toda la familia y disfrutar cada instante junto a ustedes.');
      }
    } else if (treatment === 'acompanado') {
      if (relation === 'amigo') {
        if (seatsAvailable) {
          if (seats === 1) {
            templates.push('Tu invitación es para 2 personas; tú y tu acompañante cuentan con {seats} lugar reservado.');
          } else {
            templates.push('Tu invitación es para 2 personas; tú y tu acompañante cuentan con {seats} lugares reservados.');
          }
        } else {
          templates.push('Tu invitación es para 2 personas; tú y tu acompañante están más que invitados.');
        }
      } else {
        if (seatsAvailable) {
          if (seats === 1) {
            templates.push('Su invitación es para 2 personas y tienen {seats} lugar reservado para disfrutar juntos.');
          } else {
            templates.push('Su invitación es para 2 personas y tienen {seats} lugares reservados para disfrutar juntos.');
          }
        } else {
          templates.push('Su invitación es para 2 personas para que compartan este día especial.');
        }
      }
    } else {
      if (plural) {
        if (seatsAvailable) {
          if (seats === 1) {
            templates.push('Su invitación es personal y contamos con {seats} lugar reservado para ustedes.');
          } else {
            templates.push('Su invitación es personal y contamos con {seats} lugares reservados únicamente para ustedes.');
          }
        } else {
          templates.push('Su invitación es personal para vivir este momento tan especial con nosotros.');
        }
      } else {
        if (seatsAvailable) {
          if (seats === 1) {
            templates.push('Tu invitación es personal y hemos reservado {seats} lugar especialmente para ti.');
          } else {
            templates.push('Tu invitación es personal y hemos reservado {seats} lugares especialmente para ti.');
          }
        } else {
          templates.push('Tu invitación es personal para que nos acompañes en este momento tan especial.');
        }
      }
    }

    templates.push('La cita es el {fecha} en {lugar}. {emoji}');
    return templates;
  }

  function replacePlaceholders(text, replacements) {
    if (!text) return '';
    return text.replace(/\{(\w+)\}/g, (_, key) => {
      if (Object.prototype.hasOwnProperty.call(replacements, key)) {
        return replacements[key];
      }
      return '';
    });
  }

  function collapseBlankLines(text) {
    return text
      .split('\n')
      .map(line => line.trim())
      .reduce((acc, line) => {
        if (!line) {
          if (acc.length && acc[acc.length - 1] !== '') {
            acc.push('');
          }
          return acc;
        }
        acc.push(line);
        return acc;
      }, [])
      .join('\n')
      .replace(/\n+$/g, '')
      .trim();
  }

  function formatNamesWithOr(names) {
    if (!Array.isArray(names)) return '';
    const filtered = names
      .map(name => (typeof name === 'string' ? name.trim() : ''))
      .filter(Boolean);
    if (!filtered.length) return '';
    if (filtered.length === 1) return filtered[0];
    if (filtered.length === 2) return `${filtered[0]} o ${filtered[1]}`;
    const head = filtered.slice(0, -1).join(', ');
    const tail = filtered[filtered.length - 1];
    return `${head} o ${tail}`;
  }

  function formatWhatsappDisplay(countryCode, localNumber) {
    if (!localNumber) return '';
    const match = localNumber.match(/(\d{3})(\d{3})(\d{4})/);
    if (!match) {
      return `+${countryCode} ${localNumber}`;
    }
    return `+${countryCode} ${match[1]} ${match[2]} ${match[3]}`;
  }

  function normalizeWhatsapp(raw) {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length < 10) return null;
    const localNumber = digits.slice(-10);
    const countryCode = '52';
    const wa = `${countryCode}${localNumber}`;
    const e164 = `+${countryCode}${localNumber}`;
    return {
      wa,
      e164,
      digits: wa,
      display: formatWhatsappDisplay(countryCode, localNumber)
    };
  }

  const GROOM_CONTACT = {
    name: 'Alfredo',
    role: 'Novio',
    label: 'Confirmar asistencia con Alfredo por WhatsApp',
    whatsapp: normalizeWhatsapp('4494336064')
  };

  const BRIDE_CONTACT = {
    name: 'Carmen',
    role: 'Novia',
    label: 'Confirmar asistencia con Carmen por WhatsApp',
    whatsapp: normalizeWhatsapp('4491952828')
  };

  const WHATSAPP_CONTACTS = [GROOM_CONTACT, BRIDE_CONTACT];

  function normalizeBaseUrl(value) {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    return trimmed.replace(/\/+$/g, '');
  }

  function buildInviteUrl(baseUrl, slug) {
    const safeSlug = typeof slug === 'string' ? slug.trim().replace(/^\/+/, '') : '';
    const normalizedBase = normalizeBaseUrl(baseUrl);
    if (!safeSlug) {
      return normalizedBase;
    }
    if (!normalizedBase) {
      return `/${safeSlug}`;
    }
    return `${normalizedBase}/${safeSlug}`;
  }

  function buildInviteMessage(invitee, options = {}) {
    const name = sanitizeName(invitee && invitee.displayName);
    const relation = normalizeRelation(invitee && invitee.relation);
    const treatment = normalizeTreatment(invitee && invitee.treatment);
    const seats = parseSeats(invitee && invitee.seats);
    const slug = typeof invitee?.slug === 'string' ? invitee.slug.trim() : '';
    const baseUrl = typeof options.baseUrl === 'string' ? options.baseUrl : '';
    const url = slug ? buildInviteUrl(baseUrl, slug) : '';

    const toneContext = getToneContext(relation, treatment);
    const isAnonymousInvitee = name === 'Invitad@';

    const replacements = {
      name,
      fecha: EVENT_DATE,
      lugar: EVENT_LOCATION,
      url,
      seats: seats ? String(seats) : '',
      emoji: DEFAULT_EMOJI,
      guestIntro: '',
      confirmationLine: '',
      seatsLine: '',
      urlLine: ''
    };

    const guestIntro = toneContext.plural
      ? isAnonymousInvitee
        ? 'Hola!'
        : `Hola, somos ${name}!`
      : isAnonymousInvitee
        ? 'Hola!'
        : `Hola, soy ${name}!`;

    const confirmationLine = toneContext.plural
      ? 'Confirmamos nuestra asistencia a la celebración civil de su boda.'
      : 'Confirmo mi asistencia a la celebración civil de su boda.';

    let seatsLine = '';
    if (hasSeatsValue(seats)) {
      if (toneContext.plural) {
        seatsLine =
          seats === 1
            ? 'Asistiremos en el lugar reservado para nosotros.'
            : `Asistiremos ${seats} personas conforme a los lugares reservados.`;
      } else {
        seatsLine =
          seats === 1
            ? 'Asistiré en el lugar reservado para mí.'
            : `Contamos con ${seats} lugares reservados y asistiremos conforme a la invitación.`;
      }
    }

    const urlLine = url ? `Mi invitación: ${url}` : '';

    replacements.guestIntro = guestIntro;
    replacements.confirmationLine = confirmationLine;
    replacements.seatsLine = seatsLine;
    replacements.urlLine = urlLine;

    const greetingTemplate = buildGreetingTemplate(name, relation, treatment);
    const bodyTemplates = buildBodyTemplates(toneContext, seats);

    const greeting = replacePlaceholders(greetingTemplate, replacements);
    const body = bodyTemplates
      .map(paragraph => replacePlaceholders(paragraph, replacements))
      .filter(Boolean);

    const heading = name === 'Invitad@' ? 'Invitación especial' : `Invitación para ${name}`;

    const whatsappTemplate =
      typeof options.whatsappTemplate === 'string' && options.whatsappTemplate.trim()
        ? options.whatsappTemplate
        : DEFAULT_WHATSAPP_TEMPLATE;
    const bodyText = body.join('\n\n');
    const whatsappReplacements = {
      ...replacements,
      greeting,
      body: bodyText
    };
    const whatsappMessage = collapseBlankLines(replacePlaceholders(whatsappTemplate, whatsappReplacements));
    const encodedWhatsappMessage = whatsappMessage ? encodeURIComponent(whatsappMessage) : '';

    const buildWhatsappLink = contact => {
      if (!contact || !contact.whatsapp || !contact.whatsapp.wa || !encodedWhatsappMessage) {
        return '';
      }
      return `https://wa.me/${contact.whatsapp.wa}?text=${encodedWhatsappMessage}`;
    };

    const groomWhatsappLink = buildWhatsappLink(GROOM_CONTACT);
    const brideWhatsappLink = buildWhatsappLink(BRIDE_CONTACT);

    const availableContacts = WHATSAPP_CONTACTS.filter(contact => contact.whatsapp && contact.whatsapp.wa);
    const contactSummaries = availableContacts
      .map(contact =>
        contact.whatsapp && contact.whatsapp.display ? `${contact.name}: ${contact.whatsapp.display}` : ''
      )
      .filter(Boolean);
    let helperText = 'Confírmanos por WhatsApp. 🥂';
    if (availableContacts.length) {
      const namesList = formatNamesWithOr(availableContacts.map(contact => contact.name));
      const details = contactSummaries.length ? ` ${contactSummaries.join(' · ')}` : '';
      helperText = `Confírmanos por WhatsApp con ${namesList}.${details} 🥂`.trim();
    }

    return {
      name,
      relation,
      treatment,
      seats,
      slug,
      url,
      greeting,
      body,
      heading,
      helperText,
      whatsappMessage,
      encodedWhatsappMessage,
      groomWhatsappLink,
      brideWhatsappLink,
      groomWhatsappLabel: GROOM_CONTACT.label,
      brideWhatsappLabel: BRIDE_CONTACT.label,
      groomWhatsappDisplay: GROOM_CONTACT.whatsapp ? GROOM_CONTACT.whatsapp.display : '',
      brideWhatsappDisplay: BRIDE_CONTACT.whatsapp ? BRIDE_CONTACT.whatsapp.display : '',
      groomContactName: GROOM_CONTACT.name,
      brideContactName: BRIDE_CONTACT.name
    };
  }

  global.InvitationMessaging = {
    EVENT_DATE,
    EVENT_LOCATION,
    DEFAULT_WHATSAPP_TEMPLATE,
    buildInviteMessage,
    buildInviteUrl,
    normalizeBaseUrl,
    normalizeRelation,
    normalizeTreatment,
    normalizeWhatsapp
  };
})(typeof window !== 'undefined' ? window : this);
