
const LARGURA = 360;
const ALTURA = 640;
const GRAVIDADE = 0.4;        
const FORCA_PULO = -6.5;      
const VELOCIDADE_INICIAL = 2; 
const VELOCIDADE_MAXIMA = 4.5;
const LARGURA_CANO = 72;
const ABERTURA = 160;        
const ESPACO_CANOS = 210;    

const tela = document.getElementById("tela");
tela.width = LARGURA;
tela.height = ALTURA;
const ctx = tela.getContext("2d");

const fundo = new Image();
fundo.src = "img/fundo.jpg";

const rosto = new Image();
rosto.src = "img/passaro.jpg";

let audio = null;
function tocarSom(frequencia, duracao) {
  try {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const volume = audio.createGain();
    osc.type = "square";
    osc.frequency.value = frequencia;
    volume.gain.value = 0.05;
    osc.connect(volume);
    volume.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duracao);
  } catch (e) {}
}

let passaro, canos, velocidadeY, velocidadeCanos, pontos, comecou, fimDeJogo;
let recorde = 0;
try { recorde = Number(localStorage.getItem("recordeFlappy")) || 0; } catch (e) {}

function reiniciar() {
  passaro = { x: 70, y: ALTURA / 2, largura: 44, altura: 44 };
  canos = [];
  velocidadeY = 0;
  pontos = 0;
  velocidadeCanos = VELOCIDADE_INICIAL;
  comecou = false;
  fimDeJogo = false;
}

function pular() {
  if (fimDeJogo) {
    reiniciar();
    return;
  }
  comecou = true;
  velocidadeY = FORCA_PULO;
  tocarSom(500, 0.08);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    pular();
  }
});
tela.addEventListener("mousedown", pular);
tela.addEventListener("touchstart", (e) => {
  e.preventDefault();
  pular();
});

function criarCano() {
  
  const topo = Math.random() * (ALTURA - ABERTURA - 120) + 60;
  canos.push({ x: LARGURA, topo: topo, passou: false });
}

function bateu(a, b) {
  return (
    a.x < b.x + b.largura &&
    a.x + a.largura > b.x &&
    a.y < b.y + b.altura &&
    a.y + a.altura > b.y
  );
}

function terminar() {
  if (fimDeJogo) return;
  tocarSom(150, 0.3);
  fimDeJogo = true;
  if (pontos > recorde) {
    recorde = pontos;
    try { localStorage.setItem("recordeFlappy", recorde); } catch (e) {}
  }
}

function atualizar() {
  if (!comecou || fimDeJogo) return;

  velocidadeY += GRAVIDADE;
  passaro.y += velocidadeY;

  if (passaro.y + passaro.altura > ALTURA || passaro.y < 0) {
    terminar();
  }

  if (canos.length === 0 || canos[canos.length - 1].x <= LARGURA - ESPACO_CANOS) criarCano();

  for (const cano of canos) {
    cano.x -= velocidadeCanos;

    const canoCima = { x: cano.x, y: 0, largura: LARGURA_CANO, altura: cano.topo };
    const canoBaixo = {
      x: cano.x,
      y: cano.topo + ABERTURA,
      largura: LARGURA_CANO,
      altura: ALTURA - cano.topo - ABERTURA,
    };

    const hitbox = { x: passaro.x + 6, y: passaro.y + 6, largura: passaro.largura - 12, altura: passaro.altura - 12 };
    if (bateu(hitbox, canoCima) || bateu(hitbox, canoBaixo)) {
      terminar();
    }

    if (!cano.passou && cano.x + LARGURA_CANO < passaro.x) {
      cano.passou = true;
      pontos++;
      tocarSom(800, 0.1);
      velocidadeCanos = Math.min(VELOCIDADE_MAXIMA, VELOCIDADE_INICIAL + Math.floor(pontos / 5) * 0.25);
    }
  }

  canos = canos.filter((c) => c.x + LARGURA_CANO > 0);
}

const imagemCano = new Image();
imagemCano.src = "img/cano.jpg";

function desenharCano(x, y, altura, deCabecaParaBaixo) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, LARGURA_CANO, altura);
  ctx.clip();  
  if (!imagemCano.complete || !imagemCano.naturalWidth) {
    ctx.fillStyle = "#ff7a1a";   
    ctx.fillRect(x, y, LARGURA_CANO, altura);
  } else {
    const alturaImagem = LARGURA_CANO * imagemCano.naturalHeight / imagemCano.naturalWidth;
    if (!deCabecaParaBaixo) {
      for (let ty = y; ty < y + altura; ty += alturaImagem) {
        ctx.drawImage(imagemCano, x, ty, LARGURA_CANO, alturaImagem);
      }
    } else {
    
      for (let ty = y + altura; ty > y; ty -= alturaImagem) {
        ctx.save();
        ctx.translate(x, ty);
        ctx.scale(1, -1);
        ctx.drawImage(imagemCano, 0, 0, LARGURA_CANO, alturaImagem);
        ctx.restore();
      }
    }
  }
  ctx.restore();

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, LARGURA_CANO, altura);
}

function desenhar() {
  ctx.clearRect(0, 0, LARGURA, ALTURA);

  if (fundo.complete) ctx.drawImage(fundo, 0, 0, LARGURA, ALTURA);
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  for (const cano of canos) {
    desenharCano(cano.x, 0, cano.topo, true);                                  
    desenharCano(cano.x, cano.topo + ABERTURA, ALTURA - cano.topo - ABERTURA, false); 
  }

  const cx = passaro.x + passaro.largura / 2;
  const cy = passaro.y + passaro.altura / 2;
  const inclinacao = Math.max(-0.5, Math.min(0.8, velocidadeY * 0.06));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(inclinacao);
  ctx.beginPath();
  ctx.arc(0, 0, passaro.largura / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(rosto, -passaro.largura / 2, -passaro.altura / 2, passaro.largura, passaro.altura);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, passaro.largura / 2, 0, Math.PI * 2);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 4;
  ctx.font = "bold 44px sans-serif";
  ctx.textAlign = "center";
  ctx.strokeText(pontos, LARGURA / 2, 60);
  ctx.fillText(pontos, LARGURA / 2, 60);

  ctx.font = "bold 22px sans-serif";
  if (!comecou) {
    ctx.strokeText("Clique ou aperte ESPAÇO", LARGURA / 2, ALTURA / 2 + 70);
    ctx.fillText("Clique ou aperte ESPAÇO", LARGURA / 2, ALTURA / 2 + 70);
  }
  if (fimDeJogo) {
    ctx.font = "bold 40px sans-serif";
    ctx.strokeText("FIM DE JOGO", LARGURA / 2, ALTURA / 2 - 10);
    ctx.fillText("FIM DE JOGO", LARGURA / 2, ALTURA / 2 - 10);
    ctx.font = "bold 22px sans-serif";
    ctx.strokeText("Recorde: " + recorde, LARGURA / 2, ALTURA / 2 + 30);
    ctx.fillText("Recorde: " + recorde, LARGURA / 2, ALTURA / 2 + 30);
    ctx.strokeText("Clique para jogar de novo", LARGURA / 2, ALTURA / 2 + 70);
    ctx.fillText("Clique para jogar de novo", LARGURA / 2, ALTURA / 2 + 70);
  }
}

function loop() {
  atualizar();
  desenhar();
  requestAnimationFrame(loop);
}

reiniciar();
loop();
