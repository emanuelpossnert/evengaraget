"use client";

import { useState } from "react";
import { Mail, Save, RotateCcw } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description: string;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "quotation_created",
    name: "Offert Skapad",
    subject: "Din offert från EventGaraget är klar för {event_date}",
    description: "Skickas när en ny offert genereras",
    body: `Hej {customer_name},

Vi är glada att presentera din personlig offert från EventGaraget!

📋 Bokningsinformation:
- Bokningsnummer: {booking_number}
- Event-datum: {event_date}
- Plats: {location}
- Totalt belopp: {total_amount} SEK

✍️ Nästa steg:
Granska och signera din offert via länken nedan.

{sign_link}

Har du några frågor? Kontakta oss gärna!

Med vänlig hälsning,
EventGaraget-teamet`,
  },
  {
    id: "quotation_signed",
    name: "Offert Signerad",
    subject: "Bokningsbekräftelse - {booking_number}",
    description: "Skickas när kund signerar offerta",
    body: `Hej {customer_name},

Tack för att du undertecknade din offert! Din bokning är nu bekräftad.

📊 Bokningssammanfattning:
- Bokningsnummer: {booking_number}
- Leveransdatum: {delivery_date}
- Totalt belopp: {total_amount} SEK
- Handpenning (50%): {deposit} SEK

📥 Din signerade offert är bifogad.

Lycka till med ditt event!

Med vänlig hälsning,
EventGaraget-teamet`,
  },
  {
    id: "invoice_sent",
    name: "Faktura Skickad",
    subject: "Faktura {invoice_number} från EventGaraget",
    description: "Skickas när faktura genereras",
    body: `Hej {customer_name},

Bifogad är din faktura för bokning {booking_number}.

💰 Fakturadetaljer:
- Fakturanummer: {invoice_number}
- Belopp: {amount} SEK
- Förfallodatum: {due_date}

📥 Fakturan är bifogad till detta e-postmeddelande.

Tack för ditt företagande!

Med vänlig hälsning,
EventGaraget-teamet`,
  },
  {
    id: "reminder",
    name: "Påminnelse",
    subject: "Påminnelse: Din bokning börjar snart - {booking_number}",
    description: "Skickas innan leveransdatum",
    body: `Hej {customer_name},

Vi önskar du ett underbart event!

🎉 Din bokning börjar imorgon:
- Bokningsnummer: {booking_number}
- Leveransdatum: {delivery_date}
- Plats: {location}

📋 Vad du behöver veta:
- Utrustningen levereras enligt avtalat datum
- Var god och se till att utrustningen är säker och tillgänglig
- Kontakta oss omedelbar om det uppstår problem

Vi finns här för att hjälpa!

Med vänlig hälsning,
EventGaraget-teamet`,
  },
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_TEMPLATES[0].id);
  const [subject, setSubject] = useState<string>(DEFAULT_TEMPLATES[0].subject);
  const [body, setBody] = useState<string>(DEFAULT_TEMPLATES[0].body);

  const selectedTemplate = templates.find((t) => t.id === selectedId);

  const handleTemplateChange = (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (template) {
      setSelectedId(id);
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const handleSave = () => {
    setTemplates(
      templates.map((t) =>
        t.id === selectedId
          ? { ...t, subject, body }
          : t
      )
    );
    alert("E-postmall sparad!");
  };

  const handleReset = () => {
    const original = DEFAULT_TEMPLATES.find((t) => t.id === selectedId);
    if (original && confirm("Vill du återställa denna mall till standard?")) {
      setSubject(original.subject);
      setBody(original.body);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">E-postmallar</h1>
        <p className="text-gray-500 mt-1">Anpassa e-postmeddelanden för olika situationer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Mallar</h2>
            </div>
            <div className="space-y-1 p-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    selectedId === template.id
                      ? "bg-red-100 text-red-700 font-medium"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    <div>
                      <p className="text-sm font-medium">{template.name}</p>
                      <p className="text-xs text-gray-500">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-3">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            {/* Subject */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ämne</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Använd {`{customer_name}, {booking_number}, {event_date}`} etc som variabler
              </p>
            </div>

            {/* Body */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Innehåll</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 h-64 font-mono text-sm"
              />
            </div>

            {/* Available Variables */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">Tillgängliga variabler</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700">
                <div>`{"{customer_name}"}`</div>
                <div>`{"{booking_number}"}`</div>
                <div>`{"{event_date}"}`</div>
                <div>`{"{delivery_date}"}`</div>
                <div>`{"{location}"}`</div>
                <div>`{"{total_amount}"}`</div>
                <div>`{"{deposit}"}`</div>
                <div>`{"{invoice_number}"}`</div>
                <div>`{"{due_date}"}`</div>
                <div>`{"{sign_link}"}`</div>
                <div>`{"{amount}"}`</div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                <Save size={18} />
                Spara Mall
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all font-semibold"
              >
                <RotateCcw size={18} />
                Återställ Standard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

