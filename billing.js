// =====================
// js/billing.js
// Facturation - accès Comptabilité / Admin seulement
// =====================

document.addEventListener("DOMContentLoaded", () => {
  requirePerm("BILLING");

  const btnClearInvoices = document.getElementById("btnClearInvoices");
  const btnGenerate = document.getElementById("btnGenerate");
  const dataGenerateBtn = document.querySelector("[data-generate]");

  btnClearInvoices?.addEventListener("click", clearInvoices);
  btnGenerate?.addEventListener("click", generateFromValidatedEvents);
  dataGenerateBtn?.addEventListener("click", generateFromValidatedEvents);

  renderTable();
});

function normalizeEventStatus(status) {
  status = (status || "").toLowerCase().trim();

  if (status === "validé") return "valide";
  if (status === "annulé") return "annule";

  return status;
}

function clearInvoices() {
  localStorage.removeItem(window.HP_INVOICES_KEY);
  renderTable();
}

function generateFromValidatedEvents() {
  const events = getEvents();
  let invoices = getInvoices();

  const byEvent = new Map(
    invoices.map((invoice) => [String(invoice.eventId), invoice])
  );

  for (const ev of events) {
    const status = normalizeEventStatus(ev.status);
    const eventId = String(ev.id);

    // Si événement annulé -> annuler la facture existante
    if (status === "annule") {
      const invoice = byEvent.get(eventId);

      if (invoice) {
        invoice.status = "annulee";
        invoice.updated_at = new Date().toISOString();
      }

      continue;
    }

    // Si événement validé -> créer ou mettre à jour la facture
    if (status === "valide") {
      if (!byEvent.has(eventId)) {
        const newInvoice = {
          id: "F" + Date.now().toString().slice(-7) + Math.floor(Math.random() * 90 + 10),
          eventId: eventId,
          eventTitle: ev.title || "Événement",
          room: ev.room || "",
          amount: Number(ev.budget || 0),
          status: "en_attente",
          created_at: new Date().toISOString(),
        };

        invoices.unshift(newInvoice);
        byEvent.set(eventId, newInvoice);
      } else {
        const invoice = byEvent.get(eventId);

        invoice.eventTitle = ev.title || invoice.eventTitle;
        invoice.room = ev.room || invoice.room;
        invoice.amount = Number(ev.budget || invoice.amount || 0);

        // Si on revalide après annulation
        if (invoice.status === "annulee") {
          invoice.status = "en_attente";
        }

        invoice.updated_at = new Date().toISOString();
      }
    }
  }

  saveInvoices(invoices);

  addHistory("Factures générées ou mises à jour", {
    totalFactures: invoices.length,
  });

  renderTable();
}

function setInvoiceStatus(invoiceId, newStatus) {
  const invoices = getInvoices().map((invoice) => {
    if (String(invoice.id) === String(invoiceId)) {
      return {
        ...invoice,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
    }

    return invoice;
  });

  saveInvoices(invoices);

  addHistory("Statut de facture modifié", {
    invoiceId: invoiceId,
    newStatus: newStatus,
  });

  renderTable();
}

function renderTable() {
  const tbody =
    document.getElementById("invTbody") ||
    document.getElementById("tbody");

  if (!tbody) return;

  const invoices = getInvoices();
  tbody.innerHTML = "";

  if (!invoices.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td colspan="6" style="color: gray;">
        Aucune facture. Clique sur “Générer / mettre à jour”.
      </td>
    `;
    tbody.appendChild(tr);
    return;
  }

  invoices.forEach((invoice) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${invoice.id}</td>
      <td>${invoice.eventTitle}</td>
      <td>${invoice.room}</td>
      <td>${Number(invoice.amount || 0).toFixed(2)}</td>
      <td>${invoiceStatusLabel(invoice.status)}</td>
      <td>
        <select data-id="${invoice.id}">
          <option value="en_attente" ${invoice.status === "en_attente" ? "selected" : ""}>en attente</option>
          <option value="payee" ${invoice.status === "payee" ? "selected" : ""}>payée</option>
          <option value="retard" ${invoice.status === "retard" ? "selected" : ""}>retard</option>
          <option value="annulee" ${invoice.status === "annulee" ? "selected" : ""}>annulée</option>
        </select>
      </td>
    `;

    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("select[data-id]").forEach((select) => {
    select.addEventListener("change", () => {
      const invoiceId = select.getAttribute("data-id");
      setInvoiceStatus(invoiceId, select.value);
    });
  });
}