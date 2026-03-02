import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

interface PaymentData {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  status: string;
  reference_no: string | null;
  notes: string | null;
  customer_name?: string;
  project_name?: string;
}

interface InvoiceSettings {
  prefix: string;
  next_number: string;
  due_days: string;
  footer_note: string;
  terms: string;
  show_logo: boolean;
  show_bank_details: boolean;
}

interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  tax_id: string;
  logo_url: string | null;
}

interface CurrencySettings {
  default: string;
  enabled: string[];
}

interface BankAccount {
  enabled: boolean;
  account_name: string;
  account_number: string;
  branch: string;
  extra: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: "৳", USD: "$", AED: "د.إ", USDT: "₮",
};

const BANK_NAMES: Record<string, string> = {
  bkash: "bKash", nagad: "Nagad", rocket: "Rocket (DBBL)", upay: "Upay",
  ibbl: "Islami Bank Bangladesh (IBBL)", city: "City Bank", brac: "BRAC Bank",
  dbbl: "Dutch-Bangla Bank (DBBL)", stripe: "Stripe", binance: "Binance Pay", paypal: "PayPal",
};

async function fetchAllSettings() {
  const { data } = await supabase.from("site_settings").select("setting_key, setting_value");
  const map: Record<string, any> = {};
  (data || []).forEach((r: any) => { map[r.setting_key] = r.setting_value; });
  return map;
}

function loadImage(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function generateInvoicePdf(payment: PaymentData) {
  const settings = await fetchAllSettings();

  const company: CompanyInfo = {
    name: "Starline Builder's Ltd", email: "", phone: "", address: "", website: "", tax_id: "", logo_url: null,
    ...settings.company_info,
  };
  const invoice: InvoiceSettings = {
    prefix: "INV-", next_number: "1001", due_days: "30", footer_note: "", terms: "",
    show_logo: true, show_bank_details: true,
    ...settings.invoice,
  };
  const currency: CurrencySettings = { default: "BDT", enabled: ["BDT"], ...settings.currency };
  const bankSettings = settings.bank || {};

  const sym = CURRENCY_SYMBOLS[currency.default] || currency.default;
  const invoiceNo = `${invoice.prefix}${(payment.reference_no || payment.id.slice(0, 8)).toUpperCase()}`;

  const doc = new jsPDF();
  const navy = [15, 23, 42];
  const gold = [201, 165, 90];
  const pageW = doc.internal.pageSize.getWidth();

  // ── Header band ──
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, pageW, 44, "F");

  // Logo
  let logoX = 15;
  if (invoice.show_logo && company.logo_url) {
    try {
      const b64 = await loadImage(company.logo_url);
      if (b64) {
        doc.addImage(b64, "PNG", 15, 6, 32, 32);
        logoX = 52;
      }
    } catch { /* skip logo */ }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(company.name || "Payment Receipt", logoX, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const subParts = [company.email, company.phone, company.website].filter(Boolean);
  if (subParts.length) doc.text(subParts.join("  |  "), logoX, 26);
  if (company.address) doc.text(company.address, logoX, 33);

  // Invoice number & date (right side)
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoiceNo, pageW - 15, 16, { align: "right" });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${new Date(payment.payment_date).toLocaleDateString()}`, pageW - 15, 24, { align: "right" });
  if (company.tax_id) doc.text(`Tax ID: ${company.tax_id}`, pageW - 15, 32, { align: "right" });

  // ── Payment details table ──
  let y = 54;
  doc.setTextColor(50, 50, 50);

  const tableData = [
    ["Customer", payment.customer_name || "—"],
    ["Project", payment.project_name || "—"],
    ["Amount", `${sym}${payment.amount.toLocaleString()}`],
    ["Payment Method", payment.payment_method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())],
    ["Status", payment.status.charAt(0).toUpperCase() + payment.status.slice(1)],
    ["Reference", payment.reference_no || "—"],
  ];
  if (payment.notes) tableData.push(["Notes", payment.notes]);

  autoTable(doc, {
    startY: y,
    head: [["Field", "Details"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [navy[0], navy[1], navy[2]], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    margin: { left: 15, right: 15 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Bank Details ──
  if (invoice.show_bank_details && bankSettings.accounts) {
    const enabledBanks = Object.entries(bankSettings.accounts as Record<string, BankAccount>)
      .filter(([, acc]) => acc.enabled && acc.account_number);

    if (enabledBanks.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text("Payment / Bank Details", 15, y);
      y += 4;

      const bankRows = enabledBanks.map(([id, acc]) => [
        BANK_NAMES[id] || id,
        acc.account_name,
        acc.account_number,
        [acc.branch, acc.extra].filter(Boolean).join(" / ") || "—",
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Bank / Wallet", "Account Name", "Account / Wallet #", "Branch / Extra"]],
        body: bankRows,
        theme: "grid",
        headStyles: { fillColor: [gold[0], gold[1], gold[2]], textColor: [30, 30, 30], fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 15, right: 15 },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // ── Terms & Conditions ──
  if (invoice.terms) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text("Terms & Conditions", 15, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const termsLines = doc.splitTextToSize(invoice.terms, pageW - 30);
    doc.text(termsLines, 15, y);
    y += termsLines.length * 4 + 6;
  }

  // ── Footer ──
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageW - 15, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(invoice.footer_note || "This is a computer-generated receipt.", pageW / 2, y, { align: "center" });

  // Open in new tab for printing
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const win = window.open(url);
  if (win) win.onload = () => win.print();
}
