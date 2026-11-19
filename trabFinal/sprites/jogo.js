const LARG_TELA = 850;
const ALT_TELA = 650;
const VEL_ANDAR = 3.6;
const LARG_HEROI = 32;
const ALT_HEROI = 48;
const TAMANHO_PEDRA = 42;
const TEMPO_FASE = 180;
const PONTOS_DIAMANTE = 100;
const ELEVADOR_CIMA = 347;
const ELEVADOR_BAIXO = 455;
const VEL_ELEVADOR = 2;

function carregarImagem(caminho) {
  const img = new Image();
  img.src = caminho;
  return img;
}

class HeroiSolido extends Personagem {
  _sobrepoe(plat) {
    const l = this._obterLimitesPlataforma(plat);
    const bate =
      this.x < l.maxX &&
      this.x + this.w > l.minX &&
      this.y < l.maxY &&
      this.y + this.h > l.minY;
    return bate ? l : null;
  }

  moverX(dx) {
    if (!dx) return;
    const passos = Math.ceil(Math.abs(dx) / 3);
    const d = dx / passos;
    for (let i = 0; i < passos; i++) {
      this.x += d;
      for (const plat of this.plataformas) {
        const l = this._sobrepoe(plat);
        if (l) this.x = d > 0 ? l.minX - this.w : l.maxX;
      }
    }
  }

  moverY(dy) {
    if (!dy) return;
    const passos = Math.ceil(Math.abs(dy) / 3);
    const d = dy / passos;
    for (let i = 0; i < passos; i++) {
      this.y += d;
      for (const plat of this.plataformas) {
        const l = this._sobrepoe(plat);
        if (!l) continue;
        if (d > 0) {
          this.y = l.minY - this.h;
          this.noChao = true;
        } else {
          this.y = l.maxY;
        }
        this.velY = 0;
      }
    }
  }

  atualizar() {
    this.velY = Math.min(this.velY + this.gravidade, this.velTerminal);
    this.noChao = false;
    this.moverY(this.velY);
  }
}

class MeuJogo extends JS_CG_2D_API {
  acaoAoIniciar() {
    this.framesFire = {
      parado: this.carregarFrames("fireParado", 5, "parado"),
      correr: this.carregarFrames("fireCorrer", 5, "correr"),
      pular: this.carregarFrames("firePulando", 5, "pular"),
      cair: this.carregarFrames("fireCair", 5, "cair"),
    };
    this.imgDiamantes = carregarImagem("diamante/diamante_vermelho.png");
    this.imgPortaAberta = carregarImagem("images/porta_aberta.png");
    this.imgPortaFechada = carregarImagem("images/porta_fechada.png");
    this.imgAlavanca = carregarImagem("images/lever.png");
    this.imgPedra = carregarImagem("images/rock.png");
    this.imgBotaoVerde = carregarImagem("images/buttons/greenbtn.png");
    this.imgBotaoRoxo = carregarImagem("images/buttons/purplebtn.png");

    EfeitosSonoros.carregarSom("pulo", "sounds/jump.mp3");
    EfeitosSonoros.volumeSom("pulo", 0.45);
    EfeitosSonoros.carregarSom("morte", "sounds/death.mp3");
    EfeitosSonoros.volumeSom("morte", 1);
    EfeitosSonoros.carregarSom("porta", "sounds/door.mp3");
    EfeitosSonoros.volumeSom("porta", 1);
    EfeitosSonoros.carregarSom("alavanca", "sounds/lever-button.mp3");
    EfeitosSonoros.volumeSom("alavanca", 1);
    EfeitosSonoros.carregarSom("diamante", "sounds/gem.mp3");
    EfeitosSonoros.volumeSom("diamante", 0.55);

    this.teclas = {};
    // Se a janela perder o foco com uma tecla apertada, o herói não fica "andando sozinho".
    window.addEventListener("blur", () => {
      this.teclas = {};
    });
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
    this.plataformaMovelDestino = ELEVADOR_CIMA;
    this.pedraX = 500;
    this.pedraY = 176;
    this.pedraVelY = 0;
    this.pedraCaiu = false;
    this.pedraParou = false;
    this.pedraEmpurrada = false;
    this.motivoDerrota = "";

    this.plataformas = [
      new Retangulo2D(0, 628, 300, 22),
      new Retangulo2D(300, 641, 150, 9),
      new Retangulo2D(450, 628, 100, 22),
      new Retangulo2D(550, 641, 150, 9),
      new Retangulo2D(700, 628, 150, 22),
      new Retangulo2D(0, 542, 250, 22),
      new Retangulo2D(750, 563, 100, 65),
      new Retangulo2D(125, 455, 225, 22), // o vão à esquerda (x 25-125) é por onde o elevador sobe/desce
      new Retangulo2D(300, 477, 200, 22),
      new Retangulo2D(500, 490, 120, 9),
      new Retangulo2D(620, 477, 100, 22),
      new Retangulo2D(125, 347, 700, 22),
      new Retangulo2D(0, 173, 150, 87),
      new Retangulo2D(425, 238, 150, 22), // degrau do corredor de cima (antes 43px: não sobrava espaço para o herói passar)
      new Retangulo2D(0, 260, 725, 22),
      new Retangulo2D(225, 87, 100, 22),
      new Retangulo2D(325, 87, 100, 65),
      new Retangulo2D(325, 152, 525, 22),
      new Retangulo2D(0, 0, 25, 650),
      new Retangulo2D(825, 0, 25, 650),
      new Retangulo2D(0, 0, 850, 18),
    ];

    // Plataforma móvel acionada pela alavanca.
    // Elevador: em cima (y 347) fica alinhado com o piso de cima; embaixo (y 455) alinhado com o piso da alavanca.
    this.plataformaAlavanca = new Retangulo2D(25, ELEVADOR_CIMA, 100, 22);
    this.plataformaBotao = new Retangulo2D(725, 260, 100, 22);
    this.plataformas.push(this.plataformaAlavanca, this.plataformaBotao);

    this.heroi = new HeroiSolido(
      55,
      575,
      LARG_HEROI,
      ALT_HEROI,
      this.plataformas,
    );
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

    // A alavanca fica colada no elevador: dá para acioná-la de cima dele também.
    this.alavanca = { x: 135, y: 425, largura: 34, altura: 30 };
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

    this.moverHeroiX(movimento * VEL_ANDAR);

    if (pular && !this.puloSegurado && this.heroi.isNoChao()) {
      this.heroi.pular();
      EfeitosSonoros.tocarSom("pulo");
    }
    this.puloSegurado = !!pular;

    // Elevador da alavanca: sobe e desce (leva o Fireboy junto se ele estiver em cima).
    this.moverPlataforma(
      this.plataformaAlavanca,
      this.plataformaMovelDestino,
      VEL_ELEVADOR,
    );

    // A barra roxa desce até ficar alinhada com o piso (y 347), abrindo a passagem para o andar de cima.
    // (Se parasse em 325 o degrau de 22px não poderia ser vencido: só há 17px de folga até o teto.)
    if (this.botaoRoxoAtivo) {
      this.moverPlataforma(this.plataformaBotao, ELEVADOR_CIMA, 2);
    }

    this.heroi.setPlataformas(this.plataformas);
    this.heroi.atualizar();

    // Mantém o personagem dentro dos limites do cenário.
    this.heroi.x = Math.max(25, Math.min(825 - LARG_HEROI, this.heroi.x));

    // Pedra que cai ao ser alcançada, baseada no obstáculo do nível original.
    if (!this.pedraCaiu && this.heroi.x > 440 && this.heroi.y < 230) {
      this.pedraCaiu = true;
    }
    if (this.pedraCaiu && !this.pedraParou) {
      this.pedraVelY = Math.min(this.pedraVelY + 0.35, 8);
      this.pedraY += this.pedraVelY;
      // Para em cima da primeira plataforma que encontrar.
      for (const p of this.plataformas) {
        const sobrepoeX =
          this.pedraX + TAMANHO_PEDRA > p.x && this.pedraX < p.x + p.largura;
        if (
          sobrepoeX &&
          this.pedraY + TAMANHO_PEDRA >= p.y &&
          this.pedraY + TAMANHO_PEDRA - this.pedraVelY <= p.y + 1
        ) {
          this.pedraY = p.y - TAMANHO_PEDRA;
          this.pedraParou = true;
          break;
        }
      }
    }
    // A pedra só machuca enquanto está caindo.
    if (
      this.pedraCaiu &&
      !this.pedraParou &&
      !this.pedraEmpurrada &&
      this.colisao(this.heroi, {
        x: this.pedraX,
        y: this.pedraY,
        largura: TAMANHO_PEDRA,
        altura: TAMANHO_PEDRA,
      })
    ) {
      this.perder("Uma pedra atingiu o Fireboy!");
      return;
    }

    // Coleta dos cristais de fogo.
    for (const d of this.diamantes) {
      if (
        !d.coletado &&
        this.colisao(this.heroi, {
          x: d.x,
          y: d.y,
          largura: 26,
          altura: 28,
        })
      ) {
        d.coletado = true;
        this.coletados++;
        this.pontos += PONTOS_DIAMANTE;
        EfeitosSonoros.tocarSom("diamante");
      }
    }

    // Botões ativados ao pisar neles.
    if (!this.botaoRoxoAtivo && this.colisao(this.heroi, this.botaoRoxo)) {
      this.botaoRoxoAtivo = true;
      EfeitosSonoros.tocarSom("alavanca");
    }
    if (!this.botaoVerdeAtivo && this.colisao(this.heroi, this.botaoVerde)) {
      this.botaoVerdeAtivo = true;
      EfeitosSonoros.tocarSom("alavanca");
    }

    // A água e o poço verde eliminam o Fireboy. O rio de fogo é seguro.
    for (const rio of this.rios) {
      if (rio.tipo !== "fogo" && this.colisao(this.heroi, rio)) {
        this.perder(
          rio.tipo === "agua"
            ? "O Fireboy não pode tocar na água!"
            : "Você caiu em um poço mortal!",
        );
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

  moverHeroiX(dx) {
    if (!dx) return;

    const passos = Math.ceil(Math.abs(dx) / 3);
    const passo = dx / passos;
    for (let i = 0; i < passos; i++) {
      const xAnterior = this.heroi.x;
      this.heroi.moverX(passo);
      const deslocamento = this.heroi.x - xAnterior;

      if (
        !this.pedraCaiu ||
        !this.pedraParou ||
        !this.colisao(this.heroi, {
          x: this.pedraX,
          y: this.pedraY,
          largura: TAMANHO_PEDRA,
          altura: TAMANHO_PEDRA,
        })
      ) {
        continue;
      }

      const novaPedraX = this.pedraX + deslocamento;
      const bloqueada =
        novaPedraX < 25 ||
        novaPedraX + TAMANHO_PEDRA > 825 ||
        this.plataformas.some(
          (p) =>
            novaPedraX < p.x + p.largura &&
            novaPedraX + TAMANHO_PEDRA > p.x &&
            this.pedraY < p.y + p.altura &&
            this.pedraY + TAMANHO_PEDRA > p.y,
        );

      if (bloqueada) {
        this.heroi.x = xAnterior;
        break;
      }

      this.pedraX = novaPedraX;
      this.pedraEmpurrada = true;
      this.pedraParou = this.plataformas.some(
        (p) =>
          Math.abs(this.pedraY + TAMANHO_PEDRA - p.y) < 0.6 &&
          this.pedraX + TAMANHO_PEDRA > p.x &&
          this.pedraX < p.x + p.largura,
      );
    }
  }

  teclaPressionada(e) {
    const tecla = e.key.toLowerCase();
    this.teclas[tecla] = true;
    if (e.repeat) return;
    if (tecla === "f") this.telaCheia();
    if (tecla === "r") this.iniciarFase();
    if (tecla === "e" && this.estado === "jogando") {
      const perto = this.colisao(this.heroi, {
        x: this.alavanca.x - 45,
        y: this.alavanca.y - 28,
        largura: this.alavanca.largura + 90,
        altura: this.alavanca.altura + 56,
      });
      if (perto) {
        this.alavancaAtiva = !this.alavancaAtiva;
        this.plataformaMovelDestino = this.alavancaAtiva
          ? ELEVADOR_BAIXO
          : ELEVADOR_CIMA;
        EfeitosSonoros.tocarSom("alavanca");
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

  // Move uma plataforma em direção a "destinoY". Se o herói estiver em cima, ele vai junto;
  // se a plataforma fosse esmagá-lo, ela para (nunca deixa o herói preso dentro do bloco).
  moverPlataforma(plat, destinoY, velocidade) {
    if (plat.y === destinoY) return;
    const h = this.heroi;
    const dy =
      Math.sign(destinoY - plat.y) *
      Math.min(velocidade, Math.abs(destinoY - plat.y));
    const sobrepoeX = h.x + h.w > plat.x && h.x < plat.x + plat.largura;
    const emCima =
      sobrepoeX && h.isNoChao() && Math.abs(h.y + h.h - plat.y) < 0.6;
    const yPlat = plat.y;
    const yHeroi = h.y;

    plat.y += dy;
    if (emCima) h.y += dy;

    // O herói ficou encostado/dentro de alguma plataforma? Então desfaz o movimento.
    let esmagou = false;
    for (const p of this.plataformas) {
      if (p === plat && emCima) continue;
      if (
        h.x < p.x + p.largura &&
        h.x + h.w > p.x &&
        h.y < p.y + p.altura &&
        h.y + h.h > p.y
      ) {
        esmagou = true;
        break;
      }
    }
    if (esmagou) {
      plat.y = yPlat;
      h.y = yHeroi;
    }
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
      const cor =
        rio.tipo === "fogo"
          ? "#d83208"
          : rio.tipo === "agua"
            ? "#087ac2"
            : "#347d21";
      this.preenchimento(cor);
      this.retangulo(rio.x, rio.y, rio.largura, rio.altura, Estilo.PREENCHIDO);
    }
  }

  desenharObjetos() {
    for (const d of this.diamantes) {
      if (d.coletado) continue;
      const flutua = Math.sin(this.quadro * 0.08 + d.x) * 3;
      if (this.imgDiamantes.complete && this.imgDiamantes.naturalWidth > 0) {
        this.gc.drawImage(
          this.imgDiamantes,
          d.x,
          d.y + flutua,
          30,
          27,
        );
      } else {
        this.preenchimento("#ff3328");
        this.triangulo(
          d.x + 15,
          d.y + flutua,
          d.x + 29,
          d.y + 13 + flutua,
          d.x + 15,
          d.y + 27 + flutua,
          Estilo.PREENCHIDO,
        );
      }
    }

    // Alavanca original do pacote.
    if (this.imgAlavanca.complete && this.imgAlavanca.naturalWidth > 0) {
      this.imagem(this.imgAlavanca, this.alavanca.x, this.alavanca.y, 42, 30);
    } else {
      this.preenchimento(this.alavancaAtiva ? "#ffcc45" : "#9b9b9b");
      this.retangulo(
        this.alavanca.x,
        this.alavanca.y,
        8,
        30,
        Estilo.PREENCHIDO,
      );
    }

    this.desenharBotao(
      this.botaoRoxo,
      this.botaoRoxoAtivo,
      this.imgBotaoRoxo,
      "#9d58ce",
    );
    this.desenharBotao(
      this.botaoVerde,
      this.botaoVerdeAtivo,
      this.imgBotaoVerde,
      "#58b94d",
    );

    // Porta de fogo no destino.
    const imagemPorta = this.portaAberta
      ? this.imgPortaAberta
      : this.imgPortaFechada;
    this.preenchimento("#282313");
    this.retangulo(
      this.porta.x - 5,
      this.porta.y - 4,
      this.porta.largura + 10,
      this.porta.altura + 8,
      Estilo.PREENCHIDO,
    );
    if (imagemPorta.complete && imagemPorta.naturalWidth > 0) {
      this.gc.drawImage(
        imagemPorta,
        this.porta.x - 5,
        this.porta.y - 4,
        this.porta.largura + 10,
        this.porta.altura + 8,
      );
    } else {
      this.preenchimento("#9a3a16");
      this.retangulo(this.porta, Estilo.PREENCHIDO);
    }

    // Pedra do primeiro nível.
    if (this.pedraCaiu) {
      if (this.imgPedra.complete && this.imgPedra.naturalWidth > 0) {
        this.imagem(
          this.imgPedra,
          this.pedraX,
          this.pedraY,
          TAMANHO_PEDRA,
          TAMANHO_PEDRA,
        );
      } else {
        this.preenchimento("#777777");
        this.circulo(
          this.pedraX,
          this.pedraY,
          TAMANHO_PEDRA,
          TAMANHO_PEDRA,
          Estilo.PREENCHIDO,
        );
      }
    }

    this.preenchimento("#e6d38a");
    this.texto("E", this.alavanca.x + 14, this.alavanca.y - 7, 15, "bold");
  }

  desenharBotao(b, ativo, imagem, cor) {
    this.preenchimento("#242414");
    this.retangulo(b.x - 4, b.y + 8, b.largura + 8, 8, Estilo.PREENCHIDO);
    if (imagem.complete && imagem.naturalWidth > 0) {
      const altura = ativo ? b.altura - 5 : imagem.naturalHeight;
      this.gc.drawImage(
        imagem,
        b.x + (b.largura - imagem.naturalWidth) / 2,
        b.y + b.altura - altura,
        imagem.naturalWidth,
        altura,
      );
      return;
    }

    this.preenchimento(ativo ? "#d7e99b" : cor);
    this.retangulo(
      b.x,
      b.y + (ativo ? 5 : 0),
      b.largura,
      b.altura - (ativo ? 5 : 0),
      Estilo.PREENCHIDO,
    );
    this.contorno(2, "#292515");
    this.retangulo(b.x, b.y, b.largura, b.altura, Estilo.LINHAS);
  }

  desenharPersonagem() {
    const x = this.heroi.x;
    const y = this.heroi.y;
    const esquerda = this.teclas.arrowleft || this.teclas.a;
    const direita = this.teclas.arrowright || this.teclas.d;
    const andando = esquerda !== direita;
    const noAr = !this.heroi.isNoChao();
    const frames = noAr
      ? this.heroi.velY < 0
        ? this.framesFire.pular
        : this.framesFire.cair
      : andando
        ? this.framesFire.correr
        : this.framesFire.parado;
    const intervalo = frames === this.framesFire.parado ? 12 : 7;
    const frame = frames[Math.floor(this.quadro / intervalo) % frames.length];
    if (!frame.complete || frame.naturalWidth === 0) return;

    const escala = 64 / 338;
    const largura = frame.naturalWidth * escala;
    const altura = frame.naturalHeight * escala;
    const desenhoX = x + (LARG_HEROI - largura) / 2;
    const desenhoY = y + ALT_HEROI - altura;

    this.empilhar();
    if (this.direcao < 0) {
      this.transladar(x * 2 + LARG_HEROI, 0);
      this.escalar(-1, 1);
    }
    this.gc.drawImage(frame, desenhoX, desenhoY, largura, altura);
    if (noAr) {
      this.preenchimento("rgba(255, 120, 20, 0.18)");
      this.circulo(x - 2, y + 2, 38, 46, Estilo.PREENCHIDO);
    }
    this.desempilhar();
  }

  desenharHUD() {
    this.preenchimento("rgba(12, 12, 5, 0.82)");
    this.retangulo(12, 10, 230, 65, Estilo.PREENCHIDO);
    this.preenchimento("#fff1c0");
    this.texto("FIREBOY - TEMPLO", 24, 32, 17, "bold");
    this.texto(
      `Cristais: ${this.coletados}/${this.totalDiamantes}`,
      24,
      57,
      18,
    );

    this.preenchimento("rgba(12, 12, 5, 0.82)");
    this.retangulo(710, 10, 128, 42, Estilo.PREENCHIDO);
    this.preenchimento(this.tempo <= 20 ? "#ff6b3d" : "#fff1c0");
    this.texto(`TEMPO: ${this.tempo}`, 722, 38, 19, "bold");

    if (this.quadro < 600) {
      this.preenchimento("rgba(0, 0, 0, 0.65)");
      this.retangulo(185, 605, 480, 32, Estilo.PREENCHIDO);
      this.preenchimento("#fff1c0");
      this.gc.textAlign = "center";
      this.texto(
        "A/D ou ←/→: mover   W/↑/ESPAÇO: pular   E: alavanca   R: reiniciar",
        425,
        627,
        14,
      );
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
    this.texto(
      this.estado === "vitoria" ? "FASE CONCLUÍDA!" : "FIM DE JOGO",
      425,
      250,
      39,
      "bold",
    );
    this.preenchimento("#ffffff");
    if (this.estado === "vitoria") {
      this.texto("Você encontrou a saída do templo!", 425, 300, 21);
    } else {
      this.texto(this.motivoDerrota, 425, 300, 20);
    }
    this.texto(
      `Cristais: ${this.coletados}/${this.totalDiamantes}`,
      425,
      345,
      22,
    );
    this.texto(`Pontuação: ${this.pontos}`, 425, 378, 22, "bold");
    this.preenchimento("#ffe17a");
    this.texto(
      "Pressione ENTER, ESPAÇO ou clique para jogar novamente",
      425,
      420,
      17,
    );
    this.gc.textAlign = "left";
  }
}

window.addEventListener("load", () => {
  new MeuJogo("Fireboy - Templo", "meuCanvas", LARG_TELA, ALT_TELA, 60);
});
