const PASTA = ".";
const LARG_TELA = 800;
const ALT_TELA = 600;
const LARG_MUNDO = 1600;
const CHAO_Y = 560;
const VEL_ANDAR = 4;
const COLISOR_L = 30;
const COLISOR_A = 48;
const ALTURA_SPRITE = 60;
const TEMPO_FASE = 60;
const PTS_DIAMANTE = 100;
const PTS_SEGUNDO = 10;
const PORTAO_Y_FECHADO = 340;
const PORTAO_Y_ABERTO = -240;

function novaImagem(src) {
  const img = new Image();
  img.src = src;
  return img;
}

class MeuJogo extends JS_CG_2D_API {
  acaoAoIniciar() {
    this.framesParado = this.carregarFrames("fireParado", 5, `${PASTA}/parado`);
    this.framesCorrer = this.carregarFrames("fireCorrer", 5, `${PASTA}/correr`);

    this.framesPulando = this.carregarFrames(
      "firePulando",
      5,
      `${PASTA}/pular`,
    );

    this.framesCaindo = this.carregarFrames("fireCair", 5, `${PASTA}/cair`);
    this.imgDiamanteVermelho = novaImagem(
      `${PASTA}/diamante/diamante_vermelho.png`,
    );

    this.imgDiamanteAzul = novaImagem(`${PASTA}/diamante/diamante_azul.png`);
    this.imgPortaFechada = novaImagem(`${PASTA}/porta_fechada.png`);
    this.imgPortaAberta = novaImagem(`${PASTA}/porta_aberta.png`);

    EfeitosSonoros.carregarSom("pulo", `${PASTA}/audio/pulo.wav`);
    EfeitosSonoros.carregarSom("diamante", `${PASTA}/audio/diamante.wav`);
    EfeitosSonoros.carregarSom("porta", `${PASTA}/audio/porta.wav`);
    EfeitosSonoros.carregarSom("vitoria", `${PASTA}/audio/vitoria.wav`);
    EfeitosSonoros.carregarSom("derrota", `${PASTA}/audio/derrota.wav`);
    EfeitosSonoros.volumeSom("pulo", 0.5);
    EfeitosSonoros.volumeSom("diamante", 0.7);

    this.teclas = {};
    this.escalaHeroi = 0;
    this.iniciarFase();
  }

  iniciarFase() {
    this.pararTimer("relogio");
    this.pararTimer("fimFase");
    this.estado = "jogando";
    this.motivoDerrota = "";
    this.pontos = 0;
    this.coletados = 0;
    this.bonusTempo = 0;
    this.tempoRestante = TEMPO_FASE;
    this.quadro = 0;
    this.quadroFim = 0;
    this.direcao = 1;
    this.puloSegurado = false;
    this.botaoAtivo = false;
    this.ponteAtiva = false;
    this.portaAberta = false;
    this.cameraX = 0;

    const chao = (x1, x2) => new Retangulo2D(x1, CHAO_Y, x2 - x1, 40);

    this.portao = new Retangulo2D(1330, PORTAO_Y_FECHADO, 20, 220);
    this.ponte = new Retangulo2D(650, 500, 200, 20);
    this.botaoPonte = new Retangulo2D(520, CHAO_Y - 8, 56, 8);

    this.solidos = [
      chao(0, 340),
      chao(440, 650),
      chao(850, 1100),
      chao(1200, 1600),

      new Retangulo2D(340, 580, 100, 20),
      new Retangulo2D(650, 580, 200, 20),
      new Retangulo2D(1100, 580, 100, 20),
      new Retangulo2D(170, 470, 130, 20),
      new Retangulo2D(320, 440, 110, 20),
      new Retangulo2D(450, 410, 110, 20),
      new Retangulo2D(580, 390, 110, 20),
      new Retangulo2D(710, 430, 130, 20),
      new Retangulo2D(930, 480, 100, 20),
      new Retangulo2D(-40, -300, 40, 1000),
      new Retangulo2D(LARG_MUNDO, -300, 40, 1000),
      this.portao,
    ];

    //piscinas
    this.piscinas = [
      { tipo: "lava", x: 340, y: CHAO_Y, largura: 100, altura: 20 },
      { tipo: "agua", x: 650, y: CHAO_Y, largura: 200, altura: 20 },
      { tipo: "limo", x: 1100, y: CHAO_Y, largura: 100, altura: 20 },
    ];

    this.botao = new Retangulo2D(900, CHAO_Y - 8, 60, 8);
    this.porta = new Retangulo2D(1490, CHAO_Y - 70, 46, 70);

    const d = (cx, cy) => ({ x: cx - 13, y: cy - 13, largura: 26, altura: 26 });

    this.diamantes = [
      d(235, 435),
      d(390, 515),
      d(390, 405),
      d(500, 375),
      d(635, 355),
      d(780, 395),
      d(550, 515),
      d(980, 445),
      d(1150, 450),
      d(1255, 515),
      d(1420, 515),
    ];

    this.totalDiamantes = this.diamantes.length;

    this.heroi = new Personagem(
      60,
      CHAO_Y - COLISOR_A,
      COLISOR_L,
      COLISOR_A,
      this.solidos,
    );

    this.sprite = new Sprite(this.heroi.x, this.heroi.y);
    this.sprite.setAnimacao(this.framesParado);

    this.iniciarTimer("relogio", 1, true, () => {
      if (this.estado !== "jogando") return;

      this.tempoRestante--;

      if (this.tempoRestante <= 0) {
        this.tempoRestante = 0;

        this.perder("O tempo acabou!");
      }
    });
  }

  perder(motivo) {
    if (this.estado !== "jogando") return;

    this.estado = "derrota";
    this.motivoDerrota = motivo;
    this.quadroFim = this.quadro;
    this.pararTimer("relogio");

    EfeitosSonoros.tocarSom("derrota");
  }

  abrirPorta() {
    this.estado = "porta";
    this.portaAberta = true;

    this.bonusTempo = this.tempoRestante * PTS_SEGUNDO;

    this.pararTimer("relogio");

    EfeitosSonoros.tocarSom("porta");

    this.iniciarTimer("fimFase", 0.8, false, () => {
      this.pontos += this.bonusTempo;
      this.estado = "vitoria";
      this.quadroFim = this.quadro;

      EfeitosSonoros.tocarSom("vitoria");
    });
  }

  fimDeJogo() {
    return this.estado === "vitoria" || this.estado === "derrota";
  }

  atualizar(dt) {
    this.quadro++;

    if (this.estado !== "jogando") return;

    const esq = this.teclas["arrowleft"] || this.teclas["a"];
    const dir = this.teclas["arrowright"] || this.teclas["d"];

    const querPular =
      this.teclas["arrowup"] || this.teclas["w"] || this.teclas[" "];

    let vx = 0;

    if (esq && !dir) vx = -1;
    if (dir && !esq) vx = 1;
    if (vx !== 0) this.direcao = vx;

    this.heroi.x += vx * VEL_ANDAR;

    if (querPular && !this.puloSegurado && this.heroi.isNoChao()) {
      this.heroi.pular();

      EfeitosSonoros.tocarSom("pulo", false, true);
    }

    this.puloSegurado = !!querPular;
    this.heroi.atualizar();

    let frames;
    let delay;

    if (!this.heroi.isNoChao()) {
      frames = this.heroi.velY < 0 ? this.framesPulando : this.framesCaindo;

      delay = 5;
    } else if (vx !== 0) {
      frames = this.framesCorrer;

      delay = 4;
    } else {
      frames = this.framesParado;

      delay = 8;
    }

    this.sprite.delayAnimacao = delay;
    this.sprite.setAnimacao(frames);
    this.sprite.setPosicao(this.heroi.x, this.heroi.y);
    this.sprite.atualizar();

    // abre portão
    if (!this.botaoAtivo && this.colisao(this.heroi, this.botao)) {
      this.botaoAtivo = true;
      EfeitosSonoros.tocarSom("porta");
    }

    if (this.botaoAtivo && this.portao.y > PORTAO_Y_ABERTO) {
      this.portao.y -= 5;
    }

    if (!this.ponteAtiva && this.colisao(this.heroi, this.botaoPonte)) {
      this.ponteAtiva = true;
      this.solidos.push(this.ponte);
      EfeitosSonoros.tocarSom("porta");
    }

    //diamantes
    for (let i = this.diamantes.length - 1; i >= 0; i--) {
      if (this.colisao(this.heroi, this.diamantes[i])) {
        this.diamantes.splice(i, 1);

        this.coletados++;
        this.pontos += PTS_DIAMANTE;
        EfeitosSonoros.tocarSom("diamante", false, true);
      }
    }

    for (const p of this.piscinas) {
      if (p.tipo === "lava") continue;

      // zona mortal
      const zona = {
        x: p.x,
        y: p.y + 6,

        largura: p.largura,
        altura: p.altura - 6,
      };

      if (this.colisao(this.heroi, zona)) {
        this.perder(
          p.tipo === "agua"
            ? "O Fireboy não pode tocar na água!"
            : "O limo verde é mortal!",
        );

        return;
      }
    }

    //porta
    if (this.colisao(this.heroi, this.porta)) {
      this.abrirPorta();

      return;
    }

    //câmera segue o jogador

    const alvo = this.heroi.x + COLISOR_L / 2 - LARG_TELA / 2;
    this.cameraX = Math.max(0, Math.min(LARG_MUNDO - LARG_TELA, alvo));
  }

  teclaPressionada(e) {
    const k = e.key.toLowerCase();
    this.teclas[k] = true;

    if (e.repeat) return;
    if (k === "f") this.telaCheia();
    if (k === "r") this.iniciarFase();

    if (
      k === "enter" &&
      this.fimDeJogo() &&
      this.quadro - this.quadroFim > 30
    ) {
      this.iniciarFase();
    }
  }

  teclaLiberada(e) {
    this.teclas[e.key.toLowerCase()] = false;
  }

  cliqueDoMouse(e) {
    //clique na tela final reinicia
    if (this.fimDeJogo() && this.quadro - this.quadroFim > 30)
      this.iniciarFase();
  }

  desenhar() {
    this.limparTela("#0b0a12");
    const esc = Math.min(
      this.larguraTela() / LARG_TELA,
      this.alturaTela() / ALT_TELA,
    );

    const dx = (this.larguraTela() - LARG_TELA * esc) / 2;
    const dy = (this.alturaTela() - ALT_TELA * esc) / 2;

    this.empilhar();
    this.transladar(dx, dy);
    this.escalar(esc, esc);
    this.gc.beginPath();
    this.gc.rect(0, 0, LARG_TELA, ALT_TELA);
    this.gc.clip();
    this.desenharFundo();
    this.empilhar();
    this.transladar(-this.cameraX, 0);
    this.desenharMundo();
    this.desempilhar();
    this.desenharHUD();
    this.desenharTelaFinal();
    this.desempilhar();
  }

  desenharFundo() {
    this.preenchimento("#1f1b2e");
    this.retangulo(0, 0, LARG_TELA, ALT_TELA, Estilo.PREENCHIDO);

    this.contorno(1, "rgba(255, 255, 255, 0.05)");

    for (let y = 40; y < ALT_TELA; y += 40) {
      this.linha(0, y, LARG_TELA, y);
    }

    const desloc = -((this.cameraX * 0.5) % 80);

    for (let linhaTijolo = 0, y = 0; y < ALT_TELA; y += 40, linhaTijolo++) {
      for (let x = desloc + (linhaTijolo % 2) * 40; x < LARG_TELA; x += 80) {
        this.linha(x, y, x, y + 40);
      }
    }
  }

  desenharMundo() {
    for (const s of this.solidos) {
      if (s === this.portao || s === this.ponte) continue;

      this.preenchimento("#5b5240");
      this.retangulo(s, Estilo.PREENCHIDO);

      this.preenchimento("#7a6e55");
      this.retangulo(s.x, s.y, s.largura, 4, Estilo.PREENCHIDO);
    }

    this.desenharPonte();
    this.desenharPortao();
    this.desenharBotao();
    this.desenharPorta();
    this.desenharDiamantes();
    this.desenharHeroi();
    this.desenharPiscinas(); // por cima do herói: dá a impressão de estar submerso
  }

  desenharPonte() {
    if (!this.ponteAtiva) return;

    this.preenchimento("#226c73");
    this.retangulo(this.ponte, Estilo.PREENCHIDO);
    this.preenchimento("#8fffe0");
    this.retangulo(
      this.ponte.x,
      this.ponte.y,
      this.ponte.largura,
      4,
      Estilo.PREENCHIDO,
    );
    this.contorno(2, "#c3fff1");

    for (
      let x = this.ponte.x + 25;
      x < this.ponte.x + this.ponte.largura;
      x += 35
    ) {
      this.linha(x, this.ponte.y + 4, x, this.ponte.y + this.ponte.altura);
    }
  }

  desenharPortao() {
    const g = this.portao;

    this.preenchimento("#8b8fa3");
    this.retangulo(g, Estilo.PREENCHIDO);
    this.contorno(2, "#555a6e");

    for (let y = g.y + 14; y < g.y + g.altura; y += 20) {
      this.linha(g.x, y, g.x + g.largura, y);
    }

    this.preenchimento("#555a6e");
    this.retangulo(
      g.x - 4,
      g.y + g.altura - 6,
      g.largura + 8,
      6,
      Estilo.PREENCHIDO,
    );
  }

  desenharBotao() {
    this.desenharPlaca(this.botaoPonte, this.ponteAtiva, "#48bdb2");
    this.desenharPlaca(this.botao, this.botaoAtivo, "#ff5a4d");
  }

  desenharPlaca(b, ativada, corInativa) {
    const afund = ativada ? 5 : 0;

    this.preenchimento("#2c2a38");
    this.retangulo(b.x - 6, CHAO_Y - 4, b.largura + 12, 4, Estilo.PREENCHIDO);
    this.preenchimento(ativada ? "#6dff7a" : corInativa);
    this.retangulo(
      b.x,
      b.y + afund,
      b.largura,
      b.altura - afund,
      Estilo.PREENCHIDO,
    );
  }

  desenharPorta() {
    const p = this.porta;
    const cx = p.x + p.largura / 2;
    const img = this.portaAberta ? this.imgPortaAberta : this.imgPortaFechada;

    if (!this.desenharProporcional(img, cx, p.y + p.altura, 76)) {
      this.preenchimento(this.portaAberta ? "#ffd24a" : "#8a4b20");
      this.retangulo(p, Estilo.PREENCHIDO);
    }

    //setinha da porta
    if (!this.portaAberta) {
      const salto = Math.sin(this.quadro * 0.1) * 4;
      this.preenchimento("#ffd24a");

      this.triangulo(
        cx - 9,
        p.y - 34 + salto,
        cx + 9,
        p.y - 34 + salto,
        cx,
        p.y - 20 + salto,
        Estilo.PREENCHIDO,
      );
    }
  }

  desenharDiamantes() {
    this.gc.globalAlpha = 0.55;
    this.gc.globalAlpha = 1;

    for (const dm of this.diamantes) {
      const flutua = Math.sin(this.quadro * 0.08 + dm.x) * 3;
      const cx = dm.x + dm.largura / 2;
      const base = dm.y + dm.altura + 2 + flutua;

      if (!this.desenharProporcional(this.imgDiamanteVermelho, cx, base, 30)) {
        this.preenchimento("#ff3b30");

        this.circulo(
          dm.x,
          dm.y + flutua,
          dm.largura,
          dm.altura,
          Estilo.PREENCHIDO,
        );
      }
    }
  }

  desenharHeroi() {
    if (this.portaAberta) return; // entrou na porta

    if (!this.escalaHeroi) {
      const ref = this.framesParado[0];

      if (ref.complete && ref.naturalHeight > 0) {
        this.escalaHeroi = ALTURA_SPRITE / ref.naturalHeight;
      }
    }

    const img = this.sprite.getImagem();

    const w = img.naturalWidth * this.escalaHeroi;
    const h = img.naturalHeight * this.escalaHeroi;
    const centroX = this.heroi.x + COLISOR_L / 2;
    const base = this.heroi.y + COLISOR_A;

    this.empilhar();
    this.transladar(centroX, base - h);

    if (this.direcao < 0) this.escalar(-1, 1);
    this.imagem(img, -w / 2, 0, w, h);
    this.desempilhar();
  }

  desenharPiscinas() {
    const estilos = {
      lava: { corpo: "rgba(235, 70, 15, 0.92)", topo: "#ffb02e" },
      agua: { corpo: "rgba(40, 120, 250, 0.85)", topo: "#9fcdff" },
      limo: { corpo: "rgba(60, 190, 60, 0.88)", topo: "#b4f59a" },
    };

    for (const p of this.piscinas) {
      const cor = estilos[p.tipo];

      this.preenchimento(cor.corpo);
      this.retangulo(p.x, p.y, p.largura, p.altura, Estilo.PREENCHIDO);

      this.preenchimento(cor.topo);
      this.retangulo(p.x, p.y, p.largura, 3, Estilo.PREENCHIDO);
    }
  }

  desenharProporcional(img, centroX, base, alturaAlvo) {
    if (!img || !img.complete || img.naturalWidth === 0) return false;
    const w = img.naturalWidth * (alturaAlvo / img.naturalHeight);

    this.imagem(img, centroX - w / 2, base - alturaAlvo, w, alturaAlvo);
    return true;
  }

  desenharHUD() {
    //pontuação
    this.preenchimento("rgba(0, 0, 0, 0.55)");
    this.retangulo(10, 10, 220, 58, Estilo.PREENCHIDO);
    this.preenchimento("#ffffff");
    this.texto(`Pontos: ${this.pontos}`, 20, 34, 22, "bold");
    this.preenchimento("#ff8a7a");
    this.texto(
      `Diamantes: ${this.coletados}/${this.totalDiamantes}`,
      20,
      58,
      18,
    );

    // Painel do tempo
    this.preenchimento("rgba(0, 0, 0, 0.55)");
    this.retangulo(LARG_TELA - 150, 10, 140, 40, Estilo.PREENCHIDO);
    this.preenchimento(this.tempoRestante <= 10 ? "#ff5a4d" : "#ffffff");
    this.texto(`Tempo: ${this.tempoRestante}`, LARG_TELA - 138, 38, 24, "bold");

    // Dica de controles nos primeiros segundos
    if (this.estado === "jogando" && this.quadro < 600) {
      this.gc.textAlign = "center";

      this.preenchimento("rgba(255, 255, 255, 0.85)");
      this.texto(
        "← → / A D: andar    ↑ / W / Espaço: pular    F: tela cheia    R: reiniciar",
        LARG_TELA / 2,
        584,
        16,
      );
      this.gc.textAlign = "left";
    }
  }

  desenharTelaFinal() {
    if (!this.fimDeJogo()) return;

    const ganhou = this.estado === "vitoria";
    this.preenchimento("rgba(0, 0, 0, 0.7)");
    this.retangulo(0, 0, LARG_TELA, ALT_TELA, Estilo.PREENCHIDO);
    this.preenchimento(ganhou ? "#1f3d1f" : "#4a1a14");
    this.retangulo(170, 150, 460, 290, Estilo.PREENCHIDO);
    this.contorno(4, ganhou ? "#7dff7d" : "#ff7a59");
    this.retangulo(170, 150, 460, 290, Estilo.LINHAS);
    this.gc.textAlign = "center";
    this.preenchimento(ganhou ? "#9dff9d" : "#ff8a6b");
    this.texto(ganhou ? "VITÓRIA!" : "VOCÊ PERDEU!", 400, 225, 54, "bold");
    this.preenchimento("#ffffff");

    if (ganhou) {
      this.texto(
        `Diamantes: ${this.coletados}/${this.totalDiamantes}`,
        400,
        280,
        26,
      );

      this.texto(`Bônus de tempo: +${this.bonusTempo}`, 400, 316, 26);

      this.texto(`Pontuação final: ${this.pontos}`, 400, 362, 32, "bold");
    } else {
      this.texto(this.motivoDerrota, 400, 285, 26);

      this.texto(
        `Diamantes: ${this.coletados}/${this.totalDiamantes}`,
        400,
        325,
        24,
      );

      this.texto(`Pontos: ${this.pontos}`, 400, 362, 28, "bold");
    }

    this.preenchimento("#ffd24a");
    this.texto("Clique ou pressione R para jogar novamente", 400, 412, 20);
    this.gc.textAlign = "left";
  }
}
window.addEventListener("load", () => {
  new MeuJogo("Fireboy", "meuCanvas", 800, 600, 60);
});
