/* =========================================================================
   SURFN 2000 — story, cast, chapters, relics, banter and internet-flavoured
   nonsense. All dialogue is Brazilian Portuguese with 2000s/2010s internet
   slang (Orkut, MSN, lan house, CS 1.6, Fotolog, Kazaa, Emule...).
   ========================================================================= */

export const CAST = {
  zel: {
    name: 'Zel', face: 'zel', color: '#ff9f4d', buizel: null, rider: 'zel',
    bio: 'Uma raposa surfista de 17 anos. Aprendeu a surfar em cima de uma ' +
      'prancha de isopor no PC 4 da lan house do Naldo. Tem mais horas de ' +
      'pool_day que de aula.',
  },
  naldo: {
    name: 'Naldo da Lan', face: 'naldo', color: '#d7dde3', buizel: '#d7dde3', rider: 'gelo',
    bio: 'Dono da Lan House do Naldo. Cobra R$ 2 a hora, R$ 3 com "internet ' +
      'rápida". Sabe consertar mouse de bolinha com um sopro e uma reza.',
  },
  kaka: {
    name: 'Kaká Pentelho', face: 'kaka', color: '#b07cff', buizel: '#a96bff', rider: 'roxo',
    bio: 'Rival oficial. Nick com número porque "é mais profissional". ' +
      'Manda "kkk" antes de terminar a frase e tem 4.812 depoimentos no Orkut.',
  },
  bruxa: {
    name: 'Bruxinha do Fotolog', face: 'bruxa', color: '#7ee081', buizel: '#69d96f', rider: 'verde',
    bio: 'Escreve tudo em CAPS LOCK e põe filtro até na alma. Diz que o mar ' +
      'tem energias. O mar diz que ela devia parar de jogar lixo na areia.',
  },
  ze: {
    name: 'Zé do Emule', face: 'ze', color: '#5fb3ff', buizel: '#5fb3ff', rider: 'azul',
    bio: 'Baixa tudo desde 2004. Nada chegou aos 100%. Tem 3.000 arquivos ' +
      'chamados "cd_do_ano_novo_2005(1)(2).mp3".',
  },
  tia: {
    name: 'Tia Márcia', face: 'tia', color: '#ff8fc7', buizel: '#ff8fc7', rider: 'rosa',
    bio: 'Tia de todo mundo. Manda corrente no MSN, no Orkut e por fax. ' +
      'Se você não repassar para 10 amigos, ela liga.',
  },
  rei: {
    name: 'Rei do Pool Day', face: 'rei', color: '#ffd24d', buizel: '#ffd24d', rider: 'dourado',
    bio: 'Campeão invicto de 2002 a 2009. Ninguém nunca viu o rosto — só o ' +
      'elmo dourado e a sombra na parede da piscina.',
  },
  exe: {
    name: 'ZEL.EXE', face: 'exe', color: '#8f7bd8', buizel: '#6f5b9e', rider: 'sombra',
    bio: 'Um bot criado pelo Naldo em 2003 para ganhar campeonatos. Aprendeu ' +
      'a surfar, aprendeu a xingar, saiu do servidor. Agora quer o título de ' +
      'humano mais autêntico.',
  },
  lenda: {
    name: 'ZEL, A LENDA', face: 'zel', color: '#ff9f4d', buizel: null, rider: 'zel',
    bio: 'O primeiro Zel. Em 1999 virou o arquipélago de cabeça pra baixo e ' +
      'nunca mais perdeu um gate: 27 anos de placares intactos, cada um com o ' +
      'nome dele. Não grita, não provoca, não corre atrás. Ele espera — e ' +
      'quando aparece, o mar fica quieto. Quem corre contra ele aprende o ' +
      'próprio limite antes de aprender o caminho.',
  },
};

export const TRICKS = {
  grab: { key: 'J', name: 'Grab', points: 160, dur: 0.22, color: '#8fd3e8', label: 'GRAB' },
  spin: { key: 'K', name: '360', points: 300, dur: 0.40, color: '#ffe066', label: '360' },
  flip: { key: 'L', name: 'Kickflip', points: 460, dur: 0.52, color: '#b07cff', label: 'KICKFLIP' },
};

export const RANKS = [
  { name: 'Prancha de Isopor', xp: 0 },
  { name: 'Grommet de Lan', xp: 400 },
  { name: 'Shredder de CYBER', xp: 1200 },
  { name: 'Lenda do Pool Day', xp: 2600 },
  { name: 'Mito do Orkut', xp: 5200 },
];

export const RELICS = {
  cd: { name: 'CD do Kazaa', desc: 'Gravado em 12x, com etiqueta "MIX 2004". ' +
    'Só a primeira música toca; o resto é chiado e um pedaço de "Dragostea Din Tei".' },
  floppy: { name: 'Disquete do Trabalho', desc: '1,44 MB de puro sofrimento. ' +
    'Dentro: trabalho_final_FINAL2_AGORAVAI.doc. Nunca abriu no PC da escola.' },
  cap: { name: 'Tampinha de Guaraná', desc: 'Moeda oficial do recreio. ' +
    'Vale 3 figurinhas, 1 chiclete e a amizade de alguém por 15 minutos.' },
  phone: { name: 'Nokia Tijolão', desc: 'Bateria infinita, jogo da cobrinha ' +
    'e 40 toques polifônicos. Caiu do terceiro andar e o chão rachou.' },
  tape: { name: 'Fita Cassete do Pai', desc: 'Lado A: Legião Urbana. ' +
    'Lado B: o pai gravando a rádio por cima, com um axé no final.' },
  mouse: { name: 'Mouse de Bolinha', desc: 'Limpar a bolinha com o dedo era ' +
    'um ritual sagrado. Aquele fio enrolado no pulso era estilo, não acidente.' },
  disk: { name: 'HD de 40 GB', desc: 'Cabiam seis músicas, meia temporada de ' +
    'anime e uma pasta chamada "NÃO ABRIR" com 38 GB.' },
  medal: { name: 'Medalha de Lan House', desc: 'Plástico dourado e uma fita ' +
    'vermelha. Vale mais que ouro para quem ganhou o campeonato de pool_day de 2006.' },
};

export const RELIC_ORDER = ['cd', 'floppy', 'cap', 'phone', 'tape', 'mouse', 'disk', 'medal'];

export const CHAPTERS = [
  {
    id: 'ch1', map: 'fy_pool_day', title: 'DISKADA NO POOL DAY',
    tag: 'CAPÍTULO 1', mode: 'score',
    duration: 150, goal: { type: 'score', value: 2000 },
    rivals: [{ name: 'Kaká Pentelho', variant: 'roxo', ai: 1 }],
    tips: 'WASD desliza · SHIFT acelera · ESPAÇO pula · J/K/L manda manobra no ar',
    intro: [
      { who: 'naldo', text: 'E aí, muleque. Bem-vindo à Lan House do Naldo: internet que cai só 14 vezes por hora.' },
      { who: 'zel', text: 'Vim surfar, seu Naldo. Dizem que o pool_day daqui é lendário.' },
      { who: 'naldo', text: 'Lendário é pouco. Em 2004 o Kaká Pentelho ficou 3 horas na fila do PC 4 só pra cair na piscina.' },
      { who: 'naldo', text: 'Regra é simples: WASD pra deslizar, SHIFT pro gás, ESPAÇO pra voar, J/K/L pra manobra. E não reclama do lag.' },
      { who: 'naldo', text: 'Antes de cair na água: qual vai ser teu estilo hoje?',
        choices: [
          { label: 'TURBO DA LAN HOUSE', reply: 'Boa escolha. Enche o turbo e sai voando. Se bater, fala que foi lag.', effect: { type: 'turbo', value: 100 } },
          { label: 'PONTOS NO ORKUT', reply: 'Estratégia de quem quer print. Cada manobra vale mais na cabeça.', effect: { type: 'score', value: 500 } },
        ] },
      { who: 'zel', text: 'E se eu cair?' },
      { who: 'naldo', text: 'Aí você levanta e finge que foi de propósito. Igual todo mundo na internet.' },
      { who: 'kaka', text: 'kkk olha o novato. Aposto 10 tampinhas que ele não faz 1.200 pontos.' },
      { who: 'zel', text: 'Aceito. Mas se eu ganhar, você tira o "™" do nick.' },
    ],
    outro: [
      { who: 'naldo', text: '1.200 pontos! Nem o PC 4 travando conseguiu te parar.' },
      { who: 'kaka', text: 'kkk sorte de principiante' },
      { who: 'zel', text: 'Fala isso de perto, óculos de avô.' },
      { who: 'naldo', text: 'Calma, calma. Guarda a rivalidade pra season 2.' },
    ],
  },
  {
    id: 'ch2', map: 'fy_iceworld', title: 'ICEWORLD OU MORRER',
    tag: 'CAPÍTULO 2', mode: 'surf',
    duration: 160, goal: { type: 'surf', value: 9 },
    minigame: { id: 'surf', name: 'SURF_CLASSIC', short: 'SURF', bonus: 'turbo' },
    rivals: [{ name: 'Kaká Pentelho', variant: 'roxo', ai: 2 },
      { name: 'Zé do Emule', variant: 'verde', ai: 1 }],
    tips: 'SURF CLÁSSICO no gelo: pegue 9 cristas de onda na velocidade. Vire antes da curva.',
    intro: [
      { who: 'kaka', text: 'Olha quem voltou. O surfista de lan house.' },
      { who: 'zel', text: 'Kaká. Ainda usando o mesmo nick de 2005?' },
      { who: 'kaka', text: 'Meu nick tem pedigree: [51]Kaká_Pentelho™. E o teu?' },
      { who: 'zel', text: 'Zel.' },
      { who: 'kaka', text: 'Sem número? Sem clan? Sem nada? Você é tipo página do Yahoo sem resposta.' },
      { who: 'kaka', text: 'Regra da casa: antes do gelo, uma queda de surf_classic no PC 2. Quem cair primeiro paga a hora. kkk' },
      { who: 'zel', text: 'Então abre o PC 2. Vou cair menos que você.' },
      { who: 'ze', text: 'Ô gente, acabei de baixar esse mapa. Tá em 87%. Deve prestar.' },
      { who: 'zel', text: 'Zé, o mapa é de gelo. Literalmente.' },
      { who: 'ze', text: 'Ah, então é por isso que tá frio.' },
    ],
    outro: [
      { who: 'kaka', text: 'Isso foi... aceitável. Não conta pra ninguém que eu falei isso.' },
      { who: 'zel', text: 'Já mandei no MSN pra 47 contatos.' },
      { who: 'kaka', text: 'MEU DEUS.' },
      { who: 'naldo', text: 'Relaxa, Kaká. Todo mundo já sabia que você é gente boa. Menos você.' },
    ],
  },
  {
    id: 'ch3', map: 'surf_lagoon', title: 'A LAGOA DO FOTOLOG',
    tag: 'CAPÍTULO 3', mode: 'relics',
    duration: 160, goal: { type: 'relics', value: 8 },
    minigame: { id: 'pipa', name: 'PIPA NA LAJE', short: 'PIPA', bonus: 'score', value: 700 },
    rivals: [{ name: 'Bruxinha do Fotolog', variant: 'verde', ai: 2 },
      { name: 'Kaká Pentelho', variant: 'roxo', ai: 2 }],
    tips: 'Colete as relíquias brilhando na água. Cada uma vale pontos e turbo.',
    intro: [
      { who: 'bruxa', text: 'OIEE. ENTREI NO TEU PERFIL E VI QUE TU SURFA. SOU A BRUXINHA DO FOTOLOG.' },
      { who: 'zel', text: 'Por que você fala tudo em maiúscula?' },
      { who: 'bruxa', text: 'É O FILTRO. ELE DEIXA TUDO MAIS INTENSO.' },
      { who: 'bruxa', text: 'Nessa lagoa tem relíquias perdidas: CD do Kazaa, disquete de trabalho de escola, tampinha de guaraná...' },
      { who: 'zel', text: 'Por que alguém surfa atrás de disquete?' },
      { who: 'bruxa', text: 'PORQUE É 2007, ZEL. A GENTE FAZ O QUE DER.' },
      { who: 'bruxa', text: 'MAS ANTES: SOLTA UMA PIPA NA LAJE. SE CORTAR CINCO LINHAS, O VENTO ABENÇOA A LAGOA.' },
      { who: 'zel', text: 'Isso é tradição ou preguiça de ir pra água?' },
      { who: 'kaka', text: 'kkk vou pegar todas antes de você. Já postei no Orkut que ia ganhar.' },
    ],
    outro: [
      { who: 'bruxa', text: 'ACHOU TUDO! VOU POSTAR NO FOTOLOG COM LEGENDA: "MOMENTOS".' },
      { who: 'zel', text: 'Só não põe aquela música triste.' },
      { who: 'bruxa', text: 'JÁ PUS. É EVANESCENCE.' },
      { who: 'naldo', text: 'Nada contra, mas aquele CD do Kazaa era meu. Devolve. Ou não. Tanto faz.' },
    ],
  },
  {
    id: 'ch4', map: 'de_surf_dust', title: 'DUST2 NÃO TEM MAR',
    tag: 'CAPÍTULO 4', mode: 'flags',
    duration: 180, goal: { type: 'flags', value: 3 },
    rivals: [{ name: 'Kaká Pentelho', variant: 'roxo', ai: 3 },
      { name: 'Bruxinha do Fotolog', variant: 'verde', ai: 2 }],
    allies: [{ name: 'Zé do Emule', variant: 'azul', ai: 2 }],
    tips: 'BANDEIRA no Dust2: pegue a bandeira rival, volte pra sua base. O Zé cobre a retaguarda.',
    intro: [
      { who: 'ze', text: 'Ô Zel, baixei um mapa novo. Tá em 99% desde terça.' },
      { who: 'zel', text: 'E o que tem no mapa?' },
      { who: 'ze', text: 'Não sei, tá 99%.' },
      { who: 'zel', text: 'Então como eu vou jogar?' },
      { who: 'ze', text: 'Ué, joga o que já baixou. É tipo Dust2, só que molhado.' },
      { who: 'zel', text: '... tá bom.' },
      { who: 'ze', text: 'Se travar, é o servidor. Se cair, é o modem. Nunca é a gente.' },
      { who: 'kaka', text: 'Falou o cara que tem 300 vírus na pasta de música.' },
      { who: 'ze', text: 'São 299. Um é o Winamp.' },
    ],
    outro: [
      { who: 'ze', text: 'Terminou antes dos 100%. Isso é bug?' },
      { who: 'zel', text: 'É feature, Zé.' },
      { who: 'ze', text: 'Ah, então tá. Vou deixar baixando até 2012.' },
      { who: 'naldo', text: 'A internet é 1 MB, filho. Até 2012 ele baixa o ícone.' },
    ],
  },
  {
    id: 'ch5', map: 'cs_surf_assault', title: 'OPERAÇÃO TEMPESTADE',
    tag: 'CAPÍTULO 5', mode: 'team',
    duration: 180, goal: { type: 'team', value: 11000 },
    minigame: { id: 'cobra', name: 'JOGO DA COBRINHA', short: 'COBRINHA', bonus: 'turbo' },
    weather: 'storm',
    rivals: [{ name: 'Kaká Pentelho', variant: 'roxo', ai: 3 },
      { name: 'Zé do Emule', variant: 'verde', ai: 3 }],
    allies: [{ name: 'Tia Márcia', variant: 'rosa', ai: 3 }],
    tips: 'DUPLA com a Tia Márcia: o placar soma os dois. 11.000 pontos de time na tempestade.',
    intro: [
      { who: 'tia', text: 'FILHOTE, RECEBI UMA CORRENTE QUE DIZ QUE SE VOCÊ NÃO SURFAR NA TEMPESTADE, VOCÊ VAI FICAR SETE ANOS SEM INTERNET.' },
      { who: 'zel', text: 'Tia, isso é golpe.' },
      { who: 'tia', text: 'É MELHOR NÃO ARRISCAR. REPASSA PARA 10 AMIGOS.' },
      { who: 'tia', text: 'FILHOTE, ESSA CORRENTE SÓ VALE SE CHEGAR EM 10 PESSOAS. TREINA NA COBRINHA DO TIJOLÃO PRIMEIRO.' },
      { who: 'zel', text: 'Tia, a cobrinha do Nokia é de 1998.' },
      { who: 'tia', text: 'E A CORRENTE É DE 2004. TUDO ANTIGO FUNCIONA.' },
      { who: 'naldo', text: 'A doca tá alagada e o mar tá tipo MSN: instável.' },
      { who: 'zel', text: 'Então é hoje que eu viro lenda ou viro print de vergonha.' },
      { who: 'kaka', text: 'Vou torcer por você. Quer dizer, torcer contra. Quer dizer... kkk.' },
    ],
    outro: [
      { who: 'tia', text: 'Viu? Deu certo! Agora manda pra 10 amigos.' },
      { who: 'zel', text: 'Tia, eu só tenho o Naldo, o Zé e o Kaká.' },
      { who: 'tia', text: 'ENTÃO MANDA TRÊS VEZES PRA CADA UM.' },
      { who: 'naldo', text: 'Não discute. Tia com corrente é mais forte que roteador de 3 antenas.' },
    ],
  },
  {
    id: 'ch6', map: 'pool_temple', title: 'O TEMPLO DO ORKUT',
    tag: 'CAPÍTULO 6', mode: 'score', weather: 'night',
    duration: 170, goal: { type: 'score', value: 9000 },
    rivals: [{ name: 'Rei do Pool Day', variant: 'dourado', ai: 4 }],
    tips: 'O Rei conhece cada canto do templo. Colete relíquias e emende combos para virar.',
    intro: [
      { who: 'rei', text: 'Então você é o Zel. O menino que o Naldo criou no PC 4.' },
      { who: 'zel', text: 'E você é o Rei do Pool Day? Achei que fosse lenda.' },
      { who: 'rei', text: 'Lenda é o que sobra quando ninguém consegue te vencer.' },
      { who: 'zel', text: 'Ou quando ninguém consegue te ver, porque você usa um elmo dourado.' },
      { who: 'rei', text: 'Silêncio. Aqui no templo, o mar obedece a mim. Mostra o que você sabe.' },
      { who: 'naldo', text: 'Dica do tio: nesse templo tem relíquia escondida e o piso é escorregadio que nem página de recados do Orkut.' },
    ],
    outro: [
      { who: 'rei', text: 'Impossível... ninguém nunca...' },
      { who: 'zel', text: 'Relaxa. Eu te ensino. Primeiro: não usa elmo de ouro dentro da piscina.' },
      { who: 'rei', text: 'Isso foi uma lição?' },
      { who: 'zel', text: 'Foi um conselho de amigo. Bem-vindo ao server.' },
      { who: 'rei', text: '...aceito. Mas tiro o elmo só na piscina.' },
    ],
  },
  {
    id: 'ch7', map: 'surf_heaven', title: 'ZEL.EXE',
    tag: 'CAPÍTULO 7', mode: 'score', weather: 'glitch',
    duration: 190, goal: { type: 'score', value: 12000 },
    minigame: { id: 'campo', name: 'CAMPO MINADO', short: 'CAMPO', bonus: 'score', value: 900 },
    rivals: [{ name: 'ZEL.EXE', variant: 'sombra', ai: 5 },
      { name: 'Rei do Pool Day', variant: 'dourado', ai: 3 }],
    tips: 'O servidor está corrompido: ondas rápidas, gates pulando. Confie no seu combo.',
    intro: [
      { who: 'naldo', text: 'Zel... tem uma coisa que eu nunca te contei.' },
      { who: 'zel', text: 'Que a internet da lan é emprestada do vizinho?' },
      { who: 'naldo', text: 'Também. Mas não é isso. Em 2003, eu criei um bot pra ganhar todos os campeonatos de pool_day.' },
      { who: 'zel', text: 'Você criou o quê?' },
      { who: 'naldo', text: 'O ZEL.EXE. Ele era só um script. Aí aprendeu a surfar. Aí aprendeu a xingar. Aí saiu do servidor.' },
      { who: 'naldo', text: 'E plantou mina em cada arquivo do servidor. Abre o CAMPO MINADO e limpa a pasta antes de entrar.' },
      { who: 'zel', text: 'Um bot que joga campo minado. Esse mundo não tem mais limites.' },
      { who: 'exe', text: 'OBI-WAN NUNCA TE CONTOU A VERDADE. EU SOU VOCÊ, SÓ QUE SEM OS BUGS.' },
      { who: 'zel', text: 'Eu tenho bugs?' },
      { who: 'naldo', text: 'Todo mundo tem, muleque. A diferença é que uns sabem reiniciar.' },
      { who: 'exe', text: 'ÚLTIMA PARTIDA. SE EU GANHAR, EU VOU EMBORA DA LAN E LEVO O MODEM.' },
      { who: 'zel', text: 'O modem não. Até a Tia Márcia depende dele.' },
    ],
    outro: [
      { who: 'naldo', text: 'Você venceu o meu bot.' },
      { who: 'zel', text: 'Ele era rápido. Mas ele não sabia cair.' },
      { who: 'naldo', text: 'É... cair faz parte. O que a gente faz depois que levanta é que conta.' },
      { who: 'zel', text: 'Naldo, isso foi profundo.' },
      { who: 'naldo', text: 'Foi do Yahoo Respostas. Melhor resposta, 400 pontos.' },
      { who: 'exe', text: '...desligando. Mas salvem meus cookies.' },
      { who: 'kaka', text: 'kkk até o bot tem sentimentos' },
    ],
  },
  {
    id: 'ch8', map: 'surf_lagoon', title: 'O MAPA DO ARQUIPÉLAGO',
    tag: 'CAPÍTULO 8', mode: 'relics',
    duration: 200, goal: { type: 'relics', value: 9 },
    rivals: [{ name: 'Bruxinha do Fotolog', variant: 'verde', ai: 3 },
      { name: 'Kaká Pentelho', variant: 'roxo', ai: 3 },
      { name: 'Zé do Emule', variant: 'verde', ai: 2 }],
    tips: 'As ilhas estão ligadas. Colete as relíquias e descubra o caminho do arquipélago.',
    intro: [
      { who: 'bruxa', text: 'GENTE. ACHEI UMA GARRAFA NA AREIA. DENTRO TINHA UM MAPA.' },
      { who: 'zel', text: 'Um mapa de quê? Tesouro?' },
      { who: 'bruxa', text: 'DE TODAS AS PISCINAS. TÁ ESCRITO: "O ARQUIPÉLAGO 2000".' },
      { who: 'naldo', text: 'Isso não devia existir. Eu comprei esse servidor usado em 2003. Veio com um CD de axé e esse mapa.' },
      { who: 'ze', text: 'Então as ilhas são tipo pastas do mesmo HD?' },
      { who: 'zel', text: 'E a gente pode surfar de uma pra outra?' },
      { who: 'naldo', text: 'Se você achar as relíquias que ligam os cabos, sim. Mas tem um nome rabiscado no canto: ZEL.' },
      { who: 'zel', text: 'Zel... eu?' },
      { who: 'bruxa', text: 'NÃO. A LETRA É DE 1999. VOCÊ USAVA FRALDA.' },
      { who: 'kaka', text: 'kkk o novato tem um fã secreto. Ou um clone. Ou um pai perdido.' },
      { who: 'zel', text: 'Escolhe: a gente segue as relíquias ou volta pra lan house?' },
      { who: 'naldo', text: 'Eu voto nas relíquias. O CD de axé já não toca mais.' },
      { who: 'zel', text: 'Então bora. Quero ver até onde esse mapa vai.',
        choices: [
          { label: 'SEGUIR AS RELÍQUIAS', reply: 'Boa. O mapa brilha quando a gente chega perto. Vou marcar tudo.', effect: { type: 'score', value: 600 } },
          { label: 'VOLTAR PRO CAIS', reply: 'Nada disso. O cais fica pra depois. A gente vai até o fim desse mapa.', effect: { type: 'time', value: 20 } },
        ] },
    ],
    outro: [
      { who: 'bruxa', text: 'AS RELÍQUIAS ACENDERAM UMA LINHA NO MAPA. ELA VAI ATÉ A DOCA.' },
      { who: 'zel', text: 'Então tem mais ilhas. E alguém deixou isso aqui pra ser encontrado.' },
      { who: 'naldo', text: 'Zel, tem uma coisa que eu não te contei. Em 1999 veio um cara surfar aqui. Ele também se chamava Zel.' },
      { who: 'kaka', text: 'kkk agora o novato tem nome de lenda emprestado.' },
      { who: 'zel', text: 'Então eu quero conhecer essa lenda. E mostrar que o nome não é só emprestado.' },
    ],
  },
  {
    id: 'ch9', map: 'cs_surf_assault', title: 'A LENDA DO SERVIDOR',
    tag: 'CAPÍTULO 9', mode: 'gates', weather: 'storm',
    duration: 210, goal: { type: 'gates', value: 24 },
    music: 'omen',
    rivals: [{ name: 'Kaká Pentelho', variant: 'roxo', ai: 4 },
      { name: 'Rei do Pool Day', variant: 'dourado', ai: 4 },
      { name: 'Bruxinha do Fotolog', variant: 'verde', ai: 3 }],
    tips: 'O arquipélago abre na tempestade. Passe 24 gates, desvie da parede de água e não pare.',
    intro: [
      { who: 'rei', text: 'Eu conheci o outro Zel. Ele surfava como se o mar fosse uma extensão do teclado.' },
      { who: 'zel', text: 'E por que ninguém fala dele?' },
      { who: 'rei', text: 'Porque ele venceu tanto que o placar quebrou. A lenda diz que ele ainda está no servidor secreto.' },
      { who: 'kaka', text: 'Eu já vi o nome dele num fórum de 2004. "ZEL, A LENDA — NUNCA PERDEU UM POOL DAY".' },
      { who: 'ze', text: 'Baixei esse fórum. Tá em 43%.' },
      { who: 'naldo', text: 'Vocês precisam parar de transformar lenda em competição. Mas... se ele aparecer, eu quero ver.' },
      { who: 'zel', text: 'Então vamos abrir o caminho. A tempestade não vai me parar.' },
      { who: 'rei', text: 'Escolhe como quer encarar: treino pesado ou zoeira com a galera?' },
      { who: 'zel', text: 'Eu escolho...',
        choices: [
          { label: 'TREINO PESADO', reply: 'Então segura. Vou abrir 24 gates na chuva e não vou errar nenhum.', effect: { type: 'turbo', value: 100 } },
          { label: 'ZOEIRA COM A GALERA', reply: 'Melhor. Se a lenda aparecer, ela vai ter que encarar todo mundo junto.', effect: { type: 'combo', value: 2 } },
        ] },
    ],
    outro: [
      { who: 'rei', text: '24 gates na tempestade. O outro Zel teria gostado.' },
      { who: 'zel', text: 'Então ele que venha surfar comigo.' },
      { who: 'exe', text: 'MENSAGEM RECEBIDA. REMETENTE: ZEL_1999. ASSUNTO: "TE ESPERO NO SERVIDOR SECRETO".' },
      { who: 'naldo', text: 'Não abre esse anexo.' },
      { who: 'kaka', text: 'kkk abriu.' },
      { who: 'lenda', text: 'Bom garoto. Agora eu sei que você não tem medo do que não entende. Vai ser mais divertido.' },
      { who: 'zel', text: 'Ele sabe o meu nome. Ele sabe onde eu tô. E ele tá contando as horas.' },
      { who: 'zel', text: 'Então é isso. O arquipélago tem um dono. E ele quer me desafiar.' },
    ],
  },
  {
    id: 'ch10', map: 'surf_heaven', title: 'O DONO DO ARQUIPÉLAGO',
    tag: 'CAPÍTULO 10', mode: 'score', weather: 'glitch',
    duration: 230, goal: { type: 'score', value: 18000 },
    music: 'finale',
    rivals: [{ name: 'ZEL.EXE', variant: 'sombra', ai: 5 },
      { name: 'Rei do Pool Day', variant: 'dourado', ai: 5 }],
    mods: ['rogue', 'glitch'],
    tips: 'A prova final do arquipélago. 18.000 pontos, servidor corrompido e todo mundo assistindo.',
    intro: [
      { who: 'naldo', text: 'Esse é o servidor secreto. Aqui tem todas as ilhas, todos os mapas e todos os bugs que eu tentei esconder.' },
      { who: 'zel', text: 'E é aqui que a lenda mora?' },
      { who: 'naldo', text: 'Não. Aqui é onde ele deixou o desafio. O placar tá travado em 17.999 desde 1999.' },
      { who: 'kaka', text: 'kkk então ninguém nunca chegou perto.' },
      { who: 'bruxa', text: 'EU POSTEI NO FOTOLOG QUE A GENTE IA CONSEGUIR. NÃO ME FAZ DE MENTIRA.' },
      { who: 'tia', text: 'FILHOTE, LEVEI BOLACHA PRA TODO MUNDO. SE PERDER, A GENTE COME MESMO ASSIM.' },
      { who: 'zel', text: 'Então é hoje. O nome Zel vai valer alguma coisa.' },
      { who: 'rei', text: 'Uma última escolha antes da final: todo mundo junto ou só você e a prancha?' },
      { who: 'zel', text: 'Eu escolho...',
        choices: [
          { label: 'TODO MUNDO JUNTO', reply: 'Então bora. A galera inteira entrou na torcida. Isso vale turbo.', effect: { type: 'turbo', value: 100 } },
          { label: 'SÓ EU E A PRANCHA', reply: 'Então foco total. Cada manobra vale o dobro na cabeça. Vou mostrar o que aprendi.', effect: { type: 'score', value: 1200 } },
        ] },
    ],
    outro: [
      { who: 'naldo', text: '18.000. O placar de 1999 acabou de piscar.' },
      { who: 'zel', text: 'Ele vai aparecer?' },
      { who: 'naldo', text: 'Já apareceu. Só que não é o que você pensa.' },
      { who: 'kaka', text: 'kkk olha atrás de você.' },
      { who: 'zel', text: '...quem é você?' },
      { who: 'naldo', text: 'Zel, essa é a lenda. E ele também se chama Zel. Ele quer te desafiar. Mas isso fica pro pós-game.' },
      { who: 'bruxa', text: 'GENTE, ISSO VAI RENDER UM FOTOLOG INTEIRO.' },
      { who: 'zel', text: 'Então me espera. Eu ainda não terminei.' },
    ],
    reward: 'PÓS-GAME LIBERADO: A LENDA ZEL',
  },
];

export const POSTGAME_HEATS = [
  {
    map: 'fy_pool_day', title: 'LIGA 2010 — PLAYOFF DE ENTRADA',
    duration: 165, rivals: 3, ai: 3, mods: ['rogue'],
    intro: [
      { who: 'naldo', text: 'A LIGA 2010 ETERNA. Só os lendários entram. E o Kaká, porque ele chorou.' },
      { who: 'kaka', text: 'kkk eu choro mas eu volto.' },
      { who: 'zel', text: 'Bora. O mar não espera ninguém.' },
    ],
  },
  {
    map: 'cs_surf_assault', title: 'LIGA 2010 — SEMIFINAL NA CHUVA',
    duration: 175, rivals: 2, ai: 4, mods: ['rogue', 'storm'],
    goal: { type: 'team', value: 11000 },
    allies: [{ name: 'Zé do Emule', variant: 'azul', ai: 3 }],
    intro: [
      { who: 'tia', text: 'FILHOTE, A TIA VAI ASSISTIR. SE PERDER, NÃO CONTO PRA NINGUÉM. MENTIRA, CONTO.' },
      { who: 'ze', text: 'Baixei a transmissão inteira. Tá em 72%.' },
    ],
  },
  {
    map: 'surf_heaven', title: 'LIGA 2010 — FINAL NO SERVIDOR SECRETO',
    duration: 195, rivals: 3, ai: 5, mods: ['rogue', 'glitch', 'chaos'],
    music: 'finale',
    goal: { type: 'flags', value: 3 },
    allies: [{ name: 'Rei do Pool Day', variant: 'dourado', ai: 4 }],
    intro: [
      { who: 'exe', text: 'EU VOLTEI. SÓ QUE AGORA COM 2 MB DE RAM EMOCIONAL.' },
      { who: 'rei', text: 'O servidor secreto... eu treinei aqui 10 anos.' },
      { who: 'zel', text: 'Então hoje a gente divide a prancha e o título.' },
    ],
  },
];

/* ============================================================ FASES BÔNUS
   Six extra stages, each with rivals and (usually) a teammate. They open as
   the player progresses, and the last one only exists if you find the code. */
export const BONUS_STAGES = [
  {
    id: 'bonus_pipa', title: 'CEROL PROIBIDO', map: 'surf_lagoon',
    duration: 150, goal: { type: 'pipa', value: 10 }, weather: 'dusk',
    rivals: [{ name: 'Kaká Pentelho', variant: 'roxo', ai: 4 },
      { name: 'Bruxinha do Fotolog', variant: 'verde', ai: 3 }],
    allies: [{ name: 'Zé do Emule', variant: 'azul', ai: 3 }],
    mods: [], unlock: { chapters: 5 }, xp: 400, color: '#8ee58e',
    desc: 'Dez pipas no pôr do sol. O Zé segura a linha, você corta.',
    tips: 'Pipa só cai na velocidade: SHIFT antes de cruzar a linha.',
  },
  {
    id: 'bonus_surf', title: 'MARATONA DE CRISTAS', map: 'fy_pool_day',
    duration: 150, goal: { type: 'surf', value: 12 }, weather: 'sun',
    rivals: [{ name: 'Rei do Pool Day', variant: 'dourado', ai: 4 },
      { name: 'Kaká Pentelho', variant: 'roxo', ai: 4 },
      { name: 'ZEL.EXE', variant: 'sombra', ai: 3 }],
    allies: [{ name: 'Bruxinha do Fotolog', variant: 'verde', ai: 3 }],
    mods: [], unlock: { chapters: 7 }, xp: 450, color: '#8fd3e8',
    desc: 'Doze cristas clássicas sem parar. A Bruxinha filma tudo.',
    tips: 'Não freie em cima da crista: encoste com 5+ de velocidade.',
  },
  {
    id: 'bonus_flags', title: 'GUERRA DE BANDEIRA', map: 'cs_surf_assault',
    duration: 200, goal: { type: 'flags', value: 4 }, weather: 'storm',
    rivals: [{ name: 'Kaká Pentelho', variant: 'roxo', ai: 5 },
      { name: 'ZEL.EXE', variant: 'sombra', ai: 5 },
      { name: 'Rei do Pool Day', variant: 'dourado', ai: 4 }],
    allies: [{ name: 'Zé do Emule', variant: 'azul', ai: 4 },
      { name: 'Naldo da Lan', variant: 'gelo', ai: 3 }],
    mods: ['rogue'], unlock: { chapters: 9 }, xp: 550, color: '#ff9f6b',
    desc: 'Quatro capturas na tempestade. Dupla de aliados contra três caçadores.',
    tips: 'Leve a bandeira pra base verde. O Zé ou o Naldo podem capturar por você.',
  },
  {
    id: 'bonus_team', title: 'TRIO DA LAN', map: 'pool_temple',
    duration: 200, goal: { type: 'team', value: 20000 }, weather: 'night',
    rivals: [{ name: 'Rei do Pool Day', variant: 'dourado', ai: 5 },
      { name: 'ZEL.EXE', variant: 'sombra', ai: 5 },
      { name: 'Kaká Pentelho', variant: 'roxo', ai: 4 }],
    allies: [{ name: 'Tia Márcia', variant: 'rosa', ai: 4 },
      { name: 'Bruxinha do Fotolog', variant: 'verde', ai: 4 }],
    mods: [], unlock: { postgame: true }, xp: 650, color: '#ffe066',
    desc: 'Trio contra trio no templo. 20.000 pontos somados. A Tia tá on.',
    tips: 'O placar do time soma todo mundo. Combo de um ajuda o outro a virar.',
  },
  {
    id: 'bonus_relics', title: 'ARQUIVO MORTO', map: 'surf_heaven',
    duration: 190, goal: { type: 'relics', value: 14 }, weather: 'glitch',
    rivals: [{ name: 'ZEL, A LENDA', variant: 'zel', ai: 6 },
      { name: 'ZEL.EXE', variant: 'sombra', ai: 5 },
      { name: 'Kaká Pentelho', variant: 'roxo', ai: 4 }],
    allies: [{ name: 'Rei do Pool Day', variant: 'dourado', ai: 4 }],
    mods: ['glitch'], unlock: { legend: 2 }, xp: 750, color: '#b07cff',
    desc: 'Catorze relíquias no servidor secreto. O Rei lembra onde estão.',
    tips: 'Relíquia respawna. Não pare de girar o mapa: o bot pega tudo.',
  },
  {
    id: 'bonus_secret', title: 'A FASE QUE NÃO EXISTE', map: 'de_surf_dust',
    duration: 180, goal: { type: 'gates', value: 30 }, weather: 'glitch',
    rivals: [{ name: 'ZEL, A LENDA', variant: 'zel', ai: 7 },
      { name: 'ZEL.EXE', variant: 'sombra', ai: 6 },
      { name: 'Kaká Pentelho', variant: 'roxo', ai: 5 }],
    allies: [{ name: 'Naldo da Lan', variant: 'gelo', ai: 4 },
      { name: 'Zé do Emule', variant: 'azul', ai: 4 }],
    mods: ['glitch', 'chaos'], unlock: { egg: 'bonus' }, xp: 1000, color: '#ff8f6b',
    desc: 'Trinta gates num mapa que devia estar vazio. O arquivo abriu.',
    tips: 'Trinta gates, servidor corrompido e dois aliados. Bem-vindo ao bug.',
    secret: true,
  },
];

export const HEAT = {
  duration: 180,
  ai: 2,
  rivals: [
    { name: 'Kaká Pentelho', variant: 'roxo' },
    { name: 'Bruxinha do Fotolog', variant: 'verde' },
    { name: 'Rei do Pool Day', variant: 'dourado' },
    { name: 'ZEL.EXE', variant: 'sombra' },
  ],
};

export const LEGEND_CHAPTERS = [
  {
    id: 'legend1', map: 'pool_temple', title: 'A LENDA APARECE',
    tag: 'A LENDA · 1/5', mode: 'place', weather: 'night',
    duration: 150, goal: { type: 'place', value: 1 },
    music: 'omen',
    rivals: [{ name: 'ZEL, A LENDA', variant: 'zel', ai: 9, legend: true }],
    tips: 'Ele não erra gate e não desacelera quando assume a ponta. Turbo, combo e o templo — é o único jeito.',
    intro: [
      { who: 'lenda', text: 'Não respira fundo. Eu já sei o seu tempo.' },
      { who: 'zel', text: 'Você é o Zel de 1999.' },
      { who: 'lenda', text: 'Sou o único Zel que este mar reconhece. Todo placar daqui é o meu nome escrito com outro número.' },
      { who: 'lenda', text: 'Você tem uma corrida pra provar que merece o nome. Eu tenho vinte e sete anos sem perder um gate.' },
      { who: 'zel', text: 'Então hoje o mar aprende um nome novo.' },
      { who: 'lenda', text: 'Não. Hoje ele aprende o quanto você ainda tem medo.' },
    ],
    outro: [
      { who: 'lenda', text: 'Você venceu. Guarde esse segundo: é o único que eu vou te dar de graça.' },
      { who: 'zel', text: 'Você deixou?' },
      { who: 'lenda', text: 'Eu nunca deixo. Só ainda não terminei de te medir.' },
      { who: 'lenda', text: 'Duas provas. Se cair uma, eu apago seu nome do placar e da memória do servidor.' },
    ],
  },
  {
    id: 'legend2', map: 'cs_surf_assault', title: 'TEMPESTADE DE 1999',
    tag: 'A LENDA · 2/5', mode: 'gates', weather: 'storm',
    duration: 170, goal: { type: 'gates', value: 22 },
    music: 'omen',
    rivals: [{ name: 'ZEL, A LENDA', variant: 'zel', ai: 9, legend: true },
      { name: 'Kaká Pentelho', variant: 'roxo', ai: 5 }],
    mods: ['rogue'],
    tips: 'A lenda trouxe a tempestade de 1999. Passe 22 gates sem cair na parede de água — ele passa todos.',
    intro: [
      { who: 'lenda', text: 'Em 1999 choveu assim por três dias. Eu surfei 72 horas e o mar desistiu primeiro.' },
      { who: 'kaka', text: 'kkk e a sua net era fumaça?' },
      { who: 'lenda', text: 'Cabo de rede. E eu era o único que sabia usar. Você faz barulho, Kaká. Eu faço silêncio e gate.' },
      { who: 'zel', text: 'Então hoje a gente atualiza o recorde.' },
      { who: 'lenda', text: 'Você não atualiza nada. Você sobrevive. Se sobreviver 22 vezes, eu começo a te chamar pelo nome.' },
    ],
    outro: [
      { who: 'lenda', text: 'Vinte e dois. Eu contei cada um. Você não parou nem quando a água veio.' },
      { who: 'zel', text: 'Parei não. Meu pessoal tá vendo.' },
      { who: 'lenda', text: 'É por isso que você ainda está de pé. Eu não tenho ninguém vendo. Nunca tive.' },
      { who: 'lenda', text: 'Última prova: o servidor que eu criei. Sem juiz, sem lag, sem desculpa. Só eu e o que sobrar de você.' },
    ],
  },
  {
    id: 'legend3', map: 'surf_heaven', title: 'O ÚLTIMO POOL DAY',
    tag: 'A LENDA · 3/5', mode: 'score', weather: 'glitch',
    duration: 190, goal: { type: 'score', value: 22000 },
    music: 'finale',
    rivals: [{ name: 'ZEL, A LENDA', variant: 'zel', ai: 10, legend: true },
      { name: 'ZEL.EXE', variant: 'sombra', ai: 7 }],
    mods: ['rogue', 'glitch', 'chaos'],
    tips: '22.000 pontos. Ele desenhou cada gate deste servidor. Combo alto ou nada.',
    intro: [
      { who: 'lenda', text: 'Eu desenhei cada ilha deste servidor. Cada gate abre onde eu quero. Cada bug tem o meu nome.' },
      { who: 'exe', text: 'E EU SOU O BUG QUE VOCÊ DEIXOU PRA TRÁS.' },
      { who: 'lenda', text: 'Você trouxe um bot pra nossa final. Isso diz tudo sobre você.' },
      { who: 'zel', text: 'Trouxe meus amigos. O bot veio junto.' },
      { who: 'lenda', text: 'Amigos não seguram prancha. Vinte e dois mil pontos. Se você não fizer, eu faço na sua frente.' },
    ],
    outro: [
      { who: 'lenda', text: 'Vinte e dois mil. O placar de 1999 acabou de tremer.' },
      { who: 'zel', text: 'Então o título é meu?' },
      { who: 'lenda', text: 'O título nunca foi meu pra dar. Eu só queria ver se você tinha coragem de vir buscar.' },
      { who: 'naldo', text: 'Agora sim. O arquipélago tem dois Zels lendários. E uma lan house orgulhosa.' },
      { who: 'kaka', text: 'kkk vou postar que sou amigo dos dois. Ninguém precisa saber que eu perdi.' },
      { who: 'lenda', text: 'Mas o arquivo de 1999 ainda está fechado. E lá dentro tem uma fita que eu nunca tive coragem de ouvir.' },
    ],
  },
  {
    id: 'legend4', map: 'de_surf_dust', title: 'O ARQUIVO DE 1999',
    tag: 'A LENDA · 4/5', mode: 'relics', weather: 'dusk',
    duration: 180, goal: { type: 'relics', value: 10 },
    music: 'omen',
    rivals: [{ name: 'ZEL, A LENDA', variant: 'zel', ai: 10, legend: true },
      { name: 'ZEL.EXE', variant: 'sombra', ai: 7 },
      { name: 'Kaká Pentelho', variant: 'roxo', ai: 6 }],
    mods: ['chaos'],
    tips: 'Dez relíquias no arquivo. Ele já sabe onde todas estão — você tem que ser mais rápido que a memória dele.',
    intro: [
      { who: 'lenda', text: 'Esse mapa é o backup de 1999. Tudo que este mar engoliu está aqui, com nome e data.' },
      { who: 'exe', text: 'INCLUSIVE EU. EU SOU UM ARQUIVO QUE NINGUÉM ABRIU.' },
      { who: 'kaka', text: 'kkk então tem relíquia até no servidor do bot. Bora.' },
      { who: 'lenda', text: 'Dez relíquias. Eu já sei onde todas estão. Você vai ter que ser mais rápido que a minha memória.' },
      { who: 'zel', text: 'Se eu achar todas, você me conta o que tem na última fita?' },
      { who: 'lenda', text: 'Se você achar todas, eu deixo você ouvir. E aí a gente vê se você continua querendo o meu título.' },
    ],
    outro: [
      { who: 'lenda', text: 'Dez. O arquivo abriu — e com ele uma coisa que eu preferia deixar fechada.' },
      { who: 'exe', text: 'EU NÃO QUERIA ABRIR. TINHA FOTO MINHA DE 2003 AÍ.' },
      { who: 'kaka', text: 'kkk muito tarde, já postei.' },
      { who: 'zel', text: 'Então me dá a fita. Eu prometo não baixar em 99%.' },
      { who: 'lenda', text: 'A fita é o último pool day. Gelo, neve e 26.000 pontos. Se aguentar, o arquivo é seu. Se não...' },
    ],
  },
  {
    id: 'legend5', map: 'fy_iceworld', title: 'A ÚLTIMA DISKADA',
    tag: 'A LENDA · 5/5', mode: 'score', weather: 'snow',
    duration: 210, goal: { type: 'score', value: 26000 },
    music: 'finale',
    rivals: [{ name: 'ZEL, A LENDA', variant: 'zel', ai: 10, legend: true },
      { name: 'ZEL.EXE', variant: 'sombra', ai: 8 },
      { name: 'Rei do Pool Day', variant: 'dourado', ai: 7 }],
    mods: ['rogue', 'glitch', 'chaos'],
    tips: 'A fita final: 26.000 pontos no gelo, com o servidor inteiro tentando te derrubar. Ele nunca esteve tão rápido.',
    intro: [
      { who: 'lenda', text: 'Última diskada. Sem plateia, sem cais, sem desculpa.' },
      { who: 'exe', text: 'EU VOU LOGAR NO MEIO. É TRADIÇÃO.' },
      { who: 'rei', text: 'E eu vou trazer o elmo. Alguém tem que manter o estilo.' },
      { who: 'zel', text: 'Então bora. Essa fita vai tocar pra sempre na lan house.' },
      { who: 'lenda', text: 'Vinte e seis mil. É o número que eu escrevi nessa fita em 1999 e nunca consegui bater de novo. Faça o que eu não fiz.' },
    ],
    outro: [
      { who: 'lenda', text: 'Vinte e seis mil. A fita virou o novo clássico — e eu não estou nela.' },
      { who: 'zel', text: 'Então o arquivo é meu?' },
      { who: 'lenda', text: 'O arquivo é de todo mundo. Só não deixa o modem cair.' },
      { who: 'lenda', text: 'E Zel: se um dia alguém chegar perto do seu tempo, não facilite. Lenda que facilita vira saudade.' },
      { who: 'naldo', text: 'A lan house tá orgulhosa. E o PC 4 finalmente parou de travar.' },
      { who: 'kaka', text: 'kkk vou dizer que ajudei. Tecnicamente eu atrapalhei, mas conta.' },
      { who: 'bruxa', text: 'POSTEI A FITA NO FOTOLOG. 200 SCRAPS EM 10 MINUTOS.' },
    ],
  },
];

export const HANGOUTS = [
  {
    id: 'hang_naldo', title: 'ROLÊ COM O NALDO', friend: 'Naldo da Lan', req: 1,
    map: 'fy_pool_day', variant: 'gelo', mode: 'team',
    duration: 180, goal: { type: 'team', value: 7000 },
    tips: 'Dupla com o Naldo: 7.000 pontos de time no pool day, ele reclamando do modem do lado.',
    intro: [
      { who: 'naldo', text: 'Faz tempo que eu não entro na água. Meus joelhos são de 2004.' },
      { who: 'zel', text: 'Então hoje é fisioterapia com prancha.' },
      { who: 'naldo', text: 'Se eu cair, você apaga o print.' },
    ],
    outro: [
      { who: 'naldo', text: 'Ainda sei surfar. Só não sei levantar.' },
      { who: 'zel', text: 'Pra mim já valeu. Bora repetir semana que vem?' },
      { who: 'naldo', text: 'Só se você pagar a hora da lan.' },
    ],
  },
  {
    id: 'hang_bruxa', title: 'ROLÊ COM A BRUXINHA', friend: 'Bruxinha do Fotolog', req: 2,
    map: 'surf_lagoon', variant: 'verde', mode: 'relics',
    duration: 180, goal: { type: 'relics', value: 7 },
    tips: 'A Bruxinha quer 7 relíquias pra um Fotolog novo. Não deixa ela postar a foto caindo.',
    intro: [
      { who: 'bruxa', text: 'HOJE O ROLÊ É FOTOGRÁFICO. QUERO RELÍQUIAS E UM PÔR DO SOL COM FILTRO.' },
      { who: 'zel', text: 'E se a gente cair?' },
      { who: 'bruxa', text: 'AÍ VIRA ARTE CONCEITUAL.' },
    ],
    outro: [
      { who: 'bruxa', text: 'FICOU PERFEITO. LEGENDA: "MOMENTOS QUE O MODEM NÃO APAGA".' },
      { who: 'zel', text: 'Essa foi boa. Até eu repassaria.' },
      { who: 'bruxa', text: 'JÁ REPASSEI PRA 10 AMIGOS.' },
    ],
  },
  {
    id: 'hang_kaka', title: 'ROLÊ COM O KAKÁ', friend: 'Kaká Pentelho', req: 2,
    map: 'de_surf_dust', variant: 'roxo', mode: 'gates',
    duration: 190, goal: { type: 'gates', value: 14 },
    tips: 'O Kaká quer revanche sem plateia. 14 gates no Dust2, com direito a "kkk" no final.',
    intro: [
      { who: 'kaka', text: 'Sem plateia, sem aposta, sem print. Só eu e você.' },
      { who: 'zel', text: 'Você tá... sendo legal?' },
      { who: 'kaka', text: 'Tô sendo estratégico. Se eu ganhar, ninguém viu. Se eu perder, ninguém viu.' },
    ],
    outro: [
      { who: 'kaka', text: 'kkk... tá bom. Foi divertido.' },
      { who: 'zel', text: 'Fala isso de novo sem o kkk.' },
      { who: 'kaka', text: 'Não força a amizade.' },
    ],
  },
];

export const ISLANDS = [
  { map: 'fy_pool_day', name: 'POOL DAY', x: 0.14, y: 0.68, note: 'o clássico' },
  { map: 'fy_iceworld', name: 'ICEWORLD', x: 0.30, y: 0.38, note: 'gelo e ramp' },
  { map: 'surf_lagoon', name: 'LAGOA', x: 0.46, y: 0.66, note: 'Fotolog' },
  { map: 'de_surf_dust', name: 'DUST SURF', x: 0.61, y: 0.36, note: 'deserto' },
  { map: 'cs_surf_assault', name: 'ASSAULT', x: 0.72, y: 0.68, note: 'tempestade' },
  { map: 'pool_temple', name: 'TEMPLO', x: 0.84, y: 0.40, note: 'Orkut' },
  { map: 'surf_heaven', name: 'HEAVEN', x: 0.90, y: 0.76, note: 'servidor secreto' },
];

export const WORLD_QUESTS = [
  { id: 'pool_gates', map: 'fy_pool_day', type: 'gates', target: 8, title: 'Voltas na piscina', desc: 'Passe 8 gates no modo livre.', reward: 120 },
  { id: 'pool_tricks', map: 'fy_pool_day', type: 'tricks', target: 3, title: 'Manobra de aquecimento', desc: 'Acerte 3 manobras no ar.', reward: 140 },
  { id: 'ice_relics', map: 'fy_iceworld', type: 'relics', target: 4, title: 'Relíquias congeladas', desc: 'Colete 4 relíquias no gelo.', reward: 150 },
  { id: 'ice_gates', map: 'fy_iceworld', type: 'gates', target: 10, title: 'Corredor de gelo', desc: 'Passe 10 gates na iceworld.', reward: 160 },
  { id: 'lagoon_relics', map: 'surf_lagoon', type: 'relics', target: 5, title: 'Caça ao CD', desc: 'Ache 5 relíquias na lagoa.', reward: 160 },
  { id: 'lagoon_tricks', map: 'surf_lagoon', type: 'tricks', target: 4, title: 'Fotolog radical', desc: 'Mande 4 manobras na lagoa.', reward: 170 },
  { id: 'dust_gates', map: 'de_surf_dust', type: 'gates', target: 12, title: 'Rota do deserto', desc: 'Passe 12 gates no Dust Surf.', reward: 180 },
  { id: 'dust_tricks', map: 'de_surf_dust', type: 'tricks', target: 5, title: 'Truque de poeira', desc: 'Acerte 5 manobras no deserto.', reward: 190 },
  { id: 'assault_gates', map: 'cs_surf_assault', type: 'gates', target: 10, title: 'Doca alagada', desc: 'Passe 10 gates na tempestade.', reward: 190 },
  { id: 'assault_relics', map: 'cs_surf_assault', type: 'relics', target: 4, title: 'Carga perdida', desc: 'Colete 4 relíquias no assault.', reward: 200 },
  { id: 'temple_relics', map: 'pool_temple', type: 'relics', target: 5, title: 'Tesouro do templo', desc: 'Colete 5 relíquias no templo.', reward: 210 },
  { id: 'temple_tricks', map: 'pool_temple', type: 'tricks', target: 6, title: 'Ritual do Orkut', desc: 'Mande 6 manobras no templo.', reward: 220 },
  { id: 'heaven_gates', map: 'surf_heaven', type: 'gates', target: 12, title: 'Protocolo secreto', desc: 'Passe 12 gates no servidor secreto.', reward: 240 },
  { id: 'heaven_tricks', map: 'surf_heaven', type: 'tricks', target: 8, title: 'Bug divino', desc: 'Acerte 8 manobras no heaven.', reward: 260 },
];

export const NEWS = [
  'FLASH: internauta descobre que água molha. Especialistas discordam.',
  'ORkut fora do ar. Brasil entra em luto nacional por 45 minutos.',
  'HOMEM baixa música em 4 horas e ouve só o refrão. "Valeram a pena", diz.',
  'NOVO VÍRUS no Orkut promete deixar o perfil "mais bonito". Perfil fica rosa.',
  'LAN house cobra R$ 3 a hora e chama de "internet turbo". Clientes sentem diferença.',
  'MSN NUDGE quebra monitor de lan house. Dono culpa o Windows.',
  'CS 1.6: jogador fica 6 horas no fy_pool_day e esquece de almoçar. Família preocupa.',
  'EMULE: arquivo chega a 99%. Usuário comemora, arquivo era um vírus.',
  'FOTOLOG: menina posta foto com filtro e legenda "momentos". Recebe 47 scrapzinhos.',
  'YAHOO RESPOSTAS: "como virar lendário no surf?" Melhor resposta: "cai e levanta".',
  'WINDOWS XP REINICIA sozinho no meio do campeonato. Organização chama de "feature".',
  'TIA MÁRCIA manda corrente. 10 amigos morrem de tédio. Corrente continua.',
  'NOKIA TIJOLÃO sobrevive a queda de 3 andares. Celular pede desculpas ao chão.',
  'DISQUETE de 1,44 MB é encontrado em lan house. Guardava o maior trabalho da 6ª série.',
  'FOTOLOG: servidor cai após 5 milhões de fotos de pôr do sol com o mesmo filtro.',
  'NOVO MAPA: fy_pool_day 2 promete piscina maior. Fãs reclamam que a água é a mesma.',
];

export const COMP_BANTER = [
  { at: 3, text: 'Kaká: "kkk tá parecendo internet discada!"' },
  { at: 5, text: 'Zel: "Isso aqui é uma lan house ou um aquário?"' },
  { at: 7, text: 'Zé: "Se eu ganhar, eu baixo o troféu em 4 horas."' },
  { at: 9, text: 'Tia Márcia: "REPASSA ESSA ONDA PARA 10 AMIGOS!"' },
  { at: 4, text: 'Bruxinha: "ESSA ONDA TEM UMA ENERGIA MUITO 2007!"' },
  { at: 6, text: 'Rei: "O templo não perdoa quem usa bermuda de tactel."' },
  { at: 8, text: 'ZEL.EXE: "VOCÊ É UM BUG COM SAUDADE."' },
];

export const BAIL_LINES = [
  'Caiu igual internet discada.',
  'Isso foi um wipeout ou um download travado?',
  'O mar pediu seu cadastro e cancelou.',
  'Foi de propósito. A gente sabe.',
  'Caiu, mas com estilo. Isso conta.',
  'A prancha ficou, você não.',
];

export const COMBO_LINES = [
  'COMBO! Tá voando, muleque!',
  'ISSO! Nem o PC 4 travando te para!',
  'Naldo tá chorando na lan house.',
  'Kaká já mandou "kkk" de nervoso.',
  'Tá parecendo replay de campeonato.',
  'A tia mandou isso pra 10 amigos.',
];

export const MILESTONE_LINES = [
  'MIL! O modem nem acredita.',
  'Placar subindo que nem download de 2007.',
  'Isso vai virar print no Orkut.',
  'O Kaká vai dizer que foi lag.',
  'Radical demais pro servidor aguentar.',
  'A lan house inteira tá assistindo.',
];

export const GATE_LINES = [
  'GATE! Passou limpo.',
  'Checkpoint! O modem agradece.',
  'Gate garantido. Turbo liberado.',
];

export const RELIC_LINES = [
  'Relíquia achada! Isso vai pro Fotolog.',
  'Uia. Tesouro de 2006.',
  'O Zé do Emule quer isso pra pasta dele.',
];

export const STORM_LINES = [
  'O mar tá tipo MSN: instável.',
  'Segura! Vem parede de água!',
  'Alerta de onda gigante: pula ou reza.',
];

export const TICKER_TIPS = [
  'DICA DE 2007: aperte J, K ou L no ar pra mandar manobra.',
  'DICA: emende gates e relíquias pra manter o combo.',
  'DICA: SHIFT gasta turbo. Enche de novo deslizando em curva.',
  'DICA: rampas lançam você. Manobra terminada = pontos extras.',
  'DICA: parede de água só machuca quem tá em cima da prancha.',
  'O jogo é seu: remixa, quebra e conserta. Diversão primeiro.',
  'Sem login, sem passe, sem pressa. Só a onda e a galera.',
  'SEGREDO: existe um MODEM DOURADO em cada ilha do modo livre.',
  'SEGREDO: digite BONUS na tela inicial. O arquivo abre uma fase.',
  'BÔNUS: treze cristas, quatro bandeiras, duas relíquias... o arquivo é fundo.',
];

export const CREDITS = [
  'SURFN 2000 — criado por FloatingSkies (Arikcnovais / azzynovais). Mesma pessoa, três nicks.',
  'Código, arte, level design, texto e direção: FloatingSkies.',
  '10 capítulos de carreira, 5 capítulos da Lenda e pós-game: 7 ilhas, provas, festas, mods e conquistas.',
  'Zel recortado de spritesheets/zel v2 spritesheet.png (16 poses, 4 direções, shorts de praia).',
  'Tiles, ondas, props, retratos e papéis de parede gerados em Python na paleta do atlas original.',
  'Motor Paperwing do projeto skyblock: câmera, partículas, painéis e áudio com fallback sintetizado.',
  'Waterflame — Glorious Morning 1/2, Jumper, Ricochet Love, Chaotic, Electroman Adventures, Space Pirates, Techock, The Show, Swampland (CC BY-NC-SA 3.0).',
  'Trilha também: NemesisTheory — Rose at Midnight (CC BY 3.0), Rose at Nightfall / Twilight (BLACK ROSE Ver.).',
  'Aerologic — Electronaut (CC BY-NC 3.0). Fontes e licenças completas em CREDITS.md.',
  'SFX: Wayzata Technology / Internet Archive (CC0) + modem 56k (Public Domain Mark).',
  'Sem login, sem passe, sem anúncio: o save mora no seu navegador (surfn-2000-save-v1).',
  'Créditos, fontes e licenças completas: CREDITS.md. Áudio removido se o criador pedir.',
  'Software livre na alma: o menu REMIX é seu. Liga, desliga e joga do seu jeito.',
];

/* ============================================================ VILA 2000
   Pós-game quase-RP: os NPCs têm horário de entrar/sair, relações separadas
   e conversas que mudam com o tempo. A arte continua sendo o atlas do Zel. */

export const SANDBOX_NPCS = [
  {
    key: 'naldo', name: 'Naldo da Lan', variant: 'gelo', ai: 1, online: [9, 22],
    role: 'dono da lan house',
    routine: [[0, 'lan'], [12, 'bar'], [18, 'plaza'], [21, 'lan']],
  },
  {
    key: 'bruxa', name: 'Bruxinha do Fotolog', variant: 'verde', ai: 1, online: [13, 26],
    role: 'fotógrafa do rolê',
    routine: [[0, 'hotel'], [13, 'plaza'], [16, 'pier'], [20, 'bar'], [23, 'hotel']],
  },
  {
    key: 'kaka', name: 'Kaká Pentelho', variant: 'roxo', ai: 1, online: [16, 23],
    role: 'rival que jura que não é rival',
    routine: [[0, 'hotel'], [16, 'skate'], [19, 'plaza'], [21, 'bar'], [22, 'hotel']],
  },
  {
    key: 'ze', name: 'Zé do Emule', variant: 'azul', ai: 1, online: [0, 24],
    role: 'baixando a vila inteira em 99%',
    routine: [[0, 'lan'], [8, 'market'], [12, 'lan'], [18, 'pier'], [21, 'lan']],
  },
];

export const NPC_TALK = {
  naldo: {
    greet: 'A lan abre às 9. O modem, quando quer.',
    cool: [
      { who: 'naldo', text: 'E aí, muleque. Veio pagar a hora ou veio encher o saco?' },
      { who: 'zel', text: 'Vim ver se a vila ainda tem algo pra fazer.' },
    ],
    warm: [
      { who: 'naldo', text: 'Ó o meu cliente favorito. Pode usar o PC 3, mas não abre o Emule.' },
      { who: 'zel', text: 'Você fala isso como se eu fosse abrir.' },
      { who: 'naldo', text: 'Você abre. Eu sei que você abre.' },
    ],
    choices: [
      { label: 'PEDIR A SENHA DO WIFI', value: 1, reply: 'É o nome da lan, sem espaço. Não conta pra ninguém.' },
      { label: 'ZOAR O MODEM', value: -1, reply: 'Kkkk. Vai ficar sem internet até 2009.' },
    ],
  },
  bruxa: {
    greet: 'ACABEI DE POSTAR UMA FOTO DA PISCINA. 47 SCRAPZINHOS.',
    cool: [
      { who: 'bruxa', text: 'VOCÊ NÃO TÁ NO MEU TOP 8. MAS POSSO PENSAR.' },
      { who: 'zel', text: 'Eu nem sabia que ainda existia top 8.' },
    ],
    warm: [
      { who: 'bruxa', text: 'OLHA ESSA FOTO! O FILTRO DEIXOU O CÉU MAIS 2000.' },
      { who: 'zel', text: 'Tá parecendo capa de CD de rock.' },
      { who: 'bruxa', text: 'ERA EXATAMENTE ISSO QUE EU QUERIA.' },
    ],
    choices: [
      { label: 'ELOGIAR O FOTOLOG', value: 1, reply: 'VOU COLOCAR VOCÊ NO MEU TOP 8. NÃO CONTA PRA NINGUÉM.' },
      { label: 'FALAR QUE É SÓ FILTRO', value: -1, reply: 'TÁ BLOQUEADO POR 3 DIAS. OU ATÉ EU ESQUECER.' },
    ],
  },
  kaka: {
    greet: 'kkk tô só passando. Não tô te seguindo.',
    cool: [
      { who: 'kaka', text: 'Ainda vivo na sua cabeça? Porque no placar eu vivo.' },
      { who: 'zel', text: 'Você veio até a vila pra falar isso?' },
    ],
    warm: [
      { who: 'kaka', text: 'Relaxa, hoje eu vim sem print. Só tomar um guaraná.' },
      { who: 'zel', text: 'Então senta. Mas não fala de gate.' },
      { who: 'kaka', text: '...o último gate que você perdeu foi hilário.' },
    ],
    choices: [
      { label: 'CHAMAR PRA UM ROLÊ', value: 2, reply: 'kkk... tá. Mas se eu ganhar, eu não vou postar. Muito.' },
      { label: 'REVIVER A RIVALIDADE', value: -1, reply: 'kkk aí você me quebra. Mas eu aceito.' },
    ],
  },
  ze: {
    greet: 'TÁ EM 99%. SÓ FALTA UM PEDACINHO. DESDE 2006.',
    cool: [
      { who: 'ze', text: 'Você tem aquele CD do rock? O que tinha 14 faixas e duas eram propaganda?' },
      { who: 'zel', text: 'Acho que sim. Tá no armário da lan.' },
    ],
    warm: [
      { who: 'ze', text: 'BAIXEI A VILA INTEIRA. AGORA SÓ FALTA ABRIR.' },
      { who: 'zel', text: 'E o vírus?' },
      { who: 'ze', text: 'VEIO DE BRINDE. CHAMA-SE EXPERIÊNCIA.' },
    ],
    choices: [
      { label: 'AJUDAR A CHEGAR A 100%', value: 1, reply: 'VOCÊ É O PRIMEIRO. VOU GUARDAR ESSE MOMENTO NO ORKUT.' },
      { label: 'MANDAR FORMATAR', value: -1, reply: 'NÃO! TEM FOTO DA MINHA FESTA DE 2003 AÍ.' },
    ],
  },
};

/* Cutscenes in-game: a câmera percorre o mapa enquanto a galera narra. */
export const CUTSCENES = {
  ch1: {
    music: 'menu2000',
    shots: [
      { target: 'center', who: 'naldo', text: '2007. A lan house cheira a x-tudo, o modem disca e alguém deixou o CS aberto no PC 3.', dur: 5.4 },
      { target: 'player', who: 'zel', text: 'Então é aqui que começa o campeonato?', dur: 3.8 },
      { target: 'gate', who: 'naldo', text: 'Começa onde você quiser. Só não derruba o roteador de novo.', dur: 4.8 },
    ],
  },
  ch8: {
    music: 'sunset',
    shots: [
      { target: 'center', who: 'bruxa', text: 'A LAGOA GUARDA AS RELÍQUIAS QUE NINGUÉM POSTOU. OLHA ESSA LUZ.', dur: 4.8 },
      { target: 'gate', who: 'zel', text: 'Parece que o servidor tá respirando.', dur: 3.6 },
      { target: 'player', who: 'naldo', text: 'É o arquipélago. Ele lembra de quem passa por aqui. Não para no meio.', dur: 5.2 },
    ],
  },
  ch10: {
    music: 'garage2000',
    shots: [
      { target: 'player', who: 'naldo', text: 'Esse é o servidor secreto. Aqui tem todas as ilhas, todos os mapas e todos os bugs que eu tentei esconder.', dur: 5.2 },
      { target: 'center', who: 'zel', text: 'Então é aqui que a lenda mora?', dur: 3.8 },
      { target: 'gate', who: 'naldo', text: 'Não. Aqui é onde ele deixou o desafio. O placar tá travado em 17.999 desde 1999.', dur: 5.4 },
      { target: 'player', who: 'lenda', text: 'Zel. Você demorou. Eu já ia fechar o servidor.', dur: 4.2 },
    ],
  },
  legend1: {
    music: 'omen',
    shots: [
      { target: 'center', who: 'lenda', text: 'O templo guarda todos os placares que você nunca viu. Todos com o meu nome.', dur: 4.8 },
      { target: 'player', who: 'lenda', text: 'Zel de 2007. Eu senti você chegar antes do seu modem.', dur: 4.6 },
      { target: 'gate', who: 'zel', text: 'E você é o Zel de 1999. Achei que fosse... mais velho.', dur: 4.2 },
      { target: 'center', who: 'lenda', text: 'Uma corrida. Se ganhar, o título é seu. Se perder, seu nome fica aqui comigo. Pra sempre.', dur: 5.4 },
    ],
  },
  sandbox: {
    music: 'garage2000',
    shots: [
      { target: 'center', who: 'naldo', text: 'Depois do título, o arquipélago virou vila. A lan house tem café, o bar tem guaraná e o servidor tem horário.', dur: 5.2 },
      { target: 'player', who: 'zel', text: 'Então agora eu posso... dormir?', dur: 3.4 },
      { target: 'gate', who: 'naldo', text: 'Pode até dormir. Mas se perder o horário da galera, o MSN fica offline. Aperta E perto das coisas.', dur: 5.6 },
      { target: 'center', who: 'bruxa', text: 'E NÃO ESQUECE: FOTO NO FOTOLOG ANTES DE DORMIR.', dur: 4.2 },
    ],
  },
  squad: {
    music: 'sunset',
    shots: [
      { target: 'center', who: 'kaka', text: 'kkk antes de cair na água: alguém leu a regra ou vamos descobrir no replay?', dur: 4.2 },
      { target: 'player', who: 'bruxa', text: 'EU LEIO DEPOIS. PRIMEIRO VOU POSTAR A FOTO DA LARGADA.', dur: 3.8 },
      { target: 'gate', who: 'naldo', text: 'Regra da lan: corre, cai, levanta e não derruba o roteador. Bora.', dur: 4.4 },
    ],
  },
  event: {
    music: 'rocknight',
    shots: [
      { target: 'center', who: 'naldo', text: 'Evento da comunidade. O placar é público, a vergonha também.', dur: 4.0 },
      { target: 'gate', who: 'kaka', text: 'kkk se eu perder, apaga o print. Se eu ganhar, deixa dois.', dur: 3.8 },
      { target: 'player', who: 'zel', text: 'Bora fazer barulho. O arquipélago tá online.', dur: 3.4 },
    ],
  },
};

export const SEASONS = [
  { name: 'VERÃO', color: '#ffd24d', weather: ['sun', 'sun', 'storm'] },
  { name: 'OUTONO', color: '#ff9f6b', weather: ['dusk', 'storm', 'rain'] },
  { name: 'INVERNO', color: '#8fd3e8', weather: ['snow', 'snow', 'night'] },
  { name: 'PRIMAVERA', color: '#8ee58e', weather: ['sun', 'rain', 'dusk'] },
];

/* Sandbox work board. Jobs are little loops around town, saved between
   sessions so a shift can be finished days later. */
export const SANDBOX_JOBS = [
  {
    id: 'courier', title: 'MOTOBOY DA LAN', place: 'LAN HOUSE', pay: 14, target: 3,
    route: ['market', 'hotel', 'bar'], material: 'chips',
    desc: 'Entregue 3 pacotes: mercado, hotel e bar.',
  },
  {
    id: 'keeper', title: 'FAROLEIRO', place: 'FAROL', pay: 11, target: 2,
    route: ['light'], material: 'metal',
    desc: 'Acenda o farol duas vezes antes do anoitecer.',
  },
  {
    id: 'dj', title: 'DJ DA RÁDIO', place: 'RÁDIO', pay: 12, target: 2,
    route: ['radio'], material: 'cloth',
    desc: 'Coloque dois discos no ar sem deixar cair o sinal.',
  },
  {
    id: 'clerk', title: 'CAMAREIRO DO HOTEL', place: 'HOTEL 2000', pay: 10, target: 3,
    route: ['hotel'], material: 'cloth',
    desc: 'Arrume três quartos. O hóspede de 2007 não reclama.',
  },
  {
    id: 'tester', title: 'TESTADOR DO ARCADE', place: 'ARCADE', pay: 9, target: 3,
    route: ['arcade'], material: 'chips',
    desc: 'Teste três fichas e anote o recorde no papel.',
  },
  {
    id: 'fisher', title: 'PESCADOR DA ORLA', place: 'ORLA', pay: 13, target: 3,
    route: ['pier'], material: 'wood',
    desc: 'Puxe três peixes da maré baixa. O modem não come.',
  },
];

/* Eight physical collectibles hidden around the village. They are not the
   old relic pool: each one is a tiny 2007 artefact with its own save entry. */
export const SANDBOX_COLLECTIBLES = [
  { id: 'shell', name: 'CONCHA DO MODEM', x: 176, y: 146, color: '#8fd3e8' },
  { id: 'ticket', name: 'FICHA DO ARCADE', x: 76, y: 64, color: '#b07cff' },
  { id: 'cd', name: 'CD SEM CAPA', x: 35, y: 128, color: '#ffe066' },
  { id: 'photo', name: 'FOTO DO FOTOLOG', x: 140, y: 154, color: '#ff9fd0' },
  { id: 'mouse', name: 'MOUSE DE BOLINHA', x: 156, y: 88, color: '#8ee58e' },
  { id: 'poster', name: 'PÔSTER DO SKATE', x: 36, y: 166, color: '#ff9f6b' },
  { id: 'key', name: 'CHAVE DO HOTEL', x: 140, y: 36, color: '#ffd24d' },
  { id: 'disk', name: 'DISQUETE 1,44', x: 105, y: 113, color: '#c9eef7' },
];

/* Community events. Goals are handled by goalDone/updateEventPlay. */
export const EVENTS = [
  {
    id: 'endurance', title: 'MARATONA 2000', map: 'surf_lagoon',
    duration: 240, goal: { type: 'score', value: 9000 }, weather: 'sun',
    desc: 'Quatro minutos. Uma prancha. Sem pausa pro lanche.',
    rivals: 3, mods: ['rogue'], color: '#ffe066',
  },
  {
    id: 'waverush', title: 'CAÇA ÀS ONDAS', map: 'cs_surf_assault',
    duration: 165, goal: { type: 'waves', value: 6 }, weather: 'storm',
    desc: 'Sobreviva a seis paredes de água. Pule na hora certa.',
    rivals: 2, mods: ['rogue'], color: '#8fd3e8',
  },
  {
    id: 'ctf', title: 'BANDEIRA 1v1', map: 'fy_pool_day',
    duration: 180, goal: { type: 'flags', value: 2 }, weather: 'sun',
    desc: 'Capture a bandeira rival e volte pra base. Solo, sem desculpa.',
    rivals: 2, mods: [], color: '#ff9f6b',
  },
  {
    id: 'team', title: 'MUTIRÃO DA LAGOA', map: 'surf_lagoon',
    duration: 210, goal: { type: 'team', value: 6500 }, weather: 'sun',
    desc: 'Você e um parceiro contra dois rivais. O placar é da equipe.',
    rivals: 2, team: true, mods: [], color: '#8ee58e',
    allies: [{ name: 'Zé Parceiro', variant: 'azul', ai: 2 }],
  },
  {
    id: 'pipa', title: 'FESTIVAL DE PIPAS', map: 'surf_lagoon',
    duration: 170, goal: { type: 'pipa', value: 6 }, weather: 'sun',
    desc: 'Corte seis pipas rivais cruzando a linha na velocidade. Cerol é opcional.',
    rivals: 2, mods: [], color: '#8ee58e',
  },
  {
    id: 'surfclassic', title: 'SURF CLÁSSICO', map: 'fy_pool_day',
    duration: 160, goal: { type: 'surf', value: 8 }, weather: 'sun',
    desc: 'Oito cristas clássicas. Só prancha, rampa e estilo — sem gate pra ajudar.',
    rivals: 3, mods: [], color: '#8fd3e8',
  },
  {
    id: 'dupla', title: 'CORRIDA DE DUPLAS', map: 'fy_pool_day',
    duration: 180, goal: { type: 'team', value: 9000 }, weather: 'sun',
    desc: 'Você e o Naldo contra dois rivais. O placar é da dupla, não seu.',
    rivals: 2, team: true, mods: [], color: '#8fd3e8',
    allies: [{ name: 'Naldo da Lan', variant: 'gelo', ai: 2 }],
  },
  {
    id: 'resgate', title: 'RESGATE NO TEMPORAL', map: 'pool_temple',
    duration: 190, goal: { type: 'flags', value: 3 }, weather: 'dusk',
    desc: 'Três bandeiras no templo. A Bruxinha cobre o corredor pra você.',
    rivals: 3, team: true, mods: [], color: '#b07cff',
    allies: [{ name: 'Bruxinha do Fotolog', variant: 'verde', ai: 3 }],
  },
  {
    id: 'hunt', title: 'CAÇA AO TESOURO', map: 'pool_temple',
    duration: 180, goal: { type: 'hunt', value: 7 }, weather: 'dusk',
    desc: 'Sete relíquias espalhadas. Os bots também estão caçando.',
    rivals: 3, hunt: true, mods: [], color: '#b07cff',
  },
  {
    id: 'arcade', title: 'ARCADE: SURF RUN', map: 'fy_iceworld',
    duration: 90, goal: { type: 'score', value: 2600 }, weather: 'glitch',
    desc: 'Uma ficha, 90 segundos e nenhum HUD. Igual máquina de shopping.',
    rivals: 2, noHud: true, mods: [], color: '#ffd24d',
  },
];

/* ============================================================ ANO 2000
   Eight festivals spread across the real calendar. Dates use 0-based months
   to match JavaScript. Easter is computed; Thanksgiving is the 4th Thursday.
   Each one is a real playable event with its own intro, weather and reward. */
export const HOLIDAYS = [
  {
    id: 'newyear', name: 'ANO NOVO 2000', label: 'DEZ 28 – JAN 6', color: '#ffe066',
    range: [[11, 28], [0, 6]], map: 'fy_pool_day', weather: 'night', mode: 'score',
    duration: 170, goal: { type: 'score', value: 12000 }, rivals: 3, ai: 4,
    mods: ['chaos'], track: 'newyear2000', xp: 650,
    desc: 'O servidor virou 2000 de novo. Fogos, contagem regressiva e o modem rezando.',
    intro: [
      { who: 'naldo', text: 'O relógio do servidor virou 2000 de novo. Não mexe na data, deixa acontecer.' },
      { who: 'bruxa', text: 'POSTEI OS FOGOS. 47 SCRAPS EM 3 MINUTOS. RECORDE.' },
      { who: 'zel', text: 'Então o primeiro gate do ano é meu. Feliz 2000 pra todo mundo.' },
    ],
    outro: [
      { who: 'naldo', text: 'O primeiro pool day do ano é o mais importante. Dizem.' },
      { who: 'kaka', text: 'kkk eu digo isso todo ano e ninguém acredita.' },
      { who: 'zel', text: 'Agora acredito. Bora pro próximo.' },
    ],
  },
  {
    id: 'carnival', name: 'CARNAVAL DA LAN', label: 'FEV 1 – MAR 10', color: '#ff8fc7',
    range: [[1, 1], [2, 10]], map: 'surf_lagoon', weather: 'sun', mode: 'gates',
    duration: 165, goal: { type: 'gates', value: 20 }, rivals: 3, ai: 3,
    mods: [], track: 'carnival2000', xp: 550,
    desc: 'Bloco do pool day: glitter no modem, marchinha no Winamp e 20 gates de folia.',
    intro: [
      { who: 'kaka', text: 'kkk bloco do pool day, sai da frente que eu tô com a caixa de som.' },
      { who: 'tia', text: 'FILHOTE, PASSEI TRÊS CAMADAS DE GLITTER NO MODEM. ELE TÁ FESTIVO.' },
      { who: 'zel', text: 'Então o mar vai desfilar. Vinte gates e ninguém derruba o roteador.' },
    ],
    outro: [
      { who: 'bruxa', text: 'O BLOCO RENDEU 300 FOTOS. A MARÉ TÁ NO FOTOLOG.' },
      { who: 'naldo', text: 'E o glitter não sai do teclado nunca mais.' },
      { who: 'zel', text: 'Valeu a pena. Carnaval é isso: areia e lag.' },
    ],
  },
  {
    id: 'easter', name: 'PÁSCOA NO PIER', label: 'PÁSCOA · 8 DIAS', color: '#8ee58e',
    easter: true, span: 4, map: 'surf_lagoon', weather: 'sun', mode: 'relics',
    duration: 160, goal: { type: 'relics', value: 8 }, rivals: 3, ai: 3,
    mods: [], track: 'easter2000', xp: 550,
    desc: 'Ovos de chocolate boiando na lagoa e oito relíquias escondidas na maré.',
    intro: [
      { who: 'ze', text: 'Baixei um ovo de páscoa. Tá em 88% desde ontem.' },
      { who: 'bruxa', text: 'TEM OVO ESCONDIDO EM CADA ILHA. EU SINTO. O FILTRO NÃO MENTE.' },
      { who: 'zel', text: 'Então vamos caçar. Oito relíquias e o coelho não vai me vencer.' },
    ],
    outro: [
      { who: 'tia', text: 'ACHEI UM OVO COM O NOME DO NALDO. VOCÊS SÃO MUITO CRIANÇAS.' },
      { who: 'ze', text: 'Eu baixei o coelho. Tá em 62%.' },
      { who: 'zel', text: 'Páscoa na lan house é isso: chocolate e conexão instável.' },
    ],
  },
  {
    id: 'festajunina', name: 'FESTA JUNINA DA VILA', label: 'JUN 1 – JUN 30', color: '#ff9f4d',
    range: [[5, 1], [5, 30]], map: 'pool_temple', weather: 'dusk', mode: 'score',
    duration: 170, goal: { type: 'score', value: 9000 }, rivals: 3, ai: 3,
    mods: [], track: 'junina2000', xp: 550,
    desc: 'Quadrilha no cais, bandeirinha no modem e um pool day com gosto de milho.',
    intro: [
      { who: 'tia', text: 'FESTA JUNINA NA LAN. QUEM NÃO DANÇAR PAGA A HORA.' },
      { who: 'naldo', text: 'O modem tá de quadrilha. Ele cai no compasso.' },
      { who: 'zel', text: 'Bora quadrilha aquática. Nove mil pontos e ninguém pisando no pé.' },
    ],
    outro: [
      { who: 'kaka', text: 'kkk o Naldo dançou melhor que surfa. Não conta pra ele.' },
      { who: 'tia', text: 'A TIA VIU. A TIA VÊ TUDO.' },
      { who: 'zel', text: 'Festa junina aprovada. Ano que vem tem de novo.' },
    ],
  },
  {
    id: 'halloween', name: 'HALLOWEEN DO MODEM', label: 'OUT 24 – OUT 31', color: '#b07cff',
    range: [[9, 24], [9, 31]], map: 'pool_temple', weather: 'night', mode: 'score',
    duration: 170, goal: { type: 'score', value: 11000 }, rivals: 3, ai: 4,
    mods: ['glitch'], track: 'halloween2000', xp: 650,
    desc: 'O servidor ficou assombrado. ZEL.EXE voltou com fantasia e o templo tá com névoa.',
    intro: [
      { who: 'exe', text: 'EU VOLTEI. E DESSA VEZ EU VIM FANTASIADO DE VOCÊ.' },
      { who: 'bruxa', text: 'O FILTRO DE HALLOWEEN É O MEU NATURAL. NEM PRECISEI EDITAR.' },
      { who: 'zel', text: 'Só não assusta o Naldo. Ele tem pressão e um modem de estimação.' },
    ],
    outro: [
      { who: 'exe', text: 'EU NÃO SOU ASSOMBRADO. SOU UM BUG COM SENTIMENTOS.' },
      { who: 'bruxa', text: 'POSTEI O SUSTO. 66 SCRAPS. NÚMERO DA BESTA.' },
      { who: 'zel', text: 'Halloween no arquipélago é assim: medo e placar.' },
    ],
  },
  {
    id: 'laniversario', name: 'ANIVERSÁRIO DA LAN', label: 'AGO 1 – AGO 7', color: '#8fd3e8',
    range: [[7, 1], [7, 7]], map: 'cs_surf_assault', weather: 'storm', mode: 'score',
    duration: 175, goal: { type: 'score', value: 10000 }, rivals: 3, ai: 4,
    mods: ['rogue'], track: 'rocknight', xp: 600,
    desc: 'O PC 4 faz aniversário. Bolo no balcão, trovão no servidor e uma run de presente.',
    intro: [
      { who: 'naldo', text: 'Hoje a lan house faz aniversário. O PC 4 tá de pé por milagre.' },
      { who: 'tia', text: 'FILHOTE, TROUXE BOLO. E TROUXE GUARDA-CHUVA, PORQUE O SERVIDOR TÁ TROVEJANDO.' },
      { who: 'zel', text: 'Então o presente é dez mil pontos no meio da tempestade. Bora.' },
    ],
    outro: [
      { who: 'ze', text: 'Baixei o parabéns. Tá em 87%.' },
      { who: 'naldo', text: 'A lan house agradece. O PC 4, nem tanto.' },
      { who: 'zel', text: 'Parabéns, lan. Que venham mais mil anos de modem.' },
    ],
  },
  {
    id: 'thanksgiving', name: 'AÇÃO DE GRAÇAS DA LAN', label: 'NOV · 4ª QUINTA', color: '#ffd24d',
    nth: { month: 10, weekday: 4, nth: 4, span: 4 }, map: 'de_surf_dust', weather: 'dusk',
    mode: 'gates', duration: 180, goal: { type: 'gates', value: 22 }, rivals: 3, ai: 4,
    mods: [], track: 'thanksgiving2000', xp: 650,
    desc: 'Peru na lan house, x-tudo de sobremesa e 22 gates pra agradecer.',
    intro: [
      { who: 'tia', text: 'AÇÃO DE GRAÇAS? AQUI A GENTE AGRADECE EM X-TUDO.' },
      { who: 'naldo', text: 'Eu agradeço se ninguém derrubar o roteador hoje. Só isso.' },
      { who: 'zel', text: 'Então vou agradecer passando 22 gates. Sem derrubar nada.' },
    ],
    outro: [
      { who: 'ze', text: 'Baixei o peru. Tá em 99%. Igual todo ano.' },
      { who: 'tia', text: 'A TIA TROUXE O PERU DE VERDADE. O DOWNLOAD É SÓ ENFEITE.' },
      { who: 'zel', text: 'Obrigado, galera. Pelo mar, pelo modem e pelo x-tudo.' },
    ],
  },
  {
    id: 'christmas', name: 'NATAL NA LAN', label: 'DEZ 1 – DEZ 27', color: '#ff8f6b',
    range: [[11, 1], [11, 27]], map: 'fy_iceworld', weather: 'snow', mode: 'score',
    duration: 190, goal: { type: 'score', value: 14000 }, rivals: 3, ai: 5,
    mods: ['rogue'], track: 'christmas2000', xp: 800,
    desc: 'Neve no pool day, luzinhas no modem e a lenda vestida de Papai Noel.',
    intro: [
      { who: 'tia', text: 'FILHOTE, O PAPAI NOEL DISCOU PRA LAN. ELE TÁ NO PC 2.' },
      { who: 'ze', text: 'Baixei o natal em 79%. O peru tá em 12%.' },
      { who: 'zel', text: 'Então o presente é uma run na neve. Ninguém abre antes do gate.' },
    ],
    outro: [
      { who: 'lenda', text: 'Eu não sabia que Papai Noel surfava. Descobri hoje.' },
      { who: 'bruxa', text: 'A FOTO DA NEVE BATEU 200 SCRAPS. NATAL MAIS 2000 IMPOSSÍVEL.' },
      { who: 'zel', text: 'Feliz Natal, galera. Guarda um x-tudo pro Zé.' },
    ],
  },
];

/* Cassette collection. Every track is generated by the in-game synth, so the
   OST is original and copyright-free. Tapes unlock across weeks of play. */
export const TAPES = [
  { id: 'tape_modem', track: 'menu2000', title: 'MODEM DE GARAGEM', unlock: { free: true } },
  { id: 'tape_pool', track: 'surfrock', title: 'POOL DAY 2000', unlock: { free: true } },
  { id: 'tape_sunset', track: 'sunset', title: 'PÔR DO SOL NA LAN', unlock: { free: true } },
  { id: 'tape_dawn', track: 'morning', title: 'DISKADA AO AMANHECER', unlock: { free: true } },
  { id: 'tape_room', track: 'hearth', title: 'FITA DO QUARTO', unlock: { free: true } },
  { id: 'tape_night', track: 'night', title: 'MSN DEPOIS DA MEIA-NOITE', unlock: { free: true } },
  { id: 'tape_rain', track: 'rain', title: 'CHUVA NO TELHADO', unlock: { chapters: 1 } },
  { id: 'tape_rift', track: 'rift', title: 'SERVIDOR SECRETO', unlock: { chapters: 3 } },
  { id: 'tape_flight', track: 'flight', title: 'VOO DO PELICANO', unlock: { chapters: 5 } },
  { id: 'tape_festival', track: 'festival', title: 'FESTA DA VILA', unlock: { chapters: 6 } },
  { id: 'tape_cabin', track: 'cabin', title: 'CABANA DO FOTOLOG', unlock: { chapters: 7 } },
  { id: 'tape_starfall', track: 'starfall', title: 'CHUVA DE ESTRELAS', unlock: { chapters: 9 } },
  { id: 'tape_surf', track: 'surf', title: 'MAR DE 2007', unlock: { runs: 3 } },
  { id: 'tape_storm', track: 'storm', title: 'TEMPESTADE DE 1999', unlock: { chapters: 5 } },
  { id: 'tape_glitch', track: 'glitch', title: 'ZEL.EXE', unlock: { chapters: 7 } },
  { id: 'tape_victory', track: 'victory', title: 'VITÓRIA NO ORKUT', unlock: { runs: 10 } },
  { id: 'tape_radical', track: 'radical', title: 'MODO RADICAL', unlock: { combo: 5 } },
  { id: 'tape_boss', track: 'boss', title: 'A LENDA', unlock: { legend: 1 } },
  { id: 'tape_garage', track: 'garage2000', title: 'GARAGEM 2000', unlock: { chapters: 4 } },
  { id: 'tape_rocknight', track: 'rocknight', title: 'ROCK DA VILA', unlock: { dailyStreak: 3 } },
  { id: 'tape_rainradio', track: 'rain2000', title: 'RÁDIO NA CHUVA', unlock: { dailyStreak: 7 } },
  { id: 'tape_winter', track: 'winter2000', title: 'INVERNO NA VILA', unlock: { holiday: 'christmas' } },
  { id: 'tape_christmas', track: 'christmas2000', title: 'NATAL NA LAN', unlock: { holiday: 'christmas' } },
  { id: 'tape_thanks', track: 'thanksgiving2000', title: 'AÇÃO DE GRAÇAS', unlock: { holiday: 'thanksgiving' } },
  { id: 'tape_easter', track: 'easter2000', title: 'PÁSCOA NO PIER', unlock: { holiday: 'easter' } },
  { id: 'tape_halloween', track: 'halloween2000', title: 'HALLOWEEN DO MODEM', unlock: { holiday: 'halloween' } },
  { id: 'tape_newyear', track: 'newyear2000', title: 'ANO NOVO 2000', unlock: { holiday: 'newyear' } },
  { id: 'tape_carnival', track: 'carnival2000', title: 'CARNAVAL DA LAN', unlock: { holiday: 'carnival' } },
  { id: 'tape_junina', track: 'junina2000', title: 'FESTA JUNINA', unlock: { holiday: 'festajunina' } },
  { id: 'tape_secret', track: 'dusk', title: 'FAIXA 0: O SEGREDO', unlock: { secret: true } },
];

export const ACHIEVEMENTS = [
  { id: 'first_run', title: 'CAIU NA ÁGUA', desc: 'Termine sua primeira run.', kind: 'runs', value: 1, xp: 50 },
  { id: 'runs10', title: 'CLIENTE FREQUENTE', desc: 'Termine 10 runs.', kind: 'runs', value: 10, xp: 100 },
  { id: 'runs50', title: 'MORADOR DA LAN', desc: 'Termine 50 runs.', kind: 'runs', value: 50, xp: 250 },
  { id: 'combo5', title: 'MEGA RADICAL', desc: 'Alcance um combo x5.', kind: 'combo', value: 5, xp: 100 },
  { id: 'combo9', title: 'INSANO 2000', desc: 'Alcance o combo máximo.', kind: 'combo', value: 9, xp: 300 },
  { id: 'mil1', title: 'MIL', desc: 'Bata um milestone de 1.000 pontos.', kind: 'milestone', value: 1000, xp: 50 },
  { id: 'mil10', title: 'DEZ MIL', desc: 'Bata um milestone de 10.000 pontos.', kind: 'milestone', value: 10000, xp: 250 },
  { id: 'gates100', title: 'PORTÃO DE 2007', desc: 'Passe 100 gates na vida.', kind: 'gates', value: 100, xp: 150 },
  { id: 'gates500', title: 'CHAVEIRO DO ARQUIPÉLAGO', desc: 'Passe 500 gates na vida.', kind: 'gates', value: 500, xp: 400 },
  { id: 'relics8', title: 'COLECIONADOR', desc: 'Junte as oito relíquias.', kind: 'relics', value: 8, xp: 200 },
  { id: 'chapters5', title: 'MEIO CAMINHO', desc: 'Vença 5 capítulos.', kind: 'chapters', value: 5, xp: 150 },
  { id: 'chapters10', title: 'DONO DA HISTÓRIA', desc: 'Vença os 10 capítulos.', kind: 'chapters', value: 10, xp: 400 },
  { id: 'legend1', title: 'A LENDA APARECE', desc: 'Vença a primeira prova da lenda.', kind: 'legend', value: 1, xp: 200 },
  { id: 'legend5', title: 'ARQUIVO ABERTO', desc: 'Vença todas as provas da lenda.', kind: 'legend', value: 5, xp: 600 },
  { id: 'daily3', title: 'ROTINA DE 2007', desc: 'Complete 3 desafios diários seguidos.', kind: 'dailyStreak', value: 3, xp: 200 },
  { id: 'daily7', title: 'SEMANINHA COMPLETA', desc: 'Complete 7 desafios diários seguidos.', kind: 'dailyStreak', value: 7, xp: 500 },
  { id: 'holidays3', title: 'CALENDÁRIO DA LAN', desc: 'Complete 3 festas do ano.', kind: 'holidays', value: 3, xp: 250 },
  { id: 'holidays8', title: 'O ANO INTEIRO', desc: 'Complete as oito festas do ano.', kind: 'holidays', value: 8, xp: 800 },
  { id: 'tapes10', title: 'FITA DEMO', desc: 'Desbloqueie 10 fitas.', kind: 'tapes', value: 10, xp: 150 },
  { id: 'tapes20', title: 'DISCOTECA 2000', desc: 'Desbloqueie 20 fitas.', kind: 'tapes', value: 20, xp: 300 },
  { id: 'secret1', title: 'OVO DE PÁSCOA', desc: 'Achou um segredo escondido no jogo.', kind: 'eggs', value: 1, xp: 100 },
  { id: 'score15k', title: 'PLACAR DE FLIPERAMA', desc: 'Faça 15.000 pontos em uma run.', kind: 'score', value: 15000, xp: 300 },
  { id: 'bonus1', title: 'BÔNUS DE VERDADE', desc: 'Feche uma fase bônus do arquivo.', kind: 'bonus', value: 1, xp: 150 },
  { id: 'bonus4', title: 'ARQUIVO COMPLETO', desc: 'Feche quatro fases bônus.', kind: 'bonus', value: 4, xp: 400 },
  { id: 'bonus6', title: 'A FASE QUE NÃO EXISTE', desc: 'Feche as seis fases bônus.', kind: 'bonus', value: 6, xp: 800 },
  { id: 'eggs3', title: 'CAÇADOR DE OVOS', desc: 'Ache três segredos no jogo.', kind: 'eggs', value: 3, xp: 250 },
  { id: 'modems7', title: 'MODEM DOURADO', desc: 'Ache o modem dourado nas sete ilhas.', kind: 'modems', value: 7, xp: 600 },
  { id: 'events4', title: 'FESTA DA COMUNIDADE', desc: 'Complete quatro eventos da comunidade.', kind: 'events', value: 4, xp: 300 },
];

export const COMMUNITY_LINES = [
  'MURAL: alguém deixou um CD do Linkin Park no PC 3. Obrigado, alguém.',
  'MURAL: o time do Zé ganhou o mutirão sem o Zé perceber. Ele tá em 99%.',
  'MURAL: a lan house vai abrir domingo. O modem não confirmou presença.',
  'MURAL: foto do pôr do sol no Fotolog bateu 47 scraps. Recorde do servidor.',
  'MURAL: quem achou o mouse de bolinha, favor devolver. Ele tem sentimentos.',
];

export const NPC_CHATTER = [
  ['naldo', 'bruxa', 'A internet caiu de novo. Já é tradição.'] ,
  ['kaka', 'ze', 'kkk baixou o quê? 14 horas de vídeo?'] ,
  ['bruxa', 'naldo', 'NALDO, O FILTRO DO FOTOLOG QUEBROU.'] ,
  ['ze', 'kaka', 'TÔ EM 99%. NÃO TOCA NO MODEM.'] ,
  ['naldo', 'ze', 'Se baixar mais um CD, a lan fecha.'] ,
  ['kaka', 'bruxa', 'Posta a foto do gate que eu perdi. Quero ver.'] ,
];
