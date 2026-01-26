"use client";

import jsPDF from "jspdf";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Invoice, SystemSetting } from "@/lib/types";

/**
 * SEB Modulo 10 Referensnummer
 * Genererar ett betalningsreferensnummer enligt SEB standard
 */
export function generateSEBReferenceNumber(invoiceNumber: string): string {
  // Använd de numeriska värdena från fakturanumret
  let num = invoiceNumber.replace(/\D/g, "");
  if (!num) {
    num = "0";
  }

  // Modulo 10 - SEB standard
  let sum = 0;
  let weight = 2;

  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num.charAt(i), 10) * weight;
    if (digit > 9) {
      digit = Math.floor(digit / 10) + (digit % 10);
    }
    sum += digit;
    weight = weight === 2 ? 1 : 2;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return num + checkDigit;
}

/**
 * Exportera en invoice som PDF
 */
export async function exportInvoiceToPDF(
  invoice: Invoice & { booking_number?: string },
  settings?: SystemSetting
) {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let y = 10;

    // ===== HEADER MED LOGO =====
    // Lägg in loggan (om den finns)
    try {
      const logoUrl = "/eventgaraget-logo.png";
      const logoWidth = 40;
      const logoHeight = 20;
      pdf.addImage(logoUrl, "PNG", 20, y, logoWidth, logoHeight);
      y += 25;
    } catch (logoError) {
      console.warn("Kunde inte ladda logo:", logoError);
      y += 10;
    }

    // Horisontell linje
    pdf.setDrawColor(200, 0, 0); // Röd färg för EventGaraget
    pdf.line(20, y, pageWidth - 20, y);
    y += 8;

    // Företagsinformation (vänster sida)
    pdf.setTextColor(40, 40, 40);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    if (settings?.company_name) {
      pdf.setFont("helvetica", "bold");
      pdf.text(settings.company_name, 20, y);
      pdf.setFont("helvetica", "normal");
      y += 5;
    }
    if (settings?.company_org_number) {
      pdf.text(`Org-nr: ${settings.company_org_number}`, 20, y);
      y += 4;
    }
    if (settings?.company_address) {
      pdf.text(settings.company_address, 20, y);
      y += 4;
    }
    if (settings?.company_postal_code) {
      pdf.text(`${settings.company_postal_code} ${settings.company_city || ""}`, 20, y);
      y += 4;
    }

    // Höger sida - Faktura info
    const rightColX = 130;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("FAKTURANUMMER", rightColX, 20);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(invoice.invoice_number, rightColX, 26);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("DATUM", rightColX, 34);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(format(new Date(invoice.invoice_date), "d MMM yyyy", { locale: sv }), rightColX, 40);

    if (invoice.due_date) {
      pdf.setFont("helvetica", "bold");
      pdf.text("FÖRFALLODATUM", rightColX, 48);
      pdf.setFont("helvetica", "normal");
      pdf.text(format(new Date(invoice.due_date), "d MMM yyyy", { locale: sv }), rightColX, 54);
    }

    y = 70;

    // ===== CUSTOMER INFO SECTION =====
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(60, 60, 60);
    pdf.text("FAKTURERAD TILL", 20, y);
    y += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(40, 40, 40);
    pdf.text(invoice.customer_name, 20, y);
    y += 5;
    if (invoice.customer_org_number) {
      pdf.text(`Org-nr: ${invoice.customer_org_number}`, 20, y);
      y += 5;
    }
    if (invoice.customer_street_address) {
      pdf.text(invoice.customer_street_address, 20, y);
      y += 5;
    }
    if (invoice.customer_postal_code) {
      pdf.text(`${invoice.customer_postal_code} ${invoice.customer_city || ""}`, 20, y);
      y += 5;
    }
    if (invoice.customer_country) {
      pdf.text(invoice.customer_country, 20, y);
      y += 5;
    }

    y += 5;

    // ===== INVOICE ITEMS TABLE =====
    const tableStartY = y;
    const colWidths = [85, 20, 25, 30];
    const cols = ["Beskrivning", "Qty", "Pris/st", "Total"];

    // Header row
    pdf.setFillColor(200, 0, 0); // Röd header
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    let xPos = 20;
    cols.forEach((col, i) => {
      pdf.text(col, xPos + 2, y + 6, { align: "left" });
      xPos += colWidths[i];
    });
    pdf.rect(20, y + 1, pageWidth - 40, 8, "F");
    y += 12;

    // Item rows
    pdf.setTextColor(40, 40, 40);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    (invoice.items || []).forEach((item: any) => {
      xPos = 20;
      pdf.text(item.name || "", xPos, y, { maxWidth: colWidths[0] - 4 });
      xPos += colWidths[0];
      pdf.text(String(item.quantity || 0), xPos + 2, y, { align: "right" });
      xPos += colWidths[1];
      pdf.text(`${item.unit_price?.toLocaleString("sv-SE") || "0"} SEK`, xPos + 2, y, { align: "right" });
      xPos += colWidths[2];
      pdf.text(`${item.total_price?.toLocaleString("sv-SE") || "0"} SEK`, xPos + 2, y, { align: "right" });
      y += 6;
    });

    // Totals section
    y += 5;
    const totalsX = 120;
    
    // Subtotal
    pdf.setFont("helvetica", "normal");
    pdf.text("Subtotal:", totalsX, y);
    pdf.text(`${invoice.subtotal.toLocaleString("sv-SE")} SEK`, pageWidth - 25, y, { align: "right" });
    y += 6;

    // Tax
    if (invoice.tax_amount > 0) {
      pdf.text("Moms:", totalsX, y);
      pdf.text(`${invoice.tax_amount.toLocaleString("sv-SE")} SEK`, pageWidth - 25, y, { align: "right" });
      y += 6;
    }

    // Total (highlighted)
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(200, 0, 0); // Röd för totalt
    pdf.text("TOTALT:", totalsX, y);
    pdf.text(`${invoice.total_amount.toLocaleString("sv-SE")} SEK`, pageWidth - 25, y, { align: "right" });

    // ===== PAYMENT INFO FOOTER =====
    y = pageHeight - 45;
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("BETALNINGSINFORMATION", 20, y);
    y += 5;

    pdf.setFont("helvetica", "normal");
    const referenceNumber = generateSEBReferenceNumber(invoice.invoice_number);
    pdf.text(`Referensnummer: ${referenceNumber}`, 20, y);
    y += 4;

    if (settings?.company_bank_account) {
      pdf.text(`Bankgiro: ${settings.company_bank_account}`, 20, y);
      y += 4;
    }
    if (settings?.company_postgiro) {
      pdf.text(`Postgiro: ${settings.company_postgiro}`, 20, y);
      y += 4;
    }

    if (invoice.payment_terms) {
      pdf.text(`Betalningsvillkor: ${invoice.payment_terms}`, 20, y);
      y += 4;
    }

    if (invoice.notes) {
      const noteText = "Anmärkningar: " + invoice.notes;
      const splitText = pdf.splitTextToSize(noteText, 170);
      pdf.text(splitText, 20, y);
    }

    // Footer
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(8);
    if (settings?.company_website) {
      pdf.text(`Hemsida: ${settings.company_website}`, 20, pageHeight - 5);
    }
    pdf.text(`Genererad: ${format(new Date(), "d MMM yyyy HH:mm", { locale: sv })}`, pageWidth - 65, pageHeight - 5);

    pdf.save(`${invoice.invoice_number}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
    pdf.text(invoice.invoice_number, 120, 26);

    pdf.setFont("helvetica", "bold");
    pdf.text("Fakturadatum:", 120, 33);
    pdf.setFont("helvetica", "normal");
    pdf.text(format(new Date(invoice.invoice_date), "d MMM yyyy", { locale: sv }), 120, 39);

    if (invoice.due_date) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Förfallodatum:", 120, 46);
      pdf.setFont("helvetica", "normal");
      pdf.text(format(new Date(invoice.due_date), "d MMM yyyy", { locale: sv }), 120, 52);
    }

    y = 65;

    // ===== KUNDINFORMATION =====
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Faktureras till:", 20, y);
    y += 7;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(invoice.customer_name, 20, y);
    y += 5;

    if (invoice.customer_org_number) {
      pdf.text(`Org-nr: ${invoice.customer_org_number}`, 20, y);
      y += 5;
    }

    if (invoice.customer_street_address) {
      pdf.text(invoice.customer_street_address, 20, y);
      y += 5;
    }

    if (invoice.customer_postal_code) {
      pdf.text(`${invoice.customer_postal_code} ${invoice.customer_city || ""}`, 20, y);
      y += 5;
    }

    if (invoice.customer_country) {
      pdf.text(invoice.customer_country, 20, y);
      y += 5;
    }

    y += 5;

    // ===== FAKTURAÖVERSIKT TABELL =====
    const tableStartY = y;
    const colWidths = {
      description: 70,
      quantity: 20,
      unitPrice: 35,
      total: 35,
    };

    // Header
    pdf.setFillColor(200, 0, 0);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");

    pdf.rect(20, y, pageWidth - 40, 6, "F");
    pdf.text("Beskrivning", 22, y + 4);
    pdf.text("Antal", 92, y + 4, { align: "center" });
    pdf.text("Pris", 127, y + 4, { align: "right" });
    pdf.text("Totalt", 162, y + 4, { align: "right" });
    y += 8;

    // Items
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    (invoice.items || []).forEach((item: any) => {
      if (y > pageHeight - 40) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(item.name || "", 22, y);
      pdf.text(item.quantity.toString(), 92, y, { align: "center" });
      pdf.text(`${item.unit_price.toLocaleString("sv-SE")} SEK`, 127, y, { align: "right" });
      pdf.text(`${item.total_price.toLocaleString("sv-SE")} SEK`, 162, y, { align: "right" });
      y += 6;
    });

    y += 3;

    // ===== TOTALER =====
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    // Subtotal
    pdf.text("Subtotal:", 127, y);
    pdf.text(`${invoice.subtotal.toLocaleString("sv-SE")} SEK`, 162, y, { align: "right" });
    y += 6;

    // Tax
    if (invoice.tax_amount > 0) {
      pdf.text("Moms (25%):", 127, y);
      pdf.text(`${invoice.tax_amount.toLocaleString("sv-SE")} SEK`, 162, y, { align: "right" });
      y += 6;
    }

    // Total
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setFillColor(240, 240, 240);
    pdf.rect(120, y - 3, 82, 8, "F");
    pdf.text("TOTALT:", 127, y + 3);
    pdf.text(`${invoice.total_amount.toLocaleString("sv-SE")} SEK`, 162, y + 3, { align: "right" });

    y += 12;

    // ===== BETALNINGSINFORMATION =====
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Betalningsinformation:", 20, y);
    y += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    const referenceNumber = generateSEBReferenceNumber(invoice.invoice_number);
    pdf.text(`Referensnummer: ${referenceNumber}`, 20, y);
    y += 5;

    if (settings?.company_bank_account) {
      pdf.text(`Bankgiro: ${settings.company_bank_account}`, 20, y);
      y += 5;
    }

    if (settings?.company_postgiro) {
      pdf.text(`Postgiro: ${settings.company_postgiro}`, 20, y);
      y += 5;
    }

    if (invoice.payment_terms) {
      pdf.text(`Betalningsvillkor: ${invoice.payment_terms}`, 20, y);
      y += 5;
    }

    // ===== NOTERINGAR =====
    if (invoice.notes) {
      y += 3;
      pdf.setFont("helvetica", "bold");
      pdf.text("Anmärkningar:", 20, y);
      y += 5;
      pdf.setFont("helvetica", "normal");
      const splitText = pdf.splitTextToSize(invoice.notes, 170);
      pdf.text(splitText, 20, y);
    }

    // ===== FOOTER =====
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    const footerY = pageHeight - 10;
    if (settings?.company_website) {
      pdf.text(`Hemsida: ${settings.company_website}`, 20, footerY);
    }
    pdf.text("Tack för er order!", pageWidth / 2, footerY, { align: "center" });

    pdf.save(`${invoice.invoice_number}.pdf`);
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

/**
 * Exportera multiple invoices som en ZIP-fil med PDFs
 */
export async function exportMultipleInvoicesPDF(
  invoices: (Invoice & { booking_number?: string })[],
  settings?: SystemSetting
) {
  try {
    // Dynamisk import av jszip
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    // Generera PDF för varje faktura
    for (const invoice of invoices) {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let y = 15;

      // Kort version av PDF generering för bulk export
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("FAKTURA", 20, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      if (settings?.company_name) {
        pdf.text(settings.company_name, 20, y);
        y += 4;
      }

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Fakturanummer:", 120, 20);
      pdf.setFont("helvetica", "normal");
      pdf.text(invoice.invoice_number, 120, 26);

      y = 50;

      // Customer
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Faktureras till:", 20, y);
      y += 6;

      pdf.setFont("helvetica", "normal");
      pdf.text(invoice.customer_name, 20, y);
      y += 5;

      if (invoice.customer_street_address) {
        pdf.text(invoice.customer_street_address, 20, y);
        y += 5;
      }

      y += 5;

      // Items
      pdf.setFillColor(200, 0, 0);
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.rect(20, y, pageWidth - 40, 6, "F");
      pdf.text("Beskrivning", 22, y + 4);
      pdf.text("Antal", 92, y + 4);
      pdf.text("Pris", 127, y + 4);
      pdf.text("Totalt", 162, y + 4);
      y += 8;

      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");

      (invoice.items || []).forEach((item: any) => {
        if (y > pageHeight - 30) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(item.name || "", 22, y);
        pdf.text(item.quantity.toString(), 92, y);
        pdf.text(`${item.unit_price.toLocaleString("sv-SE")} SEK`, 127, y);
        pdf.text(`${item.total_price.toLocaleString("sv-SE")} SEK`, 162, y);
        y += 6;
      });

      // Totals
      y += 3;
      pdf.setFont("helvetica", "bold");
      pdf.text(`TOTALT: ${invoice.total_amount.toLocaleString("sv-SE")} SEK`, 127, y);

      // Add to ZIP
      const pdfData = pdf.output("arraybuffer");
      zip.file(`${invoice.invoice_number}.pdf`, pdfData);
    }

    // Generate ZIP and download
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fakturor_${format(new Date(), "yyyy-MM-dd")}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error generating ZIP:", error);
    throw error;
  }
}
