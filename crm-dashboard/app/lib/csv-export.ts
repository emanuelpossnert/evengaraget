/**
 * CSV Export Utility
 * Provides functions to export data as CSV files
 */

export function exportToCSV(
  data: Array<Record<string, any>>,
  filename: string,
  columns?: string[]
): void {
  if (data.length === 0) {
    alert("Ingen data att exportera");
    return;
  }

  // Use provided columns or auto-detect from first object
  const keys = columns || Object.keys(data[0]);

  // Create CSV header
  const header = keys.join(",");

  // Create CSV rows
  const rows = data.map((item) =>
    keys
      .map((key) => {
        const value = item[key];
        // Handle various data types
        if (value === null || value === undefined) {
          return "";
        }
        if (typeof value === "object") {
          return JSON.stringify(value);
        }
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return value;
      })
      .join(",")
  );

  // Combine header and rows
  const csv = [header, ...rows].join("\n");

  // Create and download file
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export customers to CSV
 */
export function exportCustomersToCSV(customers: Array<any>): void {
  const data = customers.map((c) => ({
    "Namn": c.full_name,
    "Email": c.email,
    "Telefon": c.phone,
    "Företag": c.company_name,
    "Org.nr": c.org_number,
    "Status": c.status,
    "Skapad": new Date(c.created_at).toLocaleDateString("sv-SE"),
  }));

  exportToCSV(data, `kunder-${new Date().toISOString().split("T")[0]}.csv`);
}

/**
 * Export bookings to CSV
 */
export function exportBookingsToCSV(bookings: Array<any>): void {
  const data = bookings.map((b) => ({
    "Bokningsnummer": b.booking_number,
    "Kund": b.customer?.full_name || "Okänd",
    "Plats": b.location,
    "Event-datum": new Date(b.event_date).toLocaleDateString("sv-SE"),
    "Leveransdatum": new Date(b.delivery_date).toLocaleDateString("sv-SE"),
    "Belopp (SEK)": b.total_amount,
    "Moms (SEK)": b.tax_amount || 0,
    "Status": b.status,
    "Skapad": new Date(b.created_at).toLocaleDateString("sv-SE"),
  }));

  exportToCSV(data, `bokningar-${new Date().toISOString().split("T")[0]}.csv`);
}

/**
 * Export products to CSV
 */
export function exportProductsToCSV(products: Array<any>): void {
  const data = products.map((p) => ({
    "Produktnamn": p.name,
    "Kategori": p.category,
    "Pris/dag (SEK)": p.price_per_day,
    "Beskrivning": p.description,
    "Skapad": new Date(p.created_at).toLocaleDateString("sv-SE"),
  }));

  exportToCSV(data, `produkter-${new Date().toISOString().split("T")[0]}.csv`);
}

/**
 * Export invoices to CSV
 */
export function exportInvoicesToCSV(invoices: Array<any>): void {
  const data = invoices.map((i) => ({
    "Fakturanummer": i.booking_number,
    "Kund": i.customer?.full_name || "Okänd",
    "Belopp (SEK)": i.amount,
    "Moms (SEK)": i.tax_amount || 0,
    "Förfallodatum": new Date(i.due_date).toLocaleDateString("sv-SE"),
    "Status": i.status,
  }));

  exportToCSV(data, `fakturor-${new Date().toISOString().split("T")[0]}.csv`);
}

/**
 * Export FAQ to CSV
 */
export function exportFAQToCSV(faqs: Array<any>): void {
  const data = faqs.map((f) => ({
    "Fråga": f.question,
    "Svar": f.answer.replace(/\n/g, " "),
    "Kategori": f.category,
    "Prioritet": f.priority,
  }));

  exportToCSV(data, `faq-${new Date().toISOString().split("T")[0]}.csv`);
}

