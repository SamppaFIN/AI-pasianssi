# AI Solitaire (Infinite Edge)

Tämä on moderni, tekoälyllä (OpenRouter) varustettu Pasianssi (Klondike), joka on rakennettu puhtaalla HTML/CSS/Vanilla JS -pinolla "Glassmorphism" -teemalla.

## Ominaisuudet
- **Tekoälypelaaja:** Valitse suosikki-AI (esim. GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro) ja katso kuinka se pelaa peliä puolestasi.
- **Manuaalinen pelaaminen:** Voit pelata itse raahaamalla tai klikkailemalla kortteja täysin normaalin pasianssin tapaan.
- **Keskeytys ja jatkaminen:** Voit laittaa tekoälyn pauselle, tehdä itse muutaman ovelan siirron ja antaa AI:n jatkaa siitä mihin jäit.
- **Premium UI:** Sulavat animaatiot ja tyylikäs tumma "glassmorphism" -ulkoasu.

## Käyttöohjeet

### 1. Ohjelman käynnistäminen
Projekti ei vaadi raskaita riippuvuuksia tai Node.js -käännöksiä. Riittää, että tarjoilet tiedostot millä tahansa lokaalilla web-palvelimella.
Esimerkiksi Pythonilla:
```bash
# Avaa terminaali projektin kansiossa ja aja:
python -m http.server 8080
```
Mene selaimella osoitteeseen: `http://localhost:8080`

### 2. Tekoälyn asettaminen (OpenRouter)
Tekoäly tarvitsee OpenRouter API-avaimen toimiakseen.
1. Klikkaa oikean yläkulman ratas-ikonia (⚙️) avataksesi asetukset.
2. Syötä [OpenRouter.ai](https://openrouter.ai/) -palvelusta hankkimasi API-avain (muotoa `sk-or-v1-...`).
3. Valitse pudotusvalikosta haluamasi tekoälymalli.
4. (Valinnainen) Säädä tekoälyn siirtoviivettä (Delay), jos haluat sen pelaavan nopeammin tai hitaammin.
5. Klikkaa "Save & Close". (Asetukset tallentuvat automaattisesti selaimesi LocalStorageen, eli niitä ei lähetetä minnekään muualle).

### 3. Pelaaminen
- **Automaattipeli:** Paina yläpalkista "Auto-Play". Tekoäly alkaa prosessoimaan siirtoja.
- **Step AI:** Paina "Step AI" antaaksesi tekoälyn tehdä vain tasan yhden siirron.
- **Pause:** Paina "Pause" keskeyttääksesi automaattisen pelin.
- **Manuaalinen siirto:** Klikkaa ensin korttia, jota haluat siirtää (se korostuu). Klikkaa sitten kohdepinoa. Voit nostaa uuden kortin klikkaamalla vasemman yläkulman Stock-pinoa (jossa on "🔄" tai selkäpuoli ylöspäin oleva kortti).

## Tekninen Rakenne
- `index.html`: Käyttöliittymän luuranko.
- `styles/main.css`: Tyylittelyt ja animaatiot.
- `src/engine/`: Sisältää Klondike-sääntömoottorin (`klondike.js`) ja korttiluokat (`card.js`). Tämä on täysin eristetty käyttöliittymästä, joten se on helppo laajentaa esim. Spider-pasianssilla tulevaisuudessa.
- `src/ui/board.js`: Vastaa DOM-päivityksistä ja hiiren klikkauksista.
- `src/ai/agent.js`: Vastaa API-kutsuista OpenRouteriin ja pelitilan tekstuaalisesta sarjallistamisesta promptiksi.
- `src/app.js`: Kokoaa komponentit yhteen.
