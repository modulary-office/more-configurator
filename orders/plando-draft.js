/* Run inside a logged-in plando.co.il tab (browser pane). Creates a DRAFT work order
   (not published, no number, nothing is sent) on the supplier card, with an image per line.
   await createPlandoDraft({ contactId, docType, subject, lines:[{d,q,p,imgUrl}] }) -> draft invoice id
   Publishing ("הפק הזמנת עבודה") stays a manual click by Marhiv. */
async function createPlandoDraft(o) {
  const tok = document.querySelector('meta[name=csrf-token]').content;
  const r = await fetch(`/invoices/new_invoice/${o.contactId}?type=${o.docType || 100}`);   // opening this page creates the draft
  const id = (r.url.match(/invoices\/invoice\/(\d+)/) || [])[1];
  if (!id) throw new Error('draft was not created: ' + r.url);
  const hdr = { 'X-CSRF-Token': tok, 'X-Requested-With': 'XMLHttpRequest', Accept: 'text/javascript' };
  for (const l of o.lines) {
    const fd = new FormData();
    fd.append('authenticity_token', tok); fd.append('invoice_line[description]', l.d); fd.append('invoice_line[catalog_item_id]', '');
    fd.append('invoice_line[quantity]', l.q); fd.append('invoice_line[item_price]', l.p || 0); fd.append('include_vat', '');
    if (l.imgUrl) { const blob = await (await fetch(l.imgUrl)).blob(); fd.append('asset[data]', new File([blob], l.imgUrl.split('/').pop(), { type: 'image/jpeg' })); fd.append('image_input', '1'); }
    const res = await fetch(`/invoices/new_invoice_line/${id}.js?invoice_id=${id}&modal_mode=1`, { method: 'POST', body: fd, headers: hdr });
    if (!res.ok) throw new Error('line failed: ' + l.d);
  }
  await fetch(`/invoices/edit_invoice_attributes/${id}`, { method: 'POST', headers: hdr, body: new URLSearchParams({ authenticity_token: tok, 'invoice[subject]': o.subject }) });
  return id;
}
