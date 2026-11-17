---
title: Datenschutzerklärung
description: Datenschutzerklärung von JsonToolBox — dein JSON verlässt nie deinen Browser. Umfasst die Website und die JSON Toolbox Browser-Erweiterung.
updatedAt: 2026-11-12
---

# Datenschutzerklärung

**Zuletzt aktualisiert:** 12. November 2026

Diese Datenschutzerklärung erläutert, wie JsonToolBox („wir", „uns", „unser") deine Informationen erhebt, verwendet und schützt, wenn du unsere Website und unsere Tools unter [jsontoolbox.cc](https://jsontoolbox.cc) sowie die JSON Toolbox Browser-Erweiterung (Chrome / Edge) nutzt.

**Geltungsbereich.** Die Abschnitte 1–8 beschreiben die Website unter jsontoolbox.cc. Abschnitt 9 beschreibt die Browser-Erweiterung, ein getrenntes Produkt, das lokal in deinem Browser installiert wird: Sie enthält keine Werbung, keine Analysen und keine Telemetrie, auch wenn die Website diese nutzen darf. Die Abschnitte 10–12 gelten für beide Produkte.

In dieser Erklärung bedeutet „wir erheben nicht", dass wir deine Daten nicht auf unseren Servern erhalten. Beide Produkte verarbeiten dein JSON lokal auf deinem Gerät.

Durch die Nutzung von JsonToolBox stimmst du den Bedingungen dieser Datenschutzerklärung zu.

## 1. Datenverarbeitung — 100 % clientseitig

Alle JSON- und Datei-Verarbeitung in JsonToolBox findet **ausschließlich in deinem Browser** mit JavaScript statt. Deine Daten werden:

- **Nicht** auf einen Server hochgeladen
- **Nicht** entfernt gespeichert
- **Nicht** zur Verarbeitung über das Netzwerk übertragen

Wir haben keinen Zugriff auf das JSON, die Dateien oder andere Inhalte, die du mit unseren Tools verarbeitest. Sobald du die Seite schließt, behält die Website keine Kopie dieser Daten. (Die Browser-Erweiterung bewahrt absichtlich deine letzte Vorschau auf deinem Gerät auf — siehe Abschnitt 9.3.)

### So prüfst du dies selbst

Wir ermutigen technisch versierte Nutzer, unsere Datenschutzaussagen zu überprüfen:

1. **Öffne die Entwicklertools** → Gehe zum Reiter **Netzwerk**
2. **Füge dein JSON** in ein beliebiges Tool ein und klicke auf Formatieren / Umwandeln / Validieren
3. **Prüfe den Netzwerk-Reiter** — du wirst keine einzige Anfrage im Zusammenhang mit deinen JSON-Inhalten sehen

Die einzigen Netzwerk-Anfragen, die diese Website stellt, dienen dem Laden der Seite selbst (HTML, CSS, JS) sowie Google-AdSense-Werbung. Deine JSON-Inhalte sind nie in einer Anfrage enthalten.

Du kannst auch unseren [Quellcode auf GitHub](https://github.com/kbmjj123/jsontoolbox.cc) prüfen, um zu bestätigen, dass keine Daten an externe Server gesendet werden.

## 2. Informationen, die wir nicht erheben

Wir erheben ausdrücklich **keine**:

- Inhalte deines JSON, deiner Dateien oder anderer Daten, die du in unsere Tools einfügst
- Persönliche Informationen durch die Nutzung der Tools (z. B. Namen, E-Mails, Kennungen in deinem JSON)
- Daten, die zur Rekonstruktion deiner Eingaben verwendet werden könnten

## 3. Werbung — Google AdSense

Wir verwenden **Google AdSense**, um Werbung auf unserer Website anzuzeigen. Google AdSense kann Cookies oder ähnliche Technologien verwenden, um Werbung aufgrund deiner Besuche auf dieser und anderen Websites auszuspielen.

- Die Verwendung von Werbe-Cookies durch Google ermöglicht es ihm und seinen Partnern, Werbung aufgrund deines Besuchs auf unserer Website und/oder anderer Websites im Internet auszuspielen.
- Du kannst personalisierte Werbung über die [Google Ads-Einstellungen](https://adssettings.google.com/) deaktivieren.

**Wichtig:** Google AdSense arbeitet unabhängig von unseren JSON-Tools. Deine JSON-Daten werden niemals an Google oder einen Werbetreibenden weitergegeben. Werbung wird als separate Seitenressourcen geladen und hat keinen Zugriff auf die Inhalte, die du in unseren Tools verarbeitest.

## 4. Analysen

Wir können datenschutzfreundliche Web-Analysen verwenden, um zu verstehen, wie unsere Website genutzt wird. Dazu können gehören:

- Seitenaufrufe und Navigationspfade
- Referrer-Informationen (z. B. Suchmaschine, soziale Medien)
- Gerätetyp, Browsertyp und ungefährer Standort (z. B. Land/Region)

Diese Daten sind anonymisiert und aggregiert. Sie enthalten **nicht** deine JSON-Inhalte oder persönliche Informationen, die dich identifizieren könnten.

## 5. Cookies

Wir verwenden minimale Cookies nur für wesentliche Funktionen, wie zum Beispiel:

- Das Merken deiner Design-Einstellung (hell/dunkel)
- Das Merken deiner Spracheinstellungen

Wir verwenden **keine** Cookies für:

- Website-übergreifendes Tracking
- Den Verkauf von Daten an Dritte

Du kannst Cookies über deine Browsereinstellungen steuern oder deaktivieren. Das Deaktivieren von Cookies kann einige Website-Funktionen beeinträchtigen (z. B. das Beibehalten des Designs).

## 6. Dienste Dritter

| Dienst | Zweck | Geteilte Daten |
|--------|-------|----------------|
| Google AdSense | Werbung | Seiten-URL, Browser-Informationen (keine JSON-Inhalte) |

Wir geben deine JSON-Daten **nicht** an Dienste Dritter weiter. Punkt.

Anfragen an Dritte, die von der Browser-Erweiterung beim Anzeigen von Medien-URLs ausgelöst werden, sind ein anderer Fall und in Abschnitt 9.4 beschrieben: Sie gehen an die Hosts der URLs in deinem eigenen JSON, nicht an einen Dienst, mit dem wir Daten teilen.

## 7. Open-Source-Transparenz

JsonToolBox ist ein **Open-Source-Projekt**. Du kannst jede Codezeile prüfen, um unsere Datenschutzaussagen zu bestätigen:

- [GitHub-Repository](https://github.com/kbmjj123/jsontoolbox.cc)
- Es existiert kein serverseitiger JSON-Verarbeitungscode — weil es keine serverseitige Verarbeitung gibt
- Alle JSON-Operationen nutzen die browser-eigenen `JSON.parse` / `JSON.stringify` und clientseitige Bibliotheken

## 8. Deine Auswahlmöglichkeiten

Du kannst:

- JsonToolBox ohne aktivierte Cookies nutzen (über deine Browsereinstellungen)
- Deine Browserdaten jederzeit löschen
- Die Nutzung der Website jederzeit beenden; auf unserer Seite werden keine Daten aufbewahrt
- Google-AdSense-Werbung über Browser-Erweiterungen oder die [Google Ads-Einstellungen](https://adssettings.google.com/) blockieren

## 9. Browser-Erweiterung (Chrome / Edge)

Die [JSON Toolbox Browser-Erweiterung](https://github.com/kbmjj123/json-browser-plugins) ist ein getrenntes Open-Source-Projekt, das neben dieser Website gepflegt wird. Sie läuft vollständig in deinem Browser. Die Abschnitte 3–5 oben — Website-Werbung, Analysen und Cookies — gelten nicht für sie; stattdessen gelten die folgenden Bedingungen.

### 9.1 Was die Erweiterung tut

Die Erweiterung zeigt JSON-Dokumente, die der Browser sonst als reinen Text anzeigen würde, automatisch an und lässt dich sie bearbeiten. Alle Vorgänge zum Parsen, Formatieren, Suchen und Bearbeiten finden lokal in deinem Browser statt.

### 9.2 Daten, die die Erweiterung nicht erhebt

Wir erheben, empfangen oder speichern keine deiner Daten auf unseren Servern. Die Erweiterung hat kein Konto, keine Anmeldung, keine Telemetrie, keine Analysen, keine Absturzberichte, keine Werbung und kein SDK Dritter. Wir verkaufen oder teilen keine personenbezogenen Informationen, und deine Daten werden niemals für Werbung oder Modelltraining verwendet.

### 9.3 Auf deinem Gerät gespeicherte Daten

Die Erweiterung nutzt `browser.storage.local`, um Folgendes zu speichern:

- deine Einstellungen (Design, Einrückung, Standardansicht, Sprache, automatisches Verschönern, Medien-Vorschau);
- den Text des zuletzt angezeigten JSON-Dokuments, die URL der Seite, von der es stammt, sowie einen Zeitstempel, damit der Symbolleisten-Button es in einem eigenen Tab wieder öffnen kann.

Diese Daten verlassen nie dein Gerät, werden nie auf andere Geräte synchronisiert, werden durch die nächste Vorschau überschrieben und werden entfernt, wenn du die Erweiterung deinstallierst oder ihren Speicher in Chrome löscht. Die Website unter jsontoolbox.cc kann diesen Speicher nicht lesen.

### 9.4 Anfragen an Server Dritter

Wenn „Bild-Vorschauen" in den ⚙-Einstellungen aktiviert ist (die Voreinstellung), können URLs, die als Werte in deinem JSON erscheinen, vom Browser als Bilder, Audio, Video oder PDF-Frames geladen werden. Diese Anfragen gehen an die Server, die diese URLs hosten — nicht an uns — und können die üblichen Referrer-Informationen des Browsers für diese Website enthalten. Wenn eine URL Tokens oder Abfrageparameter enthält, ist diese URL für ihren Host sichtbar. Inline-`data:`-/Base64-Bilder werden ohne jede Anfrage gerendert.

„Alle herunterladen" ist eine separate Aktion, die du manuell aus der Bild-Lichtbox auslöst. Sie ruft die ausgewählten URLs direkt ab und kontaktiert daher ebenfalls deren Hosts.

Das Deaktivieren von „Bild-Vorschauen" unterbindet diese automatischen Medien-Anfragen.

### 9.5 Links

Der Viewer enthält Links zu https://jsontoolbox.cc und einen optionalen Support-Link zu https://ko-fi.com/kbmjj123. Sie öffnen nur bei deinem Klick in einem neuen Tab und unterliegen den Datenschutzrichtlinien der jeweiligen Websites. In der chinesischen Oberfläche zeigt der Support-Link stattdessen lokal gebündelte QR-Code-Bilder; es wird keine Netzwerk-Anfrage gestellt.

### 9.6 Berechtigungen

`storage` (lokale Einstellungen und die letzte Vorschau) sowie ein für alle Websites und `file://`-URLs registriertes Content-Script (nötig zum Erkennen von JSON-Seiten; für den Zugriff auf lokale Dateien musst du in Chrome zusätzlich „Zugriff auf Datei-URLs erlauben" aktivieren). Es werden keine `host_permissions`, `tabs`, `clipboardWrite` oder `unlimitedStorage` angefordert.

### 9.7 Quellcode

Der Quellcode der Erweiterung ist auf [GitHub](https://github.com/kbmjj123/json-browser-plugins) veröffentlicht. Du kannst ihn prüfen und so die oben beschriebenen Praktiken bestätigen — auf dieselbe Weise, wie Abschnitt 1 es für die Website nahelegt.

## 10. Datenschutz für Kinder

JsonToolBox und die Browser-Erweiterung richten sich nicht an Kinder unter 13 Jahren. Wir erheben wissentlich keine persönlichen Informationen von Kindern. Wenn du glaubst, dass ein Kind uns persönliche Informationen bereitgestellt hat, kontaktiere uns bitte und wir werden entsprechende Schritte unternehmen.

## 11. Änderungen dieser Richtlinie

Wir können diese Datenschutzerklärung von Zeit zu Zeit aktualisieren, um Änderungen unserer Praktiken oder gesetzlicher Anforderungen widerzuspiegeln. Das Datum „Zuletzt aktualisiert" oben wird entsprechend angepasst. Wesentliche Änderungen dieser Praktiken werden auf dieser Seite veröffentlicht und den Nutzern, einschließlich der Erweiterungsnutzer, offengelegt. Wir empfehlen dir, diese Richtlinie regelmäßig zu überprüfen.

## 12. Kontakt

Wenn du Fragen zu dieser Datenschutzerklärung oder unseren Datenschutzpraktiken hast, kontaktiere uns bitte unter:

[hello@jsontoolbox.cc](mailto:hello@jsontoolbox.cc)

Bei Fragen speziell zur Browser-Erweiterung kannst du auch ein Issue unter [github.com/kbmjj123/json-browser-plugins/issues](https://github.com/kbmjj123/json-browser-plugins/issues) eröffnen.

Wir beantworten Datenschutz-anfragen so schnell wie möglich.
