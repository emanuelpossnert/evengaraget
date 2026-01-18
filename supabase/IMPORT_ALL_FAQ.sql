-- ============================================================================
-- IMPORT ALL FAQ - EVENTGARAGET PRODUCTS
-- 117 FAQ questions and answers about products, pricing, branding, etc.
-- With categories and priority ordering
-- ============================================================================

INSERT INTO faq (question, answer, category, priority)
VALUES
-- PRICING - Priser på maskiner
('Vad kostar det att hyra en klomaskin för en dag i Stockholm?', 'Att hyra en klomaskin för 1 dag i Stockholm kostar 14 500 SEK ex moms med branding på alla sidor förutom baksida. Utan branding kostar det 8 500 SEK ex moms. I priset ingår hyra, 60 st separerbara plastbollar (100mm diameter), branding (vi skickar mall och ni skickar original) samt frakt tur och retur.', 'PRICING', 1),
('Vad kostar det att hyra en basketmaskin?', 'Basketmaskin för 1 dag i Stockholm kostar 14 500 SEK ex moms med branding på alla sidor, eller 8 500 SEK ex moms utan branding. Frakt tur och retur ingår.', 'PRICING', 2),
('Vad kostar det att hyra en fotobås?', 'Fotobås för 1 dag i Stockholm kostar 18 500 SEK ex moms med branding på 2x kortsida och 1x framsida, eller 13 500 SEK ex moms utan branding (svart bås). Priset inkluderar hyra, frakt T/R, installation, draperi i valfri Pantone-färg, fria utskrifter, valfri logga på utskriftsremsorna och teknisk support vid behov.', 'PRICING', 3),
('Vad kostar det att hyra en popcornvagn?', 'Liten popcornvagn för 1 dag i Stockholm kostar 3 290 SEK ex moms inklusive hyra, frakt T/R och 100 portioner (påsar, kärnor, olja, salt, städ). Stor popcornvagn med helbranding kostar 9 900 SEK ex moms eller 4 900 SEK utan branding.', 'PRICING', 4),
('Vad kostar det att hyra en sockervaddsmaskin?', 'Sockervaddsmaskin för 1 dag kostar 3 290 SEK ex moms inklusive hyra, frakt T/R och 100 portioner (socker och strutar). OBS: Det krävs lite övning för att lära sig snurra sockervadd, så vi erbjuder eventpersonal för 490 SEK ex moms per timme.', 'PRICING', 5),
('Vad kostar det att hyra en godishylla?', 'Godishylla för 1 dag i Stockholm kostar 9 800 SEK ex moms med branding på sidor och godislådor fram, eller 5 900 SEK ex moms utan branding. Vi kan även fixa godis för 200 SEK ex moms per kg (rekommenderat 0.15kg/person och för en välfylld hylla 32-40kg godis).', 'PRICING', 6),
('Vad kostar det att hyra Air Hockey?', 'Air Hockey för 1 dag i Stockholm kostar 6 800 SEK ex moms inklusive hyra och frakt tur och retur. Branding på alla sidor kan läggas till för 6 000 SEK ex moms.', 'PRICING', 7),
('Vad kostar det att hyra Shuffleboard?', 'Shuffleboard för 1 dag i Stockholm kostar 8 400 SEK ex moms (hyra 5 900 SEK + frakt T/R 2 500 SEK). Våra Shuffleboards är 2,75 m eller 3,66 m långa.', 'PRICING', 8),
('Vad kostar det att hyra en Jukebox?', 'Jukebox för 1 dag i Stockholm kostar 7 900 SEK ex moms inklusive frakt tur och retur, installation och musik som redan finns i boxen. Det är en riktig fin pjäs av märket Wurlitzer.', 'PRICING', 9),
('Vad kostar det att hyra en boxningsmaskin?', 'Boxningsmaskin för 1 dag i Stockholm kostar 7 900 SEK ex moms inklusive hyra och frakt tur och retur. Branding på alla sidor förutom baksida kan läggas till för 5 900 SEK ex moms.', 'PRICING', 10),
('Vad kostar det att hyra flipperspel?', 'Flipperspel för 1 dag i Stockholm kostar 5 900 SEK ex moms inklusive hyra och frakt tur och retur. Branding på samtliga sidor förutom baksida kostar ytterligare 5 900 SEK ex moms.', 'PRICING', 11),
('Vad kostar det att hyra en 360 fotobås?', '360 Photo för 1 dag i Stockholm kostar 16 500 SEK ex moms. Detta inkluderar 360 platta för 1-3 personer, obegränsat antal slow motion-videor, lätt branding med kundens logotyp på varje video, delningsstation, tekniker och operatör på plats, samt uppbyggnad och nedmontering.', 'PRICING', 12),
('Vad kostar det att hyra en godisautomat?', 'Godisautomat för 1 dag i Stockholm kostar 13 900 SEK ex moms med branding på sidor, eller 6 900 SEK ex moms utan branding. Priset inkluderar hyra, frakt T/R och 60 st separerbara plastbollar (100mm diameter).', 'PRICING', 13),
('Vad kostar det att hyra en gashaponmaskin?', 'Gashaponmaskin för 1 dag i Stockholm kostar 16 900 SEK ex moms med branding på sidor och framsida, eller 9 500 SEK ex moms utan branding. Priset inkluderar hyra, frakt T/R och 60 st separerbara plastbollar (100mm diameter).', 'PRICING', 14),
('Vad kostar det att hyra CatchTheLight?', 'CatchTheLight (reaktionsspel) för 1 dag i Stockholm kostar 11 900 SEK ex moms med branding på alla sidor, eller 5 900 SEK ex moms utan branding.', 'PRICING', 15),
('Vad kostar det att hyra 7 Seconds?', '7 Seconds (reaktionsspel) för 1 dag i Stockholm kostar 11 900 SEK ex moms med branding på alla sidor förutom baksida. Foliering av insida (backdrop) eller baksida kan läggas till för 1 800 SEK ex moms per sida.', 'PRICING', 16),
('Vad kostar det att hyra Cash Cube?', 'Cash Cube för 1 dag i Stockholm kostar 15 900 SEK ex moms med branding av alla karmar, topp, sockel och insidan (backdrop), eller 8 500 SEK ex moms utan branding.', 'PRICING', 17),
('Vad kostar det att hyra en varmchokladmaskin?', 'Varmchokladmaskin för 1 dag kostar 4 890 SEK ex moms plus 30 SEK ex moms per servering (koppar ej inkluderade). Helbranding på 2 sidor plus display kostar ytterligare 3 000 SEK ex moms.', 'PRICING', 18),
('Vad kostar det att hyra en maskin för brända mandlar?', 'Brända mandlar-bås för 1 dag kostar 4 990 SEK ex moms inklusive hyra, frakt T/R och 100 portioner (påsar och mandlar). Extra 100 portioner kostar 1 000 SEK ex moms.', 'PRICING', 19),
('Vad kostar det att hyra Eventina - den portabla nattklubben?', 'Eventina (portabel nattklubb) kostar 5 900 SEK inklusive montering, utkörning och nedmontering. Tältet är 5x5x4.5m och inkluderar ljud, ljus, förlängningskablar och rökmaskin. Självhämtning kostar endast 3 900 SEK. DJ kan läggas till för 4 500 SEK.', 'PRICING', 20),
('Vad kostar det att hyra ett marknadsbås?', 'Marknadsbås för 1 dag i Stockholm kostar 35 000 SEK ex moms med helbranding utvändigt. Branding av insida bakre vägg kan läggas till för 7 900 SEK ex moms.', 'PRICING', 21),
('Vad kostar det att hyra ett lyckohjul (Spin The Wheel)?', 'Spin The Wheel (150 cm eller 200 cm) kostar 4 900 SEK för hyra, eget tryck kostar 2 000-3 000 SEK beroende på omfattning, och frakt kostar 3 400 SEK.', 'PRICING', 22),
('Vad kostar eventpersonal?', 'Eventpersonal kostar 490 SEK ex moms per timme. För vissa aktiviteter som femkamp är priset 590 SEK ex moms per timme.', 'PRICING', 23),
('Erbjuder ni paketpriser för flera dagar?', 'Ja, vi har paketpriser för längre hyresperioder. Till exempel fotobås: 1 dag 17 500 SEK, 3 dagar 24 900 SEK, 7 dagar 29 900-43 900 SEK beroende på antal utskrifter, 14 dagar 69 900 SEK, och 21 dagar 94 900 SEK ex moms.', 'PRICING', 24),

-- BRANDING - Foliering och branding
('Erbjuder ni designhjälp för branding?', 'Ja, vi kan hjälpa med enkel design (ni skickar logga + färgkod) för 895 SEK ex moms per timme.', 'BRANDING', 1),
('Kan jag få bollarna i en specifik färg?', 'Ja, vi kan lackera 100 st bollar i valfri färg för 5 200 SEK ex moms.', 'BRANDING', 2),
('Kan jag få brandade basketbollar?', 'Ja, brandade basketbollar kostar 650 SEK per styck ex moms.', 'BRANDING', 3),
('Kan jag få tryckta popcornbägare eller strutar?', 'Ja, vi erbjuder olika alternativ: 500st påsar med enfärgstryck för 4 500 SEK ex moms, 500st muggar 230ml för 5 200 SEK, 500st strutar 500ml för 6 900 SEK, eller 500st popcornbägare 500ml för 7 900 SEK ex moms.', 'BRANDING', 4),
('Hur långt innan leverans behöver ni ha färdiga filer för branding?', 'Vi behöver färdiga filer senast 10 dagar innan leverans för att undvika expresskostnader. Filerna ska skickas tillbaka i PDF-format utan skärlinjer och med hårda mått.', 'BRANDING', 5),
('Vad kostar det att foliera baksidan av en maskin?', 'Foliering av baksida kostar vanligtvis 1 500-1 800 SEK ex moms beroende på maskin.', 'BRANDING', 6),
('Kan jag få en toppskylt till maskinerna?', 'Ja, toppskyltar finns som tillägg för flera maskiner. För fotobås kostar det 3 000 SEK, för godishylla 1 600 SEK, och för jukebox 2 500 SEK ex moms.', 'BRANDING', 7),
('Vad kostar tryckta mynt?', '100 mynt med tryck kostar 5 400 SEK ex moms.', 'BRANDING', 8),
('Kan jag få branding på insidan av maskiner?', 'Ja, många maskiner kan få branding även på insidan. Till exempel flipperspel kan få branding av insidan för 2 900 SEK och Cash Cube inkluderar redan branding av insidan (backdrop).', 'BRANDING', 9),
('Kan jag få mock-up innan produktion?', 'Ja, vi skickar mall/mått och en mock-up för maskinerna. Vi rekommenderar också att ni skickar en enkel mock-up tillbaka för vår skull.', 'BRANDING', 10),
('I vilket format ska jag skicka designfiler?', 'Filer ska skickas i PDF-format utan utfall och med hårda mått. För klomaskinen är det totalt 14 filer som ska förberedas.', 'BRANDING', 11),
('Kan jag få draperi i specifik färg till fotobåset?', 'Ja, fotobåset kan få draperi i valfri Pantone-färg enligt dina önskemål.', 'BRANDING', 12),
('Kan jag få specialanpassad branding?', 'Ja, vi erbjuder omfattande brandingmöjligheter. Vi skickar mallar och ni skickar original, eller så hjälper vi med design för 895 SEK/timme.', 'BRANDING', 13),

-- SHIPPING - Frakt
('Kan jag få klomaskinen levererad utanför kontorstid?', 'Ja, men vid frakt utanför vardagar 8-18 tillkommer en OB-frakt på 1 200 SEK ex moms per väg.', 'SHIPPING', 1),
('Vad kostar frakt till Göteborg?', 'För klomaskin till Göteborg kostar frakt 1 000 SEK en väg eller 1 700 SEK med tidpass. För basketmaskin är det 2 000 SEK en väg eller 3 000 SEK med tidpass.', 'SHIPPING', 2),
('Vad kostar frakt till Norge?', 'Klomaskin till Norge kostar 5 190 SEK en väg inklusive tidpass.', 'SHIPPING', 3),
('Vad kostar frakt till Danmark?', 'Klomaskin till Danmark kostar 4 700 SEK en väg inklusive tidpass.', 'SHIPPING', 4),
('Vad kostar frakt till Malmö?', 'Klomaskin till Malmö kostar 1 100 SEK en väg eller 2 000 SEK med tidpass.', 'SHIPPING', 5),
('Vad betyder OB-frakt?', 'OB-frakt betyder obekväm arbetstid och är en extra kostnad som tillkommer vid leverans utanför vardagar klockan 8-18. Kostnaden är vanligtvis 1 200-1 500 SEK ex moms per väg beroende på produkt.', 'SHIPPING', 6),
('Erbjuder ni internationell leverans?', 'Ja, vi levererar till Norge och Danmark. Vi har filial och logistik i Köpenhamn för våra klomaskiner och andra produkter.', 'SHIPPING', 7),

-- PRODUCTS - Produktdetaljer
('Vad ingår i en 5-kamp och vad kostar det?', '5-kamp kostar 22 900 SEK ex moms och du väljer 5 aktiviteter från vårt sortiment. I priset ingår frakt, montering och hämtning. För 3-kamp är priset 15 000 SEK ex moms. Aktivitetspersonal kan tillkomma för 590 SEK ex moms per timme.', 'PRODUCTS', 1),
('Vilka aktiviteter kan jag välja mellan för femkampen?', 'Du kan välja mellan: Basketmaskin, Shuffleboard, Cut-Prize/7 Seconds (reaktionsspel), CashCube, Boxningsmaskin, Airhockey, CatchTheLight (reaktionsspel), Elektroniskt Dart, Gigant Chess, och Fussball fotbollsspel.', 'PRODUCTS', 2),
('Vilken musik finns i jukeboxen?', 'Jukeboxen innehåller ett brett utbud av CD-skivor med artister som Queen, Gyllene Tider, Elvis, Madonna, ABBA, Rolling Stones, Lady Gaga, Bruce Springsteen med flera. Totalt över 40 olika skivor med allt från 50-tal till modern musik.', 'PRODUCTS', 3),
('Vilka storlekar finns på bollarna och mynten?', 'Bollar finns i standard 100mm diameter eller stora bollar 150mm diameter. Mynten är 25mm i diameter och 1,8mm tjocka.', 'PRODUCTS', 4),
('Hur många får plats i fotobåset?', 'I våra fotobås får det plats flera personer beroende på arrangemang. 360-plattan är för 1-3 personer, medan det portabla nattklubbstältet rymmer cirka 40 personer samtidigt.', 'PRODUCTS', 5),
('Vad är Gigant Chess?', 'Gigant Chess är storskaligt schack med mycket stora pjäser, perfekt för utomhusaktiviteter. Det kostar 2 900 SEK ex moms att hyra.', 'PRODUCTS', 6),
('Vad är Fussball?', 'Fussball är ett fotbollsspel där 2 sidor tävlar mot varandra. Det kostar 2 900 SEK ex moms att hyra.', 'PRODUCTS', 7),
('Vad är en Vending Machine och vad kostar den?', 'Vending Machine från Impact Solutions kostar 25 000 SEK inklusive foliering och frakt enligt vår prislista.', 'PRODUCTS', 8),
('Vad är BudWheels?', 'BudWheels är vår fraktpartner för leveranser innanför Stockholm. De hanterar transport av våra eventmaskiner.', 'PRODUCTS', 9),
('Vad är skillnaden mellan fotobås och fotoautomat?', 'Fotobås är ett större bås med draperi som kostar 18 500 SEK med branding. Fotoautomat på pelare är mer kompakt och kostar 11 900 SEK med branding. Båda inkluderar fria utskrifter.', 'PRODUCTS', 10),
('Vad är skillnaden mellan liten och stor popcornvagn?', 'Liten popcornvagn kostar från 2 500-2 990 SEK med 400 SEK för extra dag. Stor popcornvagn kostar från 3 500-3 900 SEK med 500 SEK för extra dag och kan få markistak för 3 500 SEK.', 'PRODUCTS', 11),
('Vad är skillnaden mellan olika reaktionsspel?', 'Vi har flera reaktionsspel: CatchTheLight (kan tävla 2 mot varandra), 7 Seconds/Cut-Prize, alla testar reflexer men med olika upplägg. Priser varierar från 4 900-11 900 SEK.', 'PRODUCTS', 12),

-- SETUP - Setup och installation
('Behövs el till maskinerna?', 'Ja, vanligt eluttag (220 volt) behövs. Vi rekommenderar att ni har förlängningssladd/förgrenare då sladden från maskinen är relativt kort.', 'SETUP', 1),
('Hur lång tid tar det att sätta upp utrustningen?', 'Monteringstiden varierar. För Eventina (portabel nattklubb) tar det cirka 60 minuter. De flesta andra maskiner är snabbare att installera.', 'SETUP', 2),
('Erbjuder ni installation och nedmontering?', 'Ja, för de flesta produkter ingår installation och nedmontering i priset. För Eventina utanför Stockholm erbjuds inte detta men tydliga instruktioner medföljer.', 'SETUP', 3),
('Hur stor yta behövs för maskinerna?', 'Det varierar per maskin. Shuffleboard är 2,75-3,66 m lång. Eventina-tältet är 5x5x4,5 m. Kontakta oss för specifika mått för den maskin du är intresserad av.', 'SETUP', 4),

-- GENERAL - Allmänt
('Vad är Eventgaraget?', 'Eventgaraget är ett företag baserat i Sverige som hyr ut eventmaskiner och tillhandahåller tjänster för aktiveringar. Vi har huvudkontor i Sverige och filial med logistik i Danmark för klomaskiner och andra produkter.', 'GENERAL', 1),
('Ingår moms i priserna?', 'Nej, alla priser är angivna exklusive moms om inte annat anges.', 'GENERAL', 2),
('Vem är Jens som nämns i offertmallarna?', 'Jens är kontaktpersonen på Eventgaraget som hjälper till med förfrågningar och bokningar. Han vill gärna hjälpa dig få en så lyckad aktivering som möjligt.', 'GENERAL', 3),
('Kan jag få en komplett offert för mitt event?', 'Absolut! Kontakta Jens på Eventgaraget så hjälper han dig sätta ihop en komplett offert baserat på dina behov och önskemål.', 'GENERAL', 4),
('Finns det säsongspriser eller rabatter?', 'Kontakta oss för information om eventuella kampanjer eller rabatter vid större bokningar eller längre hyresperioder.', 'GENERAL', 5),
('Behöver jag betala innan leverans?', 'För vissa produkter som Eventina gäller betalning 50% innan och 50% efter att uthyrningen är genomförd. Efter signering av offert kan det tillkomma kostnader.', 'GENERAL', 6),
('Vad är expresskostnader för branding?', 'Expresskostnader tillkommer om färdiga filer levereras senare än 10 dagar innan leverans. Kontakta oss för specifik prissättning.', 'GENERAL', 7),
('Finns det miljövänliga alternativ?', 'Kontakta oss för information om miljövänliga alternativ för förbrukningsmaterial som påsar och muggar.', 'GENERAL', 8),

-- SUPPORT - Support och reklamation
('Vad händer om utrustningen går sönder under uthyrning?', 'Teknisk support ingår vid behov för de flesta produkter. Kontakta oss omgående om något händer så löser vi det.', 'SUPPORT', 1),
('Vad ingår i teknisk support?', 'Teknisk support inkluderar hjälp vid eventuella problem med utrustningen under uthyrningsperioden, antingen via telefon eller på plats vid behov.', 'SUPPORT', 2),
('Vad händer om jag behöver avboka?', 'För Eventina (portabel nattklubb) gäller: Avbokning senare än 10 dagar före uthyrningen erhålles 50% av hyresbeloppet. För bokningar utanför Stockholm är det 14 dagar (50%) eller 7 dagar (75%).', 'SUPPORT', 3),

-- MISC - Övriga frågor
('Vad kostar extra bollar till klomaskinen?', 'Extra separerbara plastbollar (100 mm i diameter, 60st) kostar 1 500 SEK ex moms.', 'MISC', 1),
('Vad kostar det att hyra en klomaskin i Danmark/Köpenhamn?', 'Att hyra en klomaskin för 1 dag i Köpenhamn kostar 14 900 DKK ex moms inklusive transport tur och retur samt branding på alla sidor förutom baksida.', 'MISC', 2),
('Kan jag få färdigpoppade popcorn istället?', 'Ja, färdigpoppade popcorn finns som tillägg för 1 000 SEK ex moms per 100 portioner.', 'MISC', 3),
('Kan jag få färgat socker till sockervadd?', 'Ja, färgat socker kan läggas till för 1 000 SEK ex moms.', 'MISC', 4),
('Kan jag bränna egna CD-skivor till jukeboxen?', 'Ja, det går att bränna egna CD-skivor för att få med önskade låtar som tillägg till den befintliga musiksamlingen.', 'MISC', 5),
('Hur mycket godis behövs för en välfylld godishylla?', 'För en välfylld godishylla rekommenderar vi 32-40 kg godis. Vi räknar med cirka 0.15 kg per person.', 'MISC', 6),
('Kan jag välja specifika godissorter?', 'Vi kan inte lova specifika smaker men du kan ge önskemål så köper vi liknande sortiment. Vi arbetar med kilopris och 16 olika smaker betyder inte 16 kg - det beror på godisets storlek.', 'MISC', 7),
('Finns det LED-belysning som tillägg?', 'Ja, för 360 Photo kan 6 st LED Bars runt plattan läggas till för 2 900 SEK, eller LED bars/backdrop med fokus på ljussättning för 3 900 SEK ex moms.', 'MISC', 8),
('Kan maskinerna anpassas för barn?', 'Ja, de flesta av våra maskiner passar både barn och vuxna. Vi kan ge rekommendationer baserat på målgrupp och event.', 'MISC', 9),
('Kan maskinerna användas utomhus?', 'Ja, de flesta maskiner kan användas utomhus men behöver skydd mot väder. För Eventina-tältet rekommenderar vi gräs som underlag då vi använder tältpinnar.', 'MISC', 10),
('Vad händer vid dåligt väder?', 'De flesta maskiner fungerar inomhus. För utomhusbruk rekommenderar vi väderskydd. Eventina-tältet klarar normalt väder men vi garanterar inte stabilitet vid hård vind på annat underlag än gräs.', 'MISC', 11),
('Kan jag få hjälp med bemanning under eventet?', 'Ja, vi erbjuder eventpersonal för 490-590 SEK ex moms per timme beroende på aktivitet. För vissa aktiviteter som sockervadd rekommenderar vi starkt personal då det krävs övning.', 'MISC', 12),
('Kan jag hämta utrustningen själv?', 'För vissa produkter som Eventina kan ni hämta/lämna själv på vårt lager vilket ger reducerat pris (3 900 SEK istället för 5 900 SEK).', 'MISC', 13),
('Kan jag få en delningsstation för digitala bilder?', 'Ja, delningsstation ingår i 360 Photo-paketet så gäster kan dela sina slow motion-videor digitalt.', 'MISC', 14),
('Kan jag boka en DJ till Eventina?', 'Ja, DJ kan bokas som tillägg till Eventina (portabel nattklubb) för 4 500 SEK.', 'MISC', 15),
('Finns det åldersgräns för någon maskin?', 'De flesta maskiner passar alla åldrar, men boxningsmaskinen rekommenderas från cirka 12 år. Vi ger gärna råd baserat på er målgrupp.', 'MISC', 16),
('Kan jag få elektroniskt dart?', 'Ja, elektroniskt dart med LED-belysning och matta finns som alternativ i våra aktivitetspaket.', 'MISC', 17),
('Kan jag hyra bara vissa delar av paketen?', 'Våra paket är oftast kompletta lösningar, men kontakta oss för att diskutera anpassade lösningar efter era behov.', 'MISC', 18),
('Finns det begränsningar för antal utskrifter i fotobås?', 'För 1-dagsuthyrning ingår fria utskrifter. För längre perioder varierar det: 7 dagar inkluderar antingen 350 utskrifter per dag eller unlimited beroende på paket.', 'MISC', 19),
('Vad är separerbara plastbollar?', 'Separerbara plastbollar är bollar som kan öppnas för att lägga i priser eller produkter. De används i klomaskiner, godisautomater och gashaponmaskiner. Standardstorlek är 100mm i diameter.', 'MISC', 20),
('Kan bollarna användas i alla maskiner?', 'Nej, godisautomaten fungerar endast med bollar som är 100mm i diameter. Inga lösa produkter eller större bollar kan användas i den.', 'MISC', 21),
('Vad kostar det att få lysande sockervaddspinnar?', 'Lysande sockervaddspinnar finns som tillägg. För 100 st är kostnaden cirka 2 558 SEK ex moms enligt våra leverantörer.', 'MISC', 22),
('Vilka leverantörer arbetar ni med?', 'Vi arbetar med flera leverantörer för foliering och skyltning, bland annat The Sign, Sthlm PrintLab, Oparusic, JM skyltmontage, Autowrap och Robertssons.', 'MISC', 23),
('Vad kostar en eventvagn?', 'Eventvagn för 1 dag i Stockholm kostar 13 900 SEK ex moms med helbranding och markis i valfri Pantone-färg. Folierade lister och markisstänger kan läggas till för 2 500 SEK ex moms.', 'MISC', 24),
('Finns det paket för flera maskiner samtidigt?', 'Ja, vi erbjuder paket som 3-kamp (15 000 SEK) och 5-kamp (22 900 SEK) där du väljer aktiviteter från vårt sortiment.', 'MISC', 25);

-- Verify FAQ import
SELECT COUNT(*) as total_faq,
       COUNT(DISTINCT category) as categories
FROM faq;
