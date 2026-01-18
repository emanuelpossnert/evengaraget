-- Insert FAQs into the faq table
-- Run this in Supabase SQL Editor

INSERT INTO faq (question, answer, category, priority) VALUES
-- Uthyrningsfrågor
('Måste vi branda en maskin för att få hyra?', 'Nej självklart kan ni hyra produkter utan branding', 'Uthyrningsfrågor', 90),
('Får privatpersoner hyra?', 'Självklart!', 'Uthyrningsfrågor', 85),
('Finns det fler prylar utöver sortimentet?', 'Vi uppdaterar ständigt garaget. Hör av dig om det är något specifikt ni vill ha om ni inte hittar så kan vi säkert hjälpa till med.', 'Uthyrningsfrågor', 80),
('Kan vi hyra personal & bemanning?', 'Ja! Hör av dig så återkommer vi.', 'Uthyrningsfrågor', 75),
('Hur funkar det med försäkring?', 'För bolag som hyr gäller er egen egendomsförsäkring, brukar ingå i företagsförsäkringen. Det är upp till hyrestagaren att teckna fullgod försäkring som omfattar hyrd, lånad och leasad egendom under hyresperioden. Vid förfrågan ska försäkringsnummer där detta omfattas skickas till leverantören.', 'Uthyrningsfrågor', 88),

-- Brandingfrågor
('Hur går det till med branding?', 'Efter godkännande av offert får ni mått och mall av oss för att skapa egna original & artwork, som ni sedan skickar tillbaka till oss i de angivna måtten, pdf-format.', 'Brandingfrågor', 82),

-- Leveransfrågor
('Levererar ni i hela Sverige?', 'Ja! Vi samarbetar med fraktbolag som skickar över hela Sverige och Norden.', 'Leveransfrågor', 95),
('Tidspunktliga leveranser?', 'Vi har kunskap inom eventbranschen och vet att tider ofta kan vara känsligt. Allra vanligast är tidspunktliga leveranser vilket vi kan ordna.', 'Leveransfrågor', 92),
('Kan vi hämta själva?', 'Mycket går bra att hämta själv. Dock kräver vissa av våra produkter montering, då sköter även vi leveransen. Garaget finns i Enskede, Stockholm', 'Leveransfrågor', 87)
ON CONFLICT DO NOTHING;

-- Verify the insert
SELECT 
  category, 
  COUNT(*) as count,
  MIN(priority) as min_priority,
  MAX(priority) as max_priority
FROM faq
GROUP BY category
ORDER BY category;

