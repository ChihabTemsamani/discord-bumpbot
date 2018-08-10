# discord-bumpbot
Ein Bumpbot, welcher einem Benachrichtigungen gibt, wenn es Zeit ist, zu Bumpen.

## Wichtige Info:
Der Source Code ist aktuell noch stürmisch. Ein Rewrite findet aktuell statt. Für Ideen zu Funktionen kann gerne die [Issues-Seite](https://github.com/Terax235/discord-bumpbot/issues) verwendet werden.

## Was bedeutet "Bumpen"?
Auf Discord gibt es einige Bots, die es möglich machen, einen Discord-Server auf verschiedenen Internetseiten zu listen. Und manche dieser Bots sind so gedacht, dass man auf seinem Discord-Server Befehle ausführt, um auf der Liste zu bleiben oder aufzusteigen.
Das Ziel dieses Bots ist es, jedes mal, wenn für eine Liste gebumpt werden kann, eine Erinnerung zu senden.

## Wie nutze ich den Bot?
Die Voraussetzung dafür ist, dass du zumindest etwas von [Node.js](https://nodejs.org/) verstehst.
Außerdem solltest du Node 8.0.0 oder höher auf deinem Gerät nutzen, sonst wird es nicht funktionieren.
An sich läuft es so:
1. Der Bot wird mit `git` geklont (`git clone https://github.com/Terax235/discord-bumpbot.git`)
2. Führe im Ordner des Bots `npm install` aus, um die nötigen Packages zu installieren.
3. Starte das erste Mal den Bot mit `node index.js`, um eine config.json zu generieren.
4. Die config.json wird mit den benötigten Informationen ausgefüllt.
5. Starte den Bot mit `node index.js`.
6. Fertig. Wenn alles richtig eingestellt wurde, sollten keine Fehler passieren. Wenn doch ein Fehler passiert, kontaktiere `Terax#9758` auf Discord.

## Lizenz
Dieses Projekt nutzt die [Apache-2.0](./LICENSE) Lizenz.

## Konfiguration

### 1. Generell
`bot_token` - Token des Discord Bot Accounts
`guild` - ID des Servers, auf dem der Bot sein soll.
`prefix` - Befehlszeichen für erweiterte Befehle (Bsp.: der `info`-Befehl würde so benutzt werden: `{prefix}info`) STANDARD: Erwähnung des Bots
`bumpchannel` - ID oder Name des Kanals, wo der Bot die Erinnerungen senden soll.
`bumprole` - Rolle derjenigen, die die Bump-Erinnerungen bekommen sollen (wichtig: stelle sicher, dass man die Rolle erwähnen kann).

### 2. Bumpbots
In der config.json findet man unter bumpbots ein Array, welches notwendige Informationen zu den einzelnen Bots enthält.
```json
"bumpbots" : [{ "botid" : "", "interval" : { "hours" : "", "minutes" : "", "seconds" : "" }, "bumpcommand" : "", "website" : null }]
```
Die folgenden Werte gibt es:
- `botid` - Die ID des Bots (kann bei einer Webseite einfach null sein)
- `interval` - Der Intervall, man kann Stunden, Minuten und Sekunden angeben, siehe oberes Beispiel.
- `bumpcommand` - Der Befehl, der zum bumpen eingegeben wird. Bei einer Webseite ist der Befehl dazu gut, um den Bump zu bestätigen.
- `website` - Falls man eine Webseite bumpen will, muss dort ein Link zu der Seite angegeben werden.
- `name` - Der Name, der nach dem ausführen des Bumpcommands angezeigt wird, zum Beispiel `discord.me` für `https://discord.me/dashboard`. Nicht notwendig, wird nur bei Webseiten genutzt. 
Man kann die Seite https://terax235.github.io/discord-bumpbot/ASSISTANT nutzen, um ein Objekt zu generieren, welches man im Anschluss bloß in die Bumpbots einfügen muss.