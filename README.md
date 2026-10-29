# Claw Machine

Juego 3D de máquina de garra con Three.js. Sin build para jugar: `index.html` + `bundle.js` (~550KB).

## Dev
```bash
npm i
npx esbuild src/main.js --bundle --minify --format=esm --outfile=bundle.js
python3 -m http.server 8000
```

## Controles
- Flechas (teclado) o pad en pantalla: mover la garra
- Espacio o botón DROP: bajar la garra
