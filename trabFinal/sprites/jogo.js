const LARG_TELA = 850;
const ALT_TELA = 650;
const VEL_ANDAR = 3.6;
const LARG_HEROI = 32;
const ALT_HEROI = 48;
const TEMPO_FASE = 180;
const PONTOS_DIAMANTE = 100;

function carregarImagem(caminho) {
  const img = new Image();
  img.src = caminho;
  return img;
}

class MeuJogo extends JS_CG_2D_API {
  acaoAoIniciar() {
    // Sprites originais do Fireboy extraídos do jogo de referência.
    this.imgCorpo = carregarImagem("images/fire/body.png");
    this.imgRostoParado = carregarImagem("images/fire/face-idle.png");
    this.imgRostoAndando = carregarImagem("images/fire/face-walking.png");
    this.imgDiamantes = carregarImagem("images/gems.png");
    this.imgPortas = carregarImagem("images/doors.png");
    this.imgAlavanca = carregarImagem("images/lever.png");
    this.imgPedra = carregarImagem("images/rock.png");
    this.imgFundoMenu = carregarImagem("images/menu-bg.png");

    this.sons = {
      pulo: "sounds/jump.mp3",
      morte: "sounds/death.mp3",
      porta: "sounds/door.mp3",
      alavanca: "sounds/lever-button.mp3",
      diamante: "sounds/gem.mp3",
      rio: "sounds/river.mp3",
    };

    EfeitosSonoros.carregarSom("pulo", this.sons.pulo);
    EfeitosSonoros.carregarSom("morte", this.sons.morte);
    EfeitosSonoros.carregarSom("porta", this.sons.porta);
    EfeitosSonoros.carregarSom("alavanca", this.sons.alavanca);
    EfeitosSonoros.carregarSom("diamante", this.sons.diamante);
    EfeitosSonoros.volumeSom("pulo", 0.45);
    EfeitosSonoros.volumeSom("diamante", 0.55);

    this.teclas = {};
    this.iniciarFase();
  }

  iniciarFase() {
    this.pararTimer("relogio");
    this.pararTimer("fimFase");

    this.estado = "jogando";
    this.pontos = 0;
    this.tempo = TEMPO_FASE;
    this.quadro = 0;
    this.direcao = 1;
    this.puloSegurado = false;
    this.portaAberta = false;
    this.alavancaAtiva = false;
    this.botaoRoxoAtivo = false;
    this.botaoVerdeAtivo = false;
    this.plataformaMovelY = 347;
    this.plataformaMovelDestino = 412;
    this.pedraY = 173;
    this.pedraVelY = 0;
    this.pedraCaiu = false;
    this.motivoDerrota = "";

    // O layout foi adaptado do primeiro nível do ZIP FireBoy-WaterGirl.
    // As alturas foram ajustadas para a resolução usada pela API da disciplina.
    this.plataformas = [
      new Retangulo2D(0, 628, 300, 22),
      new Retangulo2D(300, 641, 150, 9),
      new Retangulo2D(450, 628, 100, 22),
      new Retangulo2D(550, 641, 150, 9),
      new Retangulo2D(700, 628, 150, 22),
      new Retangulo2D(0, 542, 250, 22),
      new Retangulo2D(750, 563, 100, 65),
      new Retangulo2D(0, 455, 350, 22),
      new Retangulo2D(300, 477, 200, 22),
      new Retangulo2D(500, 490, 120, 9),
      new Retangulo2D(620, 477, 100, 22),
      new Retangulo2D(125, 347, 700, 22),
      new Retangulo2D(0, 173, 150, 87),
      new Retangulo2D(425, 217, 150, 43),
      new Retangulo2D(0, 260, 725, 22),
      new Retangulo2D(225, 87, 100, 22),
      new Retangulo2D(325, 87, 100, 65),
      new Retangulo2D(325, 152, 525, 22),
      new Retangulo2D(0, 0, 25, 650),
      new Retangulo2D(825, 0, 25, 650),
      new Retangulo2D(0, 0, 850, 18),
    ];

    // Plataforma móvel acionada pela alavanca.
    this.plataformaAlavanca = new Retangulo2D(25, this.plataformaMovelY, 100, 22);
    this.plataformaBotao = new Retangulo2D(725, 260, 100, 22);
    this.plataformas.push(this.plataformaAlavanca, this.plataformaBotao);

    this.heroi = new Personagem(55, 575, LARG_HEROI, ALT_HEROI, this.plataformas);
    this.heroi.setGravidade(0.58);
    this.heroi.setForcaPulo(-12.5);
    this.heroi.setVelTerminal(14);

    this.diamantes = [
      { x: 350, y: 585, coletado: false },
      { x: 195, y: 302, coletado: false },
      { x: 270, y: 42, coletado: false },
      { x: 475, y: 425, coletado: false },
      { x: 565, y: 315, coletado: false },
    ];
    this.totalDiamantes = this.diamantes.length;
    this.coletados = 0;

    // Fogo é seguro para o Fireboy; água e poços verdes são fatais.
    this.rios = [
      { x: 300, y: 628, largura: 150, altura: 22, tipo: "fogo", fase: 0 },
      { x: 550, y: 628, largura: 150, altura: 22, tipo: "agua", fase: 1 },
      { x: 500, y: 477, largura: 120, altura: 13, tipo: "perigo", fase: 2 },
    ];

    this.alavanca = { x: 185, y: 418, largura: 34, altura: 34 };
    this.botaoRoxo = { x: 275, y: 325, largura: 42, altura: 15 };
    this.botaoVerde = { x: 650, y: 462, largura: 42, altura: 15 };
    this.porta = { x: 625, y: 87, largura: 48, altura: 65 };

    this.iniciarTimer("relogio", 1, true, () => {
      if (this.estado !== "jogando") return;
      this.tempo--;
      if (this.tempo <= 0) this.perder("O tempo acabou!");
    });
  }

  atualizar() {
    this.quadro++;
    if (this.estado !== "jogando") return;

    const esquerda = this.teclas.arrowleft || this.teclas.a;
    const direita = this.teclas.arrowright || this.teclas.d;
    const pular = this.teclas.arrowup || this.teclas.w || this.teclas[" "];

    let movimento = 0;
    if (esquerda && !direita) movimento = -1;
    if (direita && !esquerda) movimento = 1;
    if (movimento !== 0) this.direcao = movimento;

    this.heroi.prevX = this.heroi.x;
    this.heroi.x += movimento * VEL_ANDAR;

    if (pular && !this.puloSegurado && this.heroi.isNoChao()) {
      this.heroi.pular();
      EfeitosSonoros.tocarSom("pulo", false, true);
    }
    this.puloSegurado = !!pular;

    // Atualiza a plataforma acionada pela alavanca.
    if (this.alavancaAtiva) {
      const destino = this.plataformaMovelDestino;
      if (this.plataformaAlavanca.y < destino) {
        this.plataformaAlavanca.y = Math.min(destino, this.plataformaAlavanca.y + 2);
      }
    }
    this.plataformaAlavanca.y = this.plataformaAlavanca.y;

    // A barra roxa desce quando o botão é pressionado.
    if (this.botaoRoxoAtivo) {
      this.plataformaBotao.y = Math.min(325, this.plataformaBotao.y + 2);
    }

    this.heroi.setPlataformas(this.plataformas);
    this.heroi.atualizar();

    // Mantém o personagem dentro dos limites do cenário.
    this.heroi.x = Math.max(25, Math.min(825 - LARG_HEROI, this.heroi.x));

    // Pedra que cai ao ser alcançada, baseada no obstáculo do nível original.
    if (!this.pedraCaiu && this.heroi.x > 440 && this.heroi.y < 230) {
      this.pedraCaiu = true;
    }
    if (this.pedraCaiu && this.pedraY < 570) {
      this.pedraVelY = Math.min(this.pedraVelY + 0.35, 8);
      this.pedraY += this.pedraVelY;
    }
    if (this.pedraCaiu && this.colisao(this.heroi, {
      x: 500, y: this.pedraY, largura: 42, altura: 42
    })) {
      this.perder("Uma pedra atingiu o Fireboy!");
      return;
    }

    // Coleta dos cristais de fogo.
    for (const d of this.diamantes) {
      if (!d.coletado && this.colisao(this.heroi, {
        x: d.x, y: d.y, largura: 26, altura: 28
      })) {
        d.coletado = true;
        this.coletados++;
        this.pontos += PONTOS_DIAMANTE;
        EfeitosSonoros.tocarSom("diamante", false, true);
      }
    }

    // Botões ativados ao pisar neles.
    if (!this.botaoRoxoAtivo && this.colisao(this.heroi, this.botaoRoxo)) {
      this.botaoRoxoAtivo = true;
      EfeitosSonoros.tocarSom("alavanca", false, true);
    }
    if (!this.botaoVerdeAtivo && this.colisao(this.heroi, this.botaoVerde)) {
      this.botaoVerdeAtivo = true;
      EfeitosSonoros.tocarSom("alavanca", false, true);
    }

    // A água e o poço verde eliminam o Fireboy. O rio de fogo é seguro.
    for (const rio of this.rios) {
      if (rio.tipo !== "fogo" && this.colisao(this.heroi, rio)) {
        this.perder(rio.tipo === "agua" ? "O Fireboy não pode tocar na água!" : "Você caiu em um poço mortal!");
        return;
      }
    }

    // A saída só conclui a fase depois de alcançar a porta de fogo.
    if (this.colisao(this.heroi, this.porta)) {
      this.vencer();
      return;
    }

    if (this.heroi.y > ALT_TELA) this.perder("O Fireboy caiu do cenário!");
  }

  teclaPressionada(e) {
    const tecla = e.key.toLowerCase();
    this.teclas[tecla] = true;
    if (e.repeat) return;
    if (tecla === "f") this.telaCheia();
    if (tecla === "r") this.iniciarFase();
    if (tecla === "e" && this.estado === "jogando") {
      const perto = this.colisao(this.heroi, {
        x: this.alavanca.x - 24,
        y: this.alavanca.y - 28,
        largura: this.alavanca.largura + 48,
        altura: this.alavanca.altura + 56,
      });
      if (perto) {
        this.alavancaAtiva = !this.alavancaAtiva;
        this.plataformaMovelDestino = this.alavancaAtiva ? 412 : 347;
        EfeitosSonoros.tocarSom("alavanca", false, true);
      }
    }
    if ((tecla === "enter" || tecla === " ") && this.estado !== "jogando") {
      this.iniciarFase();
    }
  }

  teclaLiberada(e) {
    this.teclas[e.key.toLowerCase()] = false;
  }

  cliqueDoMouse() {
    if (this.estado !== "jogando") this.iniciarFase();
  }

  perder(motivo) {
    if (this.estado !== "jogando") return;
    this.estado = "derrota";
    this.motivoDerrota = motivo;
    this.pararTimer("relogio");
    EfeitosSonoros.tocarSom("morte");
  }

  vencer() {
    if (this.estado !== "jogando") return;
    this.estado = "vitoria";
    this.portaAberta = true;
    this.pararTimer("relogio");
    this.pontos += this.tempo * 10;
    EfeitosSonoros.tocarSom("porta");
  }

  desenhar() {
    this.limparTela("#17170d");
    this.desenharFundo();
    this.desenharPlataformas();
    this.desenharRios();
    this.desenharObjetos();
    this.desenharPersonagem();
    this.desenharHUD();
    if (this.estado !== "jogando") this.desenharTelaFinal();
  }

  desenharFundo() {
    // Templo em tons oliva, com paredes de blocos como no jogo de referência.
    this.preenchimento("#34351b");
    this.retangulo(0, 0, LARG_TELA, ALT_TELA, Estilo.PREENCHIDO);
    for (let y = 0; y < ALT_TELA; y += 50) {
      this.preenchimento(y % 100 === 0 ? "#414126" : "#393a20");
      this.retangulo(0, y, LARG_TELA, 48, Estilo.PREENCHIDO);
      this.contorno(2, "#252613");
      this.retangulo(0, y, LARG_TELA, 48, Estilo.LINHAS);
      for (let x = (y / 50) % 2 === 0 ? 0 : 25; x < LARG_TELA; x += 50) {
        this.linha(x, y, x, y + 48);
      }
    }
    this.preenchimento("rgba(238, 218, 116, 0.07)");
    this.retangulo(280, 0, 300, ALT_TELA, Estilo.PREENCHIDO);
  }

  desenharPlataformas() {
    for (const p of this.plataformas) {
      this.preenchimento("#756a36");
      this.retangulo(p.x, p.y, p.largura, p.altura, Estilo.PREENCHIDO);
      this.contorno(2, "#3f3a1d");
      this.retangulo(p.x, p.y, p.largura, p.altura, Estilo.LINHAS);
      this.preenchimento("#9a8944");
      this.retangulo(p.x, p.y, p.largura, 4, Estilo.PREENCHIDO);
      for (let x = p.x + 25; x < p.x + p.largura; x += 50) {
        this.linha(x, p.y + 4, x, p.y + p.altura);
      }
    }
  }

  desenharRios() {
    for (const rio of this.rios) {
      const cor = rio.tipo === "fogo"
        ? ["#d83208", "#ff9b19"]
        : rio.tipo === "agua"
          ? ["#087ac2", "#72d8ff"]
          : ["#347d21", "#b1ec47"];
      this.preenchimento(cor[0]);
      this.retangulo(rio.x, rio.y, rio.largura, rio.altura, Estilo.PREENCHIDO);
      this.preenchimento(cor[1]);
      for (let x = rio.x; x < rio.x + rio.largura; x += 18) {
        const onda = Math.sin(this.quadro * 0.08 + x * 0.1) * 3;
        this.retangulo(x, rio.y + onda, 13, 4, Estilo.PREENCHIDO);
      }
    }
  }

  desenharObjetos() {
    // Cristais de fogo: recorte do sprite sheet original (imagem gems.png).
    for (const d of this.diamantes) {
      if (d.coletado) continue;
      const flutua = Math.sin(this.quadro * 0.08 + d.x) * 3;
      if (this.imgDiamantes.complete && this.imgDiamantes.naturalWidth > 0) {
        this.gc.drawImage(this.imgDiamantes, 24, 0, 24, 20, d.x, d.y + flutua, 30, 27);
      } else {
        this.preenchimento("#ff3328");
        this.triangulo(d.x + 15, d.y + flutua, d.x + 29, d.y + 13 + flutua, d.x + 15, d.y + 27 + flutua, Estilo.PREENCHIDO);
      }
    }

    // Alavanca original do pacote.
    if (this.imgAlavanca.complete && this.imgAlavanca.naturalWidth > 0) {
      this.imagem(this.imgAlavanca, this.alavanca.x, this.alavanca.y, 42, 30);
    } else {
      this.preenchimento(this.alavancaAtiva ? "#ffcc45" : "#9b9b9b");
      this.retangulo(this.alavanca.x, this.alavanca.y, 8, 30, Estilo.PREENCHIDO);
    }

    this.desenharBotao(this.botaoRoxo, this.botaoRoxoAtivo, "#9d58ce");
    this.desenharBotao(this.botaoVerde, this.botaoVerdeAtivo, "#58b94d");

    // Porta de fogo no destino.
    this.preenchimento("#282313");
    this.retangulo(this.porta.x - 5, this.porta.y - 4, this.porta.largura + 10, this.porta.altura + 8, Estilo.PREENCHIDO);
    if (this.imgPortas.complete && this.imgPortas.naturalWidth > 0) {
      this.gc.drawImage(this.imgPortas, this.portaAberta ? 7 * 111 : 0, 0, 111, 120,
        this.porta.x - 5, this.porta.y - 4, this.porta.largura + 10, this.porta.altura + 8);
    } else {
      this.preenchimento("#9a3a16");
      this.retangulo(this.porta, Estilo.PREENCHIDO);
    }

    // Pedra do primeiro nível.
    if (this.pedraCaiu) {
      if (this.imgPedra.complete && this.imgPedra.naturalWidth > 0) {
        this.imagem(this.imgPedra, 500, this.pedraY, 42, 42);
      } else {
        this.preenchimento("#777777");
        this.circulo(500, this.pedraY, 42, 42, Estilo.PREENCHIDO);
      }
    }

    this.preenchimento("#e6d38a");
    this.texto("E", this.alavanca.x + 14, this.alavanca.y - 7, 15, "bold");
  }

  desenharBotao(b, ativo, cor) {
    this.preenchimento("#242414");
    this.retangulo(b.x - 4, b.y + 8, b.largura + 8, 8, Estilo.PREENCHIDO);
    this.preenchimento(ativo ? "#d7e99b" : cor);
    this.retangulo(b.x, b.y + (ativo ? 5 : 0), b.largura, b.altura - (ativo ? 5 : 0), Estilo.PREENCHIDO);
    this.contorno(2, "#292515");
    this.retangulo(b.x, b.y, b.largura, b.altura, Estilo.LINHAS);
  }

  desenharPersonagem() {
    const x = this.heroi.x;
    const y = this.heroi.y;
    const andando = !!(this.teclas.arrowleft || this.teclas.a || this.teclas.arrowright || this.teclas.d);
    const noAr = !this.heroi.isNoChao();
    const tempoAnimacao = Math.floor(this.quadro / (andando ? 7 : 12));
    const corpoFrame = andando ? tempoAnimacao % 9 : 0;
    const rostoFrame = tempoAnimacao % 5;

    this.empilhar();
    if (this.direcao < 0) {
      this.transladar(x * 2 + LARG_HEROI, 0);
      this.escalar(-1, 1);
      this.desenharPartesPersonagem(-x - LARG_HEROI, y, corpoFrame, rostoFrame, andando, noAr);
    } else {
      this.desenharPartesPersonagem(x, y, corpoFrame, rostoFrame, andando, noAr);
    }
    this.desempilhar();
  }

  desenharPartesPersonagem(x, y, corpoFrame, rostoFrame, andando, noAr) {
    if (this.imgCorpo.complete && this.imgCorpo.naturalWidth > 0) {
      this.gc.drawImage(this.imgCorpo, corpoFrame * 105, 0, 105, 110, x + 2, y + 22, 29, 27);
    }
    const rosto = andando ? this.imgRostoAndando : this.imgRostoParado;
    if (rosto.complete && rosto.naturalWidth > 0) {
      if (andando) {
        this.gc.drawImage(rosto, rostoFrame * 340, 0, 340, 245, x - 8, y - 5, 48, 38);
      } else {
        this.gc.drawImage(rosto, rostoFrame * 230, 0, 230, 355, x - 4, y - 8, 41, 43);
      }
    }
    if (noAr) {
      this.preenchimento("rgba(255, 120, 20, 0.18)");
      this.circulo(x - 2, y + 2, 38, 46, Estilo.PREENCHIDO);
    }
  }

  desenharHUD() {
    this.preenchimento("rgba(12, 12, 5, 0.82)");
    this.retangulo(12, 10, 230, 65, Estilo.PREENCHIDO);
    this.preenchimento("#fff1c0");
    this.texto("FIREBOY - TEMPLO", 24, 32, 17, "bold");
    this.texto(`Cristais: ${this.coletados}/${this.totalDiamantes}`, 24, 57, 18);

    this.preenchimento("rgba(12, 12, 5, 0.82)");
    this.retangulo(710, 10, 128, 42, Estilo.PREENCHIDO);
    this.preenchimento(this.tempo <= 20 ? "#ff6b3d" : "#fff1c0");
    this.texto(`TEMPO: ${this.tempo}`, 722, 38, 19, "bold");

    if (this.quadro < 600) {
      this.preenchimento("rgba(0, 0, 0, 0.65)");
      this.retangulo(185, 605, 480, 32, Estilo.PREENCHIDO);
      this.preenchimento("#fff1c0");
      this.gc.textAlign = "center";
      this.texto("A/D ou ←/→: mover   W/↑/ESPAÇO: pular   E: alavanca   R: reiniciar", 425, 627, 14);
      this.gc.textAlign = "left";
    }
  }

  desenharTelaFinal() {
    this.preenchimento("rgba(0, 0, 0, 0.78)");
    this.retangulo(0, 0, LARG_TELA, ALT_TELA, Estilo.PREENCHIDO);
    this.preenchimento(this.estado === "vitoria" ? "#343b17" : "#421c13");
    this.retangulo(180, 185, 490, 260, Estilo.PREENCHIDO);
    this.contorno(4, this.estado === "vitoria" ? "#e5c75a" : "#ed6841");
    this.retangulo(180, 185, 490, 260, Estilo.LINHAS);
    this.gc.textAlign = "center";
    this.preenchimento(this.estado === "vitoria" ? "#ffe17a" : "#ff9873");
    this.texto(this.estado === "vitoria" ? "FASE CONCLUÍDA!" : "FIM DE JOGO", 425, 250, 39, "bold");
    this.preenchimento("#ffffff");
    if (this.estado === "vitoria") {
      this.texto("Você encontrou a saída do templo!", 425, 300, 21);
    } else {
      this.texto(this.motivoDerrota, 425, 300, 20);
    }
    this.texto(`Cristais: ${this.coletados}/${this.totalDiamantes}`, 425, 345, 22);
    this.texto(`Pontuação: ${this.pontos}`, 425, 378, 22, "bold");
    this.preenchimento("#ffe17a");
    this.texto("Pressione ENTER, ESPAÇO ou clique para jogar novamente", 425, 420, 17);
    this.gc.textAlign = "left";
  }
}

window.addEventListener("load", () => {
  new MeuJogo("Fireboy - Templo", "meuCanvas", LARG_TELA, ALT_TELA, 60);
});
