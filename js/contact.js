// Contact form: enquiry type switch, validation, sending
(() => {
  const form = document.getElementById('enquiry');
  if (!form) return;
  const status = document.getElementById('status');
  const groups = [...form.querySelectorAll('fieldset[data-for]')];

  // Show the fieldset that matches the enquiry type
  const setType = type => {
    groups.forEach(g => { g.hidden = g.dataset.for !== type; });
  };
  form.querySelectorAll('input[name="type"]').forEach(r =>
    r.addEventListener('change', () => setType(r.value)));

  // Preselect from the link that brought the visitor here: contact.html?type=tender
  const wanted = new URLSearchParams(location.search).get('type');
  const radio = wanted && form.querySelector(`input[name="type"][value="${CSS.escape(wanted)}"]`);
  if (radio) radio.checked = true;
  setType(form.querySelector('input[name="type"]:checked').value);

  // Validation: mark a field after the visitor leaves it, and on submit
  const check = el => {
    const group = el.closest('.field-group');
    if (!group) return true;
    const ok = el.checkValidity();
    group.classList.toggle('invalid', !ok);
    el.setAttribute('aria-invalid', String(!ok));
    return ok;
  };
  form.querySelectorAll('.input, .select, .textarea').forEach(el => {
    el.addEventListener('blur', () => { if (el.value) check(el); });
    el.addEventListener('input', () => {
      if (el.closest('.field-group').classList.contains('invalid')) check(el);
    });
  });

  // Messages in the page language (English or Italian)
  const IT = document.documentElement.lang === 'it';
  const T = IT ? {
    robot: 'Spuntate la casella per confermare che non siete un robot, poi inviate di nuovo.',
    check: n => `Controllate ${n === 1 ? 'il campo evidenziato' : 'i ' + n + ' campi evidenziati'} e inviate di nuovo.`,
    offline: 'Il modulo non è ancora collegato, quindi non è stato inviato nulla. Scrivete a sales@edesshirts.com o chiamate il +355 69 791 4369.',
    sending: 'Invio della richiesta in corso…',
    sent: 'Richiesta inviata. Vi risponderemo via email.',
    failed: 'La richiesta non è stata inviata per un problema di connessione. Riprovate o scrivete a sales@edesshirts.com.'
  } : {
    robot: 'Tick the box to confirm you are not a robot, then send again.',
    check: n => `Check the ${n === 1 ? 'highlighted field' : n + ' highlighted fields'} and send again.`,
    offline: 'This form is not connected yet, so nothing was sent. Email sales@edesshirts.com or call +355 69 791 4369.',
    sending: 'Sending your enquiry…',
    sent: 'Enquiry sent. We will reply by email.',
    failed: 'Your enquiry was not sent because of a connection problem. Try again, or email sales@edesshirts.com.'
  };

  const show = (msg, kind) => {
    status.textContent = msg;
    status.className = 'form-status ' + kind;
    status.hidden = false;
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fields = [...form.querySelectorAll('.input, .select, .textarea')]
      .filter(el => !el.closest('fieldset[hidden]'));
    const bad = fields.filter(el => !check(el));
    // hCaptcha: the widget writes its token into a hidden textarea once solved
    const captcha = form.querySelector('.captcha-group');
    const token = form.querySelector('textarea[name="h-captcha-response"]');
    const captchaOk = !captcha || (token && token.value);
    if (captcha) captcha.classList.toggle('invalid', !captchaOk);
    if (!captchaOk && !bad.length) {
      show(T.robot, 'err');
      return;
    }
    if (bad.length) {
      bad[0].focus();
      show(T.check(bad.length), 'err');
      return;
    }

    const endpoint = form.dataset.endpoint;
    const key = form.querySelector('[name="access_key"]');
    if (!endpoint || (key && !key.value)) {
      show(T.offline, 'err');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    show(T.sending, '');
    try {
      const data = new FormData(form);
      // Drop the fields of the enquiry type that was not chosen
      form.querySelectorAll('fieldset[hidden] [name]').forEach(el => data.delete(el.name));
      // Readable subject line in the inbox, e.g. "Uniform tender: Ministry of Defence"
      const type = data.get('type');
      const label = { production: 'Production enquiry', tender: 'Uniform tender', other: 'Enquiry' }[type] || 'Enquiry';
      data.set('subject', `${label}${IT ? ' (IT)' : ''}: ${data.get('company') || data.get('name')}`);
      const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.message || res.status);
      form.reset();
      if (window.hcaptcha) window.hcaptcha.reset();
      setType('production');
      show(T.sent, 'ok');
    } catch {
      show(T.failed, 'err');
    } finally {
      btn.disabled = false;
    }
  });
})();
