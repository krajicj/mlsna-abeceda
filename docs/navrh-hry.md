# Mlsná abeceda – herní návrh

Verze 0.3 · 23. 8. 2026 · jediný zdroj pravdy pro mechaniky.
Věci označené **[předpoklad]** jsem zvolil sám a čekají na potvrzení; otevřené otázky jsou
v poslední kapitole. Jména v příkladech jsou smyšlená – skutečná rodina žije jen
v nastavení hry (kap. 3). Změny proti 0.2: název Mlsná abeceda, veřejný repozitář, hlas
z nabídky ElevenLabs místo klonu (kap. 8), jen zvířecí zákazníci, diakritika až později,
limit sezení 10 objednávek, hudba odložena.

## 1. O co jde

Holčička (4 roky) je kuchařka v kouzelné kuchyni – cukrárně „Mlsná abeceda“. Chodí k ní zvířátka a objednávají si
dobroty: „Prosím tři jahody a perníček s písmenkem K!“ Aby objednávku splnila, musí
**spočítat** ovoce a **poznat** písmenko. Učení není cíl, ale nástroj – pomáhá kamarádovi.
Hotovou dobrotu zvířátko sní, zaplatí hvězdičkou a za hvězdičky si dítě kupuje nové věci do
kuchyně. Nic nejde pokazit, nic netiká, nikdo neprohrává.

Cíle, v pořadí:
1. Poznávání velkých tiskacích písmen (od nuly) a číslic 1–10 (1–5 už zná).
2. Počítání předmětů (umí do 20 – stavíme na tom), „kolik je“, sčítání do 10.
3. První čtení: písmeno ↔ hláska, skládání krátkých slov (první slovo: vlastní jméno),
   čtení objednávky z lístečku.
4. Aby se k tomu chtěla vracet sama.

## 2. Pro koho a na čem

- Hráčka: 4 roky, neumí číst, ovládá jedním prstem. Sezení 5–15 minut.
- Zařízení: tablet, dotykový notebook, mobil, počítač s myší. Všechno **jen na šířku**;
  na výšku hra ukáže obrázek otáčejícího se telefonu a řekne „Otoč mě!“.
- Scéna: logická výška 768 px, šířka 1024–1366 px podle poměru obrazovky, škáluje se do okna
  (na mobilu ~0,5×, proto jsou cíle velké). Rozvržení je kotvené: zákazník vlevo, výrobek
  uprostřed, police vpravo; mezery se roztahují. Na mobilu se nic neschovává, jen zmenšuje.
- Vstup: **jen klepnutí** (žádné tahání – na myši a pro 4letou nejspolehlivější). Klepnutí
  na věc = věc přiletí na místo. Tahání můžeme přidat později jako volitelné.
- Rodič: nastavuje, sleduje pokrok. Hru spouští z ikony na ploše (PWA), funguje offline.
- Jazyk hry: čeština. Vypravěč = jeden hlas z nabídky ElevenLabs (kap. 8); zvířátka krátké repliky.

## 3. Personalizace (vše v nastavení, nic v kódu)

Hra nezná žádná jména předem. Rodič v rodičovském koutku vyplní:

- **Dítě:** jméno + 5. pád pro oslovení (např. Anička / Aničko).
- **Rodina:** seznam {jméno, role} – maminka, tatínek, brácha, ségra, babička, děda…
  (např. Lenka – maminka, Tomík – brácha).

Z toho hra odvodí:
- **Pořadí písmen** (kap. 5.4): nejdřív písmena ze jména dítěte, pak počáteční písmena rodiny.
- **Slova k písmenům:** role jsou vždy k dispozici („M jako maminka“, „T jako táta“,
  „B jako brácha“); jména se použijí, jen pokud k nim existuje hlasový klip.
- **Oslovení** („Výborně, Aničko!“) a „objednávky pro rodinu“ („dvě jahody pro Tomíka“) –
  opět jen s klipem, jinak hra řekne neutrální variantu („…pro bráchu“).
- **Milník:** až umí všechna písmena svého jména, zákazník si objedná dort s jejím jménem
  a hra z toho udělá slávu (velké konfety, VIP hvězdičky).

**Hlasový balíček jmen:** `npm run voice -- --names` vezme jména z lokálního souboru
`personal.json` (v `.gitignore`) a vygeneruje klipy do `public/audio/voice/names/` +
`index.json`. Hra za běhu jen čte index – co v něm není, nevysloví. Repozitář je veřejný;
klipy se jmény (jen křestní, cizím hlasem z nabídky) se **commitují**, aby fungovaly i na
GitHub Pages – rozhodnutí autora, dá se kdykoli otočit smazáním složky.

## 4. Herní smyčka

```
zvoneček → přijde zákazník → řekne objednávku (hlas + obrázky v bublině)
        → dítě plní položky (počítání / písmenko / …)
        → výrobek hotový → zákazník ho sní, poděkuje, dá hvězdičku → cvak, fotka do alba
        → zákazník odejde → zvoneček
```

- **Zvoneček** na pultu přivolá dalšího zákazníka. Dítě řídí tempo; bez klepnutí se nic neděje.
- Jedna objednávka = 1–3 položky (kap. 5.3). Pořadí plnění je volné; bublina odškrtává hotové.
- Výrobek se staví uprostřed pultu; položky na něj přilétají z polic.
- Po splnění všech položek zacinká „hotovo“ + konfety, zákazník si dobrotu vezme.

### Výrobky (co se staví)

Stejné mechaniky, jiný obrázek – každý nový výrobek je odměna z obchůdku a drží hru čerstvou.

| Výrobek | Počítá se | Písmenko je | Číslice je |
|---|---|---|---|
| **Dortík** (start) | ovoce na dortu | perníček | svíčka |
| **Zmrzlinka** | kopečky v kornoutu („tři kopečky jahodové“) | oplatka | vlaječka |
| **Palačinky** | palačinky na sobě | písmenko ze šlehačky | cedulka |
| **Koktejl** | ovoce do mixéru (pak se rozmixuje – efekt) | brčko | nálepka na skleničce |

### Konec sezení
Po **10 objednávkách** (výchozí; rodič nastaví jiný počet, minutový limit nebo vypne) kuchyně zavře:
zhasne světlo, zvířátka zamávají, vypravěč: „Kuchyně dneska zavírá, dobrou noc!“ a cedule
„Zavřeno“. Znovu otevře rodič (zámek), nebo sama po 2 hodinách. Účel: hra sama říká „dost“.

## 5. Učení: dvě dráhy, jedna objednávka

Dcera počítá dobře, písmena nezná – proto se **čísla a písmena vyvíjejí nezávisle**.
Generátor objednávek si bere položky z obou drah podle toho, kde zrovna která je.

### 5.1 Typy položek

| Typ | Dráha | Co dítě dělá | Učí |
|---|---|---|---|
| **Počítání** „tři jahody“ | čísla | Klepe na jahody v misce; každá přiletí na výrobek, vypravěč počítá nahlas, kolečka nad výrobkem se plní. | jedna-ku-jedné, kdy přestat |
| **Číslice** „svíčku s číslem 5“ | čísla | Na polici svíčky s číslicemi, vybere správnou. | poznávání číslic |
| **Kolik je** | čísla | Na výrobku už leží 4 třešně: „Kolik je třešní? Dej svíčku s tím číslem.“ | počet → číslice |
| **Sčítání** | čísla | „Dvě jahody pro mě a jednu pro bráchu.“ Napočítá 2, pak 1, pak „Kolik dohromady?“ → svíčka. | sčítání do 10 přes předměty |
| **Písmenko** „perníček s písmenkem K“ | písmena | Na polici 3–4 perníčky, vybere správný. Vypravěč: „K jako kočka.“ | poznávání písmen, hláska |
| **Slovo** | písmena | „Napiš na dort ANIČKA.“ Skládá perníčky do políček; vzor v bublině, později jen hlasem. | skládání slov, pořadí písmen |
| **Lísteček** | obě | Zákazník mlčí, podá papírek s objednávkou (obrázek + slovo/číslo). Tlačítko ucha „přečti mi to“ je vždy k dispozici, ale až po 5 s. | čtení |

### 5.2 Stupně jednotlivých drah

**Čísla** (start na Č1, ale rychle poběží dál – 1–5 už zná):

| Stupeň | Co se objevuje | Rozsah |
|---|---|---|
| Č1 | počítání, číslice | 1–5 |
| Č2 | + „kolik je“ | počítání 1–10, číslice 6–10 |
| Č3 | + dva druhy ovoce v jedné položce („dvě jahody a tři borůvky“) | 1–10 |
| Č4 | + sčítání | součty do 5, pak do 10 |
| Č5 | + „o jednu víc / míň“, nula | výhled |

**Písmena** (start od nuly):

| Stupeň | Co se objevuje | Sada |
|---|---|---|
| P1 | písmenko, 2 distraktory | 4 písmena ze jména |
| P2 | písmenko, 3 distraktory | + zbytek jména bez diakritiky + počáteční písmena rodiny |
| P3 | + slovo se vzorem (3–4 písmena) | + častá písmena do ~14 |
| P4 | + slovo bez vzoru | + písmena s háčkem/čárkou ze jména (Š, Č, Á…), jméno dítěte jako milník |
| P5 | + lísteček | + zbytek abecedy bez Q, W, X, Y, CH; výhled: malá písmena |

### 5.3 Skládání objednávky

- **Délka:** prvních 10 objednávek 1 položka; pak 2; od (Č3 nebo P3) až 3.
- **Mix:** při 2+ položkách vždy aspoň jedna z každé dráhy, pokud to sada dovolí.
  Položka z dráhy, která je pozadu (písmena), má vyšší váhu – ale nikdy dvě stejné za sebou,
  aby z toho nebyl dril.
- **Ovoce** na položku vždy jen jeden druh (kromě Č3 „dva druhy“).

### 5.4 Adaptivní výběr

Každé písmeno a číslo má **skóre zvládnutí** 0–5:
- správně na první pokus +1, po chybě −1 (ne pod 0).
- Nové prvky se zavádějí, když ≥ 80 % aktuální sady má skóre ≥ 3, vždy jeden nový.
  Nový prvek se objeví nejpozději do 2 objednávek od zavedení.
- Výběr z „pytlíku“: prvky se skóre < 3 mají 3× vyšší váhu; nic se neopakuje dvakrát za sebou.
- Distraktory: ze zvládnutých prvků; na P1 vizuálně odlišné (K vs O, ne K vs X; 1 vs 7 ne).
- Postup na další stupeň: vše v aktuálním stupni má skóre ≥ 3. Zpět jen rodič.
- **Pořadí písmen** (počítá se z nastavení): 1) písmena jména dítěte bez diakritiky v pořadí,
  v jakém jsou ve jméně (Š se zatím ukazuje jako S), 2) počáteční písmena členů rodiny,
  3) častá a tvarově odlišná: O, S, T, A, M, U, D, N, R, J, B, V, Z, H, C, F, G,
  4) až na P4 písmena s diakritikou ze jména, ostatní diakritika mimo v1.
  Příklad pro Aničku, maminku Lenku a bráchu Tomíka: **A, N, I, K → L, T, O, S → M, U, D … → Č**

### 5.5 Chyby a nápověda

Chyba nikdy nezastaví hru a nikdy nezní jako výtka.

- **Špatný perníček / svíčka:** zatřese se, vypravěč: „To je A. Hledáme K.“ Druhá chyba: správný
  se rozsvítí a poskočí: „K je tady!“ Po klepnutí normální pochvala (ne slabší).
- **Přepočítání:** když už výrobek má 3 jahody a dítě klepne na další, jahoda skočí zpátky:
  „Už máme tři, to stačí!“ Po dosažení počtu se miska jemně přiklopí víčkem a kolečka
  nad výrobkem zacinkají – signál „stop“.
- **Nečinnost 15 s:** vypravěč zopakuje položku, položka v bublině zabliká.
- **Nečinnost 40 s:** nápověda (cíl se rozsvítí). Nikdy nic neudělá za dítě.

### 5.6 Obsah

- **Slova k písmenům** (hláska zní jasně, slovo zná, píše se tím písmenem). Role z rodiny
  mají přednost (M – maminka, T – táta, B – brácha). Výchozí tabulka:

  | | | | |
  |---|---|---|---|
  | A – auto | B – balón | C – cibule | D – dům |
  | E – ementál **?** *(nebo jméno z rodiny, jen s klipem)* | F – fotbal | G – guma | H – houba |
  | I – iglú | J – jablko | K – kočka | L – lev |
  | M – maminka | N – nos | O – oko | P – pes |
  | R – ryba | S – slon | Š – šnek | T – táta |
  | U – ucho | V – vlak | Z – zebra | |

- **Čísla:** 1–10; nula a více až s Č5.
- **Ovoce:** jahody, borůvky, třešně (start); banán, jablko, hruška, malina, hrozny (obchůdek).
- **Čeština v hláškách:** objednávky v celých větách se správnými tvary („jedna jahoda, dvě
  jahody, pět jahod“; „tři kopečky, pět kopečků“), počítání nahlas generickou řadou
  „jedna, dva, tři…“. Každá kombinace (číslo × věc) je samostatný klip, nic se nelepí.

## 6. Zákazníci

Objednávku říká **vypravěč** (jeden hlas pro všechny pokyny); zvířátko
říká jen své krátké emoce (pozdrav, „mňam“, dík, odchod) – vlastním hlasem, nebo jen zvukem.

| Start | Z obchůdku | VIP (vzácně, náhodně) |
|---|---|---|
| medvídek, zajíček, kočička | žabka, liška, ježek, sova, prasátko | král/královna (velká objednávka, 3 ★), dráček (chce „ohnivou“ polevu) |

Vracející se zákazník občas řekne něco osobního („Minule to bylo výborné!“).
Zákazníci jsou **jen zvířátka** (žádné figurky rodiny); rodina se do hry dostává jen
v hláškách („dvě jahody pro bráchu“).

## 7. Odměny

1. **Okamžitá (každá akce):** zvuk + animace – jahoda svištivě přiletí, perníček poskočí,
   kolečko cinkne, konfety. Pochvala hlasem se střídá (10+ variant, některé se jménem).
2. **Za objednávku:** zákazník sní dobrotu („mňam“), zaplatí **1 hvězdičku** (VIP 3),
   hvězdička letí do počítadla. Fotka do alba (blesk, cvak). Žádný bonus za „bez chyby“.
3. **Obchůdek (za hvězdičky):** nové ovoce (3 ★), nový zákazník (5 ★), nový výrobek –
   zmrzlinový stroj, pánev na palačinky, mixér (8 ★), polevy/barvy (2 ★), svíčky a ozdoby (2 ★),
   věci do kuchyně – záclony, kytka, kočka na polici, rádio (3–5 ★).
   Koupě: klepnutí → věc poskočí, vypravěč: „Chceš koupit banány za tři hvězdičky?“ + velké
   ✓ / ✗. Když nestačí hvězdičky, věc zachrastí a vypravěč řekne, kolik chybí (prázdné
   hvězdičky – zase počítání).
4. **Překvapení (bez podmínky):** zhruba každá 6.–10. objednávka – zákazník přinese kytku,
   za oknem duha, do kuchyně vletí motýl, který se nechá chytit. Náhodné, ne moc časté.

Co **nebude:** streaky, denní odměny, časově omezené nabídky, odemykání za „výkon“.

## 8. Zvuk a hlas

- **Vypravěč:** hlas z nabídky ElevenLabs (Voice Library, filtr čeština / vyprávění pro děti),
  model `eleven_multilingual_v2`. Klon vlastního hlasu autor zavrhl (veřejný repozitář =
  veřejný hlas). **Hlasy skutečných dabérů (Peppa: Jiří Hromada / Jan Šťastný, Bluey:
  Mariana Mandátová, Milada Vaňkátová…) klonovat nelze** – bez jejich souhlasu to zakazují
  podmínky ElevenLabs i osobnostní práva; slouží jen jako *referenční tón*: klidný, vřelý,
  pomalý, mírně rozverný, zřetelné samohlásky.
  **Casting:** skript vygeneruje 5 stejných vět („Prosím tři jahody a perníček s písmenkem K!“,
  pochvalu, opravu) 4–6 kandidátními hlasy; vybírá dcera. Vybraný hlas se zapíše jako
  `ELEVENLABS_VOICE_ID` do `~/.config/mlsna-abeceda/elevenlabs.env` (mimo repozitář); veškerá
  audia se pak generují jen jím.
  Účet: Free tarif stačí na casting (10 000 znaků/měsíc, vyžaduje uvedení ElevenLabs);
  na generování v1 (~12 000 znaků) Starter (~5 $/měsíc, komerční licence, lze po měsíci zrušit).
- **Zvířátka:** krátké repliky jiným hlasem (stock) nebo citoslovce/zvuky.
- **Rozsah hlášek v1:** pokyny a pochvaly ~80, objednávky číslo × věc (10 × ~12 = 120),
  písmena (~27 × 2), číslice (10), zákazníci (8 × 4), jména (podle nastavení).
  Celkem ~350 klipů ≈ 12 000 znaků – zanedbatelné. Manifest `src/data/lines.cs.ts`,
  generuje `npm run voice` (jen chybějící/změněné), audio se commituje.
- **Efekty:** klepnutí, svist, cinknutí, měkké „bum“ u chyby, foťák, zvoneček, kroky,
  chroupání, mixér. Zdroj: vlastní / CC0 (Kenney) / ElevenLabs SFX.
- **Hudba:** v1 bez hudby. Připravený přepínač a `music.ts`; později možná smyčka ze Suno
  (pozor na licenci Suno pro veřejné použití – vyžaduje placený tarif). Při řeči se ztlumí.
- Nikdy nemluví dva najednou; fronta hlášek; pokyn lze přerušit dotykem.

## 9. Rodičovský koutek

Zámek: podržet hvězdičky vpravo nahoře 3 s → „Kolik je 4 × 3?“ s číselnou klávesnicí.

- **Dítě a rodina:** jméno + oslovení, členové rodiny (jméno, role); u každého jména vidět,
  zda má hlasový klip.
- **Učení:** stupeň každé dráhy (lze posunout), sada písmen (zapnout/vypnout jednotlivá),
  rozsah čísel, vypnout/zapnout typy položek.
- **Pokrok:** mřížka písmen a čísel obarvená podle skóre, počet objednávek, poslední hraní.
- **Sezení:** limit objednávek / minut, nebo bez limitu.
- **Zvuk:** hlasitost hlasu, efektů, hudby.
- **Data:** export (JSON), import, „smazat vše“ s dvojím potvrzením.
- Verze hry.

## 10. Výtvarný styl

Jak v `design/Kitchen.dc.html`: plochý, zaoblený, obrys `#3B2A1A` 4 px, teplá paleta
(stěna `#FFE9D1`, dřevo `#D9A066`, mint `#BFE6D6`, jahoda `#E5484D`, hvězda `#FFC53D`),
font Fredoka. Vše SVG. Postavy mají 2–3 stavy (čeká, raduje se, jí); animace ≤ 600 ms,
nikdy neblokují vstup déle než 1 s.

## 11. Název a zveřejnění

- Název: **Mlsná abeceda**. Repozitář `krajicj/mlsna-abeceda` (veřejný), hra na
  `https://krajicj.github.io/mlsna-abeceda/`.
- Cedule nade dveřmi *ve hře* může nést jméno z nastavení („Cukrárna U Aničky“).
- Veřejný repozitář znamená: kód, grafika i audio jsou veřejné; jména rodiny jen v audiu
  (křestní), nikdy v kódu; žádný hlas autora.
- Licence: kód MIT; grafika a audio CC BY-NC 4.0 (ať si to kdokoli zahraje, ale neprodává).
  Audio z ElevenLabs podléhá jejich licenci podle tarifu. Font Fredoka má vlastní OFL.

## 12. Plán (milníky)

| # | Milník | Hotovo, když |
|---|---|---|
| M0 | Kostra | Vite projekt, responzivní scéna, přepínání scén, audio odemčené dotykem, otočení na šířku, nasazeno na GitHub Pages, placeholder grafika |
| M1 | První objednávka | Casting hlasu (dcera vybere), medvídek, miska jahod, 4 perníčky, svíčky; počítání + písmenko + číslice i s chybami a nápovědou; hvězdička; hlášky z ElevenLabs |
| M2 | Smyčka | Zvoneček, 3 zákazníci, generátor objednávek s dvěma dráhami (Č1–Č2, P1–P2), ukládání, konec sezení |
| M3 | Odměny | Obchůdek, album, překvapení, zmrzlinka jako druhý výrobek |
| M4 | Rodičovský koutek | Zámek, rodina a jména, hlasový balíček jmen, pokrok, export/import, PWA |
| M5 | Počítání | „kolik je“, dva druhy ovoce, sčítání (Č3–Č4), palačinky a koktejl |
| M6 | Čtení | Slovo se vzorem i bez, jméno jako milník, lísteček (P3–P5) |

M0–M2 je hratelné minimum; dát dceři do ruky a podle reakce upravit zbytek.

## 13. Otevřené otázky

Zodpovězeno a zapracováno: jména přes nastavení, co umí, zařízení, dortíky + zmrzlinky,
TypeScript, název Mlsná abeceda, veřejný repozitář, jen zvířecí zákazníci, diakritika
později, limit 10 objednávek, hudba později (Suno), pohled z první osoby, hlas z nabídky
ElevenLabs, grafika v SVG stylu z návrhu.

1. **Účet ElevenLabs:** až ho založíte a uložíte klíč do `~/.config/mlsna-abeceda/elevenlabs.env`
   (nikdy do chatu ani do repozitáře), spustím
   casting hlasů (STEP-07). Do té doby se staví s tichým placeholderem.
