/* =========================================================================
   i18n — PT-BR / English / Español with automatic detection.
   The game is authored in Portuguese, so the dictionary is keyed by the PT
   string itself: drawText() localises every literal it renders and anything
   not translated falls back to the original line instead of breaking.
   ========================================================================= */

export const LOCALES = ['auto', 'pt', 'en', 'es'];

export const LOCALE_NAMES = {
  auto: 'AUTO', pt: 'PORTUGUÊS', en: 'ENGLISH', es: 'ESPAÑOL',
};

const state = { locale: 'auto', lang: 'pt' };

function browserLang() {
  const list = (typeof navigator !== 'undefined' && (navigator.languages?.length
    ? navigator.languages : [navigator.language]))
    || (typeof navigator !== 'undefined' ? [navigator.language] : []);
  for (const raw of list) {
    const code = String(raw || '').toLowerCase().slice(0, 2);
    if (code === 'en') return 'en';
    if (code === 'es') return 'es';
    if (code === 'pt') return 'pt';
  }
  return 'pt';
}

export function resolveLocale(locale = state.locale) {
  if (locale === 'en' || locale === 'es' || locale === 'pt') return locale;
  return browserLang();
}

export function setLocale(locale) {
  state.locale = LOCALES.includes(locale) ? locale : 'auto';
  state.lang = resolveLocale(state.locale);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = state.lang === 'pt' ? 'pt-BR' : state.lang;
  }
  return state.lang;
}

/* Extra dictionaries (story dialogue, item names) register at boot so the
   engine layer stays free of game content. */
export function registerLexicon(dict) {
  for (const key in dict) {
    if (!Object.prototype.hasOwnProperty.call(LEX, key)) LEX[key] = dict[key];
  }
  return LEX;
}

export function getLocale() { return state.locale; }
export function getLang() { return state.lang; }

export function cycleLocale(dir = 1) {
  const at = Math.max(0, LOCALES.indexOf(state.locale));
  const next = LOCALES[(at + (dir > 0 ? 1 : LOCALES.length - 1)) % LOCALES.length];
  setLocale(next);
  return next;
}

export function languageLabel() {
  const name = LOCALE_NAMES[state.locale] || 'AUTO';
  if (state.locale === 'auto') return `AUTO · ${state.lang.toUpperCase()}`;
  return name;
}

/* PT source → [english, español] */
const LEX = {
  // ---------------------------------------------------------------- menu
  'HISTÓRIA / CARREIRA': ['STORY / CAREER', 'HISTORIA / CARRERA'],
  'a jornada do Zel': ["Zel's journey", 'la travesía de Zel'],
  'ARQUIPÉLAGO 2000': ['ARCHIPELAGO 2000', 'ARCHIPIÉLAGO 2000'],
  'modo livre entre as ilhas': ['free ride between the islands', 'modo libre entre las islas'],
  'termine o capítulo 1': ['finish chapter 1', 'termina el capítulo 1'],
  'COMPETITIVO': ['COMPETITIVE', 'COMPETITIVO'],
  'bate e volta no pool day': ['quick laps at pool day', 'ida y vuelta en pool day'],
  'MINIGAMES': ['MINIGAMES', 'MINIJUEGOS'],
  'o fliperama da lan house': ['the lan house arcade', 'el arcade de la lan house'],
  'PÓS-GAME: A LENDA ZEL': ['POST-GAME: THE ZEL LEGEND', 'POSJUEGO: LA LEYENDA ZEL'],
  'lenda + rolês + liga': ['legend + hangs + league', 'leyenda + salidas + liga'],
  'vença a história': ['beat the story', 'gana la historia'],
  'VILA 2000 · MODO VIDA': ['VILLAGE 2000 · LIFE MODE', 'VILLA 2000 · MODO VIDA'],
  'rotina, NPCs, comida e sono': ['routine, NPCs, food and sleep', 'rutina, NPCs, comida y sueño'],
  'termine o capítulo 10': ['finish chapter 10', 'termina el capítulo 10'],
  'BÔNUS & ARQUIVO': ['BONUS & ARCHIVE', 'BONUS Y ARCHIVO'],
  'fases bônus, modems e segredos': ['bonus stages, modems and secrets', 'fases bonus, módems y secretos'],
  'liga, desliga e joga do seu jeito': ['toggle it all and play your way', 'activa, desactiva y juega a tu modo'],
  'OPÇÕES': ['OPTIONS', 'OPCIONES'],
  'som, CRT, tela': ['sound, CRT, screen', 'sonido, CRT, pantalla'],
  'PLACAR DA ILHA': ['ISLAND SCOREBOARD', 'MARCADOR DE LA ISLA'],
  'ZEL (VOCÊ)': ['ZEL (YOU)', 'ZEL (TÚ)'],
  'o campeonato mais 2007 da sua vida': ['the most 2007 championship of your life', 'el campeonato más 2007 de tu vida'],
  'software livre de zoeira · remixa à vontade': ['free messing-around software · remix it', 'software libre de broma · remézclalo'],
  'surfe, zoeira e internet discada': ['surf, banter and dial-up internet', 'surf, bromas e internet telefónica'],
  'PRESSIONE  E  PARA CONTINUAR': ['PRESS  E  TO CONTINUE', 'PULSA  E  PARA CONTINUAR'],
  'PRESSIONE  E  PARA COMEÇAR': ['PRESS  E  TO START', 'PULSA  E  PARA EMPEZAR'],
  'ou clique em qualquer lugar': ['or tap anywhere', 'o toca en cualquier lugar'],
  '7 mapas · 8 festas · 30 fitas · 22 conquistas · pós-game': [
    '7 maps · 8 parties · 30 tapes · 22 achievements · post-game',
    '7 mapas · 8 fiestas · 30 cintas · 22 logros · posjuego',
  ],

  // -------------------------------------------------------------- options
  'Ajuste o som e o nível de nostalgia.': ['Tune the sound and the nostalgia level.', 'Ajusta el sonido y el nivel de nostalgia.'],
  'Música': ['Music', 'Música'],
  'Efeitos': ['Effects', 'Efectos'],
  'Qualidade': ['Quality', 'Calidad'],
  'Tremor de tela': ['Screen shake', 'Vibración de pantalla'],
  'Scanlines CRT': ['CRT scanlines', 'Líneas CRT'],
  'Minimapa': ['Minimap', 'Minimapa'],
  'Textos de zoeira': ['Banter lines', 'Textos de broma'],
  'Idioma': ['Language', 'Idioma'],
  'LIGADO': ['ON', 'ACTIVADO'],
  'DESLIGADO': ['OFF', 'DESACTIVADO'],
  'VOLTAR': ['BACK', 'VOLVER'],
  'ZERAR PROGRESSO': ['ERASE PROGRESS', 'BORRAR PROGRESO'],
  'Aperte de novo pra confirmar.': ['Press again to confirm.', 'Pulsa otra vez para confirmar.'],
  'DICA DO NALDO': ["NALDO'S TIP", 'CONSEJO DE NALDO'],
  'BAIXA': ['LOW', 'BAJA'],
  'MÉDIA': ['MEDIUM', 'MEDIA'],
  'ALTA': ['HIGH', 'ALTA'],
  'BAIXO': ['LOW', 'BAJO'],
  'MÉDIO': ['MEDIUM', 'MEDIO'],
  'ALTO': ['HIGH', 'ALTO'],
  'Se o jogo travar, culpe o modem.': ["If the game stutters, blame the modem.", 'Si el juego se traba, culpa al módem.'],
  'Shift gasta turbo, mas vale cada centavo.': ['Shift burns turbo, but it is worth every cent.', 'Shift gasta turbo, pero vale cada centavo.'],
  'Manobra no ar enche o combo.': ['Tricks in the air build the combo.', 'Un truco en el aire llena el combo.'],
  'A parede de água machuca. Pule.': ['The water wall hurts. Jump.', 'La pared de agua duele. Salta.'],
  'Não existe lag: existe emoção.': ['There is no lag: only emotion.', 'No existe lag: existe emoción.'],
  'Se cair, aperte E e finja que foi de propósito.': ['If you fall, press E and pretend it was on purpose.', 'Si caes, pulsa E y finge que fue a propósito.'],

  // ---------------------------------------------------------------- pause
  'PAUSA': ['PAUSED', 'PAUSA'],
  'respira. o mar espera.': ['breathe. the sea waits.', 'respira. el mar espera.'],
  'Continuar': ['Continue', 'Continuar'],
  'Reiniciar': ['Restart', 'Reiniciar'],
  'Sair': ['Quit', 'Salir'],
  'WASD desliza · SHIFT turbo · ESPAÇO ollie · J/K/L manobra': [
    'WASD carve · SHIFT turbo · SPACE ollie · J/K/L trick',
    'WASD desliza · SHIFT turbo · ESPACIO ollie · J/K/L truco',
  ],
  'ESC volta ao jogo': ['ESC back to the game', 'ESC vuelve al juego'],

  // -------------------------------------------------------------- results
  'VITÓRIA!': ['VICTORY!', '¡VICTORIA!'],
  'QUASE LÁ...': ['SO CLOSE...', 'CASI...'],
  'PONTOS': ['POINTS', 'PUNTOS'],
  'LUGAR': ['PLACE', 'PUESTO'],
  'MELHOR COMBO': ['BEST COMBO', 'MEJOR COMBO'],
  'GATES': ['GATES', 'PUERTAS'],
  'RELÍQUIAS': ['RELICS', 'RELIQUIAS'],
  'QUEDAS': ['BAILS', 'CAÍDAS'],
  'PRESSIONE  E  PARA CONTINUAR ': ['PRESS  E  TO CONTINUE ', 'PULSA  E  PARA CONTINUAR '],

  // ------------------------------------------------------------------ HUD
  'POSIÇÃO': ['POSITION', 'POSICIÓN'],
  'MISSÕES': ['QUESTS', 'MISIONES'],
  'LIVRE': ['FREE', 'LIBRE'],
  'TURBO': ['TURBO', 'TURBO'],
  'BANDEIRA': ['FLAG', 'BANDERA'],
  'TIME': ['TEAM', 'EQUIPO'],
  'META': ['GOAL', 'META'],
  'CAPTURAS': ['CAPTURES', 'CAPTURAS'],
  'PIPAS': ['KITES', 'COMETAS'],
  'ONDAS': ['WAVES', 'OLAS'],
  'PLANTÃO': ['NEWSROOM', 'ÚLTIMA HORA'],
  'PREPARA': ['READY', 'PREPARA'],
  'VAI!': ['GO!', '¡YA!'],
  'WASD · SHIFT · ESPAÇO · J/K/L': ['WASD · SHIFT · SPACE · J/K/L', 'WASD · SHIFT · ESPACIO · J/K/L'],

  // ---------------------------------------------------------- mode labels
  'HISTÓRIA': ['STORY', 'HISTORIA'],
  'LIGA': ['LEAGUE', 'LIGA'],
  'A LENDA': ['THE LEGEND', 'LA LEYENDA'],
  'ROLÊ': ['HANG', 'SALIDA'],
  'FESTA DO ANO': ['PARTY OF THE YEAR', 'FIESTA DEL AÑO'],
  'DESAFIO DO DIA': ['DAILY CHALLENGE', 'RETO DEL DÍA'],
  'MODO LIVRE': ['FREE MODE', 'MODO LIBRE'],
  'BÔNUS': ['BONUS', 'BONUS'],
  'VIDA 2000': ['LIFE 2000', 'VIDA 2000'],

  // -------------------------------------------------------- banners/toasts
  'META BATIDA!': ['GOAL CLEARED!', '¡META CUMPLIDA!'],
  'TURBO CHEIO!': ['TURBO FULL!', '¡TURBO LLENO!'],
  'CAPTURA!': ['CAPTURE!', '¡CAPTURA!'],
  'CAPTURA DO TIME!': ['TEAM CAPTURE!', '¡CAPTURA DEL EQUIPO!'],
  'MODEM DOURADO': ['GOLDEN MODEM', 'MÓDEM DORADO'],
  'CAÇA COMPLETA': ['HUNT COMPLETE', 'CAZA COMPLETA'],
  'PAREDE DE ÁGUA!': ['WATER WALL!', '¡PARED DE AGUA!'],
  'A ONDA TE LEVOU!': ['THE WAVE GOT YOU!', '¡LA OLA TE LLEVÓ!'],
  'SALTO ÉPICO': ['EPIC JUMP', 'SALTO ÉPICO'],
  'TUBARÃO!': ['SHARK!', '¡TIBURÓN!'],
  'WIPEOUT!': ['WIPEOUT!', '¡CAÍDA!'],

  // ------------------------------------------------- screens / misc labels
  'VOLTAR AO MENU': ['BACK TO MENU', 'VOLVER AL MENÚ'],
  'CONTINUAR': ['CONTINUE', 'CONTINUAR'],
  'JOGAR': ['PLAY', 'JUGAR'],
  'SAIR': ['QUIT', 'SALIR'],
  'GALERIA': ['GALLERY', 'GALERÍA'],
  'CONQUISTAS': ['ACHIEVEMENTS', 'LOGROS'],
  'FITAS': ['TAPES', 'CINTAS'],
  'RELÍQUIAS': ['RELICS', 'RELIQUIAS'],
  'ELENCO': ['CAST', 'ELENCO'],
  'FESTAS': ['PARTIES', 'FIESTAS'],
  'BÔNUS': ['BONUS', 'BONUS'],
  'CRÉDITOS': ['CREDITS', 'CRÉDITOS'],
  'MAPA': ['MAP', 'MAPA'],
  'TEMPO': ['TIME', 'TIEMPO'],
  'VENTO': ['WIND', 'VIENTO'],
  'CLIMA': ['WEATHER', 'CLIMA'],
  'DIFICULDADE': ['DIFFICULTY', 'DIFICULTAD'],
  '[E] continuar': ['[E] continue', '[E] continuar'],
  'NÍVEL': ['LEVEL', 'NIVEL'],
};

/* Whole sentences that change with a number. Checked when the exact lookup
   misses, so "Passe 24 gates" becomes "Clear 24 gates" without editing every
   caller. */
const RULES = [
  [/^(\d+)º LUGAR$/, (m) => [`${m[1]}ST PLACE`, `${m[1]}.º PUESTO`]],
  [/^(\d+)º de (\d+)$/, (m) => [`${m[1]} of ${m[2]}`, `${m[1]} de ${m[2]}`]],
  [/^recorde (.+)$/, (m) => [`best ${m[1]}`, `récord ${m[1]}`]],
  [/^milestones nesta run: (\d+)$/, (m) => [`milestones this run: ${m[1]}`, `hitos en esta partida: ${m[1]}`]],
  [/^Passe (\d+) gates$/i, (m) => [`Clear ${m[1]} gates`, `Pasa ${m[1]} puertas`]],
  [/^passe (\d+) gates$/i, (m) => [`clear ${m[1]} gates`, `pasa ${m[1]} puertas`]],
  [/^Pegue (\d+) relíquias$/i, (m) => [`Collect ${m[1]} relics`, `Recoge ${m[1]} reliquias`]],
  [/^Corte (\d+) pipas$/i, (m) => [`Cut ${m[1]} kites`, `Corta ${m[1]} cometas`]],
  [/^Faça (\d+) pontos$/i, (m) => [`Score ${m[1]} points`, `Haz ${m[1]} puntos`]],
  [/^GATE \+(\d+)$/, (m) => [`GATE +${m[1]}`, `PUERTA +${m[1]}`]],
  [/^PIPA CORTADA (\d+)\/(\d+)$/, (m) => [`KITE CUT ${m[1]}/${m[2]}`, `COMETA CORTADA ${m[1]}/${m[2]}`]],
  [/^ONDA CLÁSSICA (\d+)\/(\d+)$/, (m) => [`CLASSIC WAVE ${m[1]}/${m[2]}`, `OLA CLÁSICA ${m[1]}/${m[2]}`]],
  [/^BANDEIRA (\d+) × (\d+)$/, (m) => [`FLAG ${m[1]} × ${m[2]}`, `BANDERA ${m[1]} × ${m[2]}`]],
  [/^TIME (.+)$/, (m) => [`TEAM ${m[1]}`, `EQUIPO ${m[1]}`]],
  [/^MILESTONE (\d+)$/, (m) => [`MILESTONE ${m[1]}`, `HITO ${m[1]}`]],
  [/^PRÓXIMA FESTA: (.+) EM (\d+)D$/, (m) => [`NEXT PARTY: ${m[1]} IN ${m[2]}D`, `PRÓXIMA FIESTA: ${m[1]} EN ${m[2]}D`]],
  [/^AUTO \((.+)\)$/, (m) => [`AUTO (${t(m[1])})`, `AUTO (${t(m[1])})`]],
  [/^Qualidade: (.+)$/, (m) => [`Quality: ${t(m[1])}`, `Calidad: ${t(m[1])}`]],
  [/^FESTA: (.+)$/, (m) => [`PARTY: ${m[1]}`, `FIESTA: ${m[1]}`]],

  // -------------------------------------------------- counters, HUD, records
  [/^CAPÍTULO (\d+) DESBLOQUEADO$/, (m) => [`CHAPTER ${m[1]} UNLOCKED`, `CAPÍTULO ${m[1]} DESBLOQUEADO`]],
  [/^Faça ([\d.,]+) pontos$/, (m) => [`Score ${m[1]} points`, `Haz ${m[1]} puntos`]],
  [/^RECORDE (.+) · VITÓRIAS (\d+)$/, (m) => [`RECORD ${m[1]} · WINS ${m[2]}`, `RÉCORD ${m[1]} · VICTORIAS ${m[2]}`]],
  [/^RECORDE (.+)$/, (m) => [`RECORD ${m[1]}`, `RÉCORD ${m[1]}`]],
  [/^JOGADAS (\d+)$/, (m) => [`PLAYS ${m[1]}`, `PARTIDAS ${m[1]}`]],
  [/^FALHAS (.+)$/, (m) => [`FAILS ${m[1]}`, `FALLOS ${m[1]}`]],
  [/^PIPAS (.+)$/, (m) => [`KITES ${m[1]}`, `COMETAS ${m[1]}`]],
  [/^(\d+) QUEDAS$/, (m) => [`${m[1]} FALLS`, `${m[1]} CAÍDAS`]],
  [/^MINAS (.+)$/, (m) => [`MINES ${m[1]}`, `MINAS ${m[1]}`]],
  [/^HITO (\d+)$/, (m) => [`MILESTONE ${m[1]}`, `HITO ${m[1]}`]],
  [/^(\d+)º \/ (\d+)º$/, (m) => [`${m[1]} / ${m[2]}`, `${m[1]} / ${m[2]}`]],
  [/^(\d+) XP pro próximo$/, (m) => [`${m[1]} XP to next`, `${m[1]} XP para el próximo`]],
  [/^(\d+) dias de desafio$/, (m) => [`${m[1]}-day streak`, `${m[1]} días de desafío`]],
  [/^(\d+)\/(\d+) ilhas$/, (m) => [`${m[1]}/${m[2]} islands`, `${m[1]}/${m[2]} islas`]],
  [/^(\d+)\/(\d+) missões$/, (m) => [`${m[1]}/${m[2]} missions`, `${m[1]}/${m[2]} misiones`]],
  [/^streak (\d+)$/, (m) => [`streak ${m[1]}`, `racha ${m[1]}`]],
  [/^CONQUISTAS (\d+)\/(\d+)$/, (m) => [`ACHIEVEMENTS ${m[1]}/${m[2]}`, `LOGROS ${m[1]}/${m[2]}`]],
  [/^CONQUISTA: (.+)$/, (m) => [`ACHIEVEMENT: ${t(m[1])}`, `LOGRO: ${t(m[1])}`]],
  [/^FITAS (\d+)\/(\d+)$/, (m) => [`TAPES ${m[1]}/${m[2]}`, `CINTAS ${m[1]}/${m[2]}`]],
  [/^RELÍQUIAS (\d+)\/(\d+)$/, (m) => [`RELICS ${m[1]}/${m[2]}`, `RELIQUIAS ${m[1]}/${m[2]}`]],
  [/^SEGREDOS (\d+)$/, (m) => [`SECRETS ${m[1]}`, `SECRETOS ${m[1]}`]],
  [/^FASES (.+) · MODEMS (.+) · SEGREDOS (.+)$/, (m) => [`STAGES ${m[1]} · MODEMS ${m[2]} · SECRETS ${m[3]}`, `FASES ${m[1]} · MÓDEMS ${m[2]} · SECRETOS ${m[3]}`]],
  [/^MISSÕES (\d+)\/(\d+)$/, (m) => [`MISSIONS ${m[1]}/${m[2]}`, `MISIONES ${m[1]}/${m[2]}`]],
  [/^MISSÃO: (.+) \+(\d+) XP$/, (m) => [`MISSION: ${t(m[1])} +${m[2]} XP`, `MISIÓN: ${t(m[1])} +${m[2]} XP`]],
  [/^EVENTOS (\d+)\/(\d+)$/, (m) => [`EVENTS ${m[1]}/${m[2]}`, `EVENTOS ${m[1]}/${m[2]}`]],
  [/^ROLÊS (\d+)\/(\d+)$/, (m) => [`HANGOUTS ${m[1]}/${m[2]}`, `SALIDAS ${m[1]}/${m[2]}`]],
  [/^ROLÊ COMPLETO COM (.+)\.$/, (m) => [`HANG COMPLETE WITH ${m[1]}.`, `SALIDA COMPLETA CON ${m[1]}.`]],
  [/^A LENDA · (\d+)\/(\d+)$/, (m) => [`THE LEGEND · ${m[1]}/${m[2]}`, `LA LEYENDA · ${m[1]}/${m[2]}`]],
  [/^LENDA (\d+)\/(\d+) VENCIDA\. A PRÓXIMA PROVA ABRIU\.$/, (m) => [`LEGEND ${m[1]}/${m[2]} CLEARED. THE NEXT CHALLENGE IS OPEN.`, `LEYENDA ${m[1]}/${m[2]} GANADA. LA PRÓXIMA PRUEBA SE ABRIÓ.`]],
  [/^LENDA (\d+)\/(\d+)$/, (m) => [`LEGEND ${m[1]}/${m[2]}`, `LEYENDA ${m[1]}/${m[2]}`]],
  [/^DIA (\d+) · (.+)$/, (m) => [`DAY ${m[1]} · ${t(m[2])}`, `DÍA ${m[1]} · ${t(m[2])}`]],
  [/^ONDA (\d+) SOBREVIVIDA$/, (m) => [`WAVE ${m[1]} SURVIVED`, `OLA ${m[1]} SOBREVIVIDA`]],
  [/^ONDA (\d+)\/(\d+)$/, (m) => [`WAVE ${m[1]}/${m[2]}`, `OLA ${m[1]}/${m[2]}`]],
  [/^ONDAS (\d+)$/, (m) => [`WAVES ${m[1]}`, `OLAS ${m[1]}`]],
  [/^PISTA (\d+)\/(\d+)$/, (m) => [`CLUE ${m[1]}/${m[2]}`, `PISTA ${m[1]}/${m[2]}`]],
  [/^PISTA (\d+)$/, (m) => [`CLUE ${m[1]}`, `PISTA ${m[1]}`]],
  [/^PISTAS (\d+)$/, (m) => [`CLUES ${m[1]}`, `PISTAS ${m[1]}`]],
  [/^TRABALHO (\d+)\/(\d+)$/, (m) => [`JOB ${m[1]}/${m[2]}`, `TRABAJO ${m[1]}/${m[2]}`]],
  [/^TRABALHO: (.+)$/, (m) => [`JOB: ${t(m[1])}`, `TRABAJO: ${t(m[1])}`]],
  [/^E · TRABALHO: (.+) \((\d+)\/(\d+)\)$/, (m) => [`E · JOB: ${t(m[1])} (${m[2]}/${m[3]})`, `E · TRABAJO: ${t(m[1])} (${m[2]}/${m[3]})`]],
  [/^E · conversar com (.+)$/, (m) => [`E · talk to ${m[1]}`, `E · hablar con ${m[1]}`]],
  [/^E · vasculhar (.+) por material$/, (m) => [`E · search ${t(m[1])} for material`, `E · registrar ${t(m[1])} por material`]],
  [/^turno salvo: (.+)$/, (m) => [`shift saved: ${t(m[1])}`, `turno guardado: ${t(m[1])}`]],
  [/^Trabalho concluído: (.+)\. O Naldo anotou no caderno\.$/, (m) => [`Job done: ${t(m[1])}. Naldo wrote it in the notebook.`, `Trabajo terminado: ${t(m[1])}. Naldo lo anotó en el cuaderno.`]],
  [/^Turno em aberto: (.+)\. (\d+)\/(\d+)\. Próxima parada: (.+)\.$/, (m) => [`Open shift: ${t(m[1])}. ${m[2]}/${m[3]}. Next stop: ${t(m[4])}.`, `Turno abierto: ${t(m[1])}. ${m[2]}/${m[3]}. Próxima parada: ${t(m[4])}.`]],
  [/^Fase bônus trancada: (.+)\.$/, (m) => [`Bonus stage locked: ${t(m[1])}.`, `Fase bonus bloqueada: ${t(m[1])}.`]],
  [/^FITA DESBLOQUEADA: (.+)$/, (m) => [`TAPE UNLOCKED: ${t(m[1])}`, `CINTA DESBLOQUEADA: ${t(m[1])}`]],
  [/^ACHOU: (.+)$/, (m) => [`FOUND: ${t(m[1])}`, `ENCONTRASTE: ${t(m[1])}`]],
  [/^Bônus: (.+)$/, (m) => [`Bonus: ${t(m[1])}`, `Bonus: ${t(m[1])}`]],
  [/^Objetivo: (.+)$/, (m) => [`Objective: ${t(m[1])}`, `Objetivo: ${t(m[1])}`]],
  [/^PARTIDA RÁPIDA · (.+)$/, (m) => [`QUICK MATCH · ${t(m[1])}`, `PARTIDA RÁPIDA · ${t(m[1])}`]],
  [/^MODO LIVRE · (.+)$/, (m) => [`FREE MODE · ${t(m[1])}`, `MODO LIBRE · ${t(m[1])}`]],
  [/^DESAFIO DO DIA · (.+)$/, (m) => [`DAILY CHALLENGE · ${t(m[1])}`, `DESAFÍO DEL DÍA · ${t(m[1])}`]],
  [/^DESAFIO COMPLETO · STREAK (\d+)( DIAS)?$/, (m) => [`CHALLENGE COMPLETE · STREAK ${m[1]}${m[2] ? ' DAYS' : ''}`, `DESAFÍO COMPLETO · RACHA ${m[1]}${m[2] ? ' DÍAS' : ''}`]],
  [/^MODEM DOURADO: \+(\d+) XP \((\d+)\/(\d+)\)$/, (m) => [`GOLDEN MODEM: +${m[1]} XP (${m[2]}/${m[3]})`, `MÓDEM DORADO: +${m[1]} XP (${m[2]}/${m[3]})`]],
  [/^CAÇA (\d+)\/(\d+) · \+1 chip$/, (m) => [`HUNT ${m[1]}/${m[2]} · +1 chip`, `CAZA ${m[1]}/${m[2]} · +1 chip`]],
  [/^Nova estação: (.+)$/, (m) => [`New season: ${t(m[1])}`, `Nueva estación: ${t(m[1])}`]],
  [/^O tempo virou: (.+)\.$/, (m) => [`The weather turned: ${t(m[1])}.`, `El tiempo cambió: ${t(m[1])}.`]],
  [/^Terminou em (\d+)º\. Treina mais\.$/, (m) => [`Finished ${m[1]}. Train more.`, `Terminaste ${m[1]}º. Entrena más.`]],
  [/^A LIGA ACABOU NO HEAT (\d+)\. TOTAL (\d+) PONTOS\.$/, (m) => [`THE LEAGUE ENDED IN HEAT ${m[1]}. TOTAL ${m[2]} POINTS.`, `LA LIGA TERMINÓ EN EL HEAT ${m[1]}. TOTAL ${m[2]} PUNTOS.`]],
  [/^HEAT VENCIDO! TOTAL (\d+) PONTOS$/, (m) => [`HEAT WON! TOTAL ${m[1]} POINTS`, `¡HEAT GANADO! TOTAL ${m[1]} PUNTOS`]],
  [/^PROVA DA LAN: (.+) — (VENCIDA|PENDENTE)$/, (m) => [`LAN CHALLENGE: ${t(m[1])} — ${m[2] === 'VENCIDA' ? 'CLEARED' : 'PENDING'}`, `PRUEBA DEL CIBER: ${t(m[1])} — ${m[2] === 'VENCIDA' ? 'GANADA' : 'PENDIENTE'}`]],
  [/^PROVA DO CAPÍTULO: (.+)\. Vence primeiro, surfa depois\.$/, (m) => [`CHAPTER CHALLENGE: ${t(m[1])}. Win first, surf later.`, `PRUEBA DEL CAPÍTULO: ${t(m[1])}. Gana primero, surfea después.`]],
  [/^PROVA VENCIDA: (.+) · \+(\d+) XP\. Agora o mar\.$/, (m) => [`CHALLENGE CLEARED: ${t(m[1])} · +${m[2]} XP. Now the sea.`, `PRUEBA GANADA: ${t(m[1])} · +${m[2]} XP. Ahora el mar.`]],
  [/^A prova \((.+)\) não caiu\. Tenta de novo\.$/, (m) => [`The ${t(m[1])} challenge didn't drop. Try again.`, `La prueba (${t(m[1])}) no cayó. Inténtalo otra vez.`]],
  [/^Rolê: colete (\d+) relíquias com a galera$/, (m) => [`Hangout: collect ${m[1]} relics with the crew`, `Salida: recoge ${m[1]} reliquias con la banda`]],
  [/^Rolê: passe (\d+) gates com a galera$/, (m) => [`Hangout: clear ${m[1]} gates with the crew`, `Salida: pasa ${m[1]} puertas con la banda`]],
  [/^capture (\d+) bandeiras$/i, (m) => [`capture ${m[1]} flags`, `captura ${m[1]} banderas`]],
  [/^Capture (\d+) bandeiras rivais e leve pra sua base$/, (m) => [`Capture ${m[1]} rival flags and bring them home`, `Captura ${m[1]} banderas rivales y llévalas a tu base`]],
  [/^Capture (\d+) bandeiras$/, (m) => [`Capture ${m[1]} flags`, `Captura ${m[1]} banderas`]],
  [/^Corte (\d+) pipas rivais na velocidade$/, (m) => [`Cut ${m[1]} rival kites at speed`, `Corta ${m[1]} cometas rivales a velocidad`]],
  [/^Corte (\d+) pipas rivais$/, (m) => [`Cut ${m[1]} rival kites`, `Corta ${m[1]} cometas rivales`]],
  [/^Colete (\d+) relíquias$/, (m) => [`Collect ${m[1]} relics`, `Recoge ${m[1]} reliquias`]],
  [/^ache (\d+) relíquias$/i, (m) => [`find ${m[1]} relics`, `encuentra ${m[1]} reliquias`]],
  [/^leve o time a (\d+) pontos$/, (m) => [`take the team to ${m[1]} points`, `lleva al equipo a ${m[1]} puntos`]],
  [/^Faça (.+) pontos com o time$/, (m) => [`Score ${m[1]} points with the team`, `Haz ${m[1]} puntos con el equipo`]],
  [/^Time: faça (.+) pontos com seu parceiro$/, (m) => [`Team: score ${m[1]} points with your partner`, `Equipo: haz ${m[1]} puntos con tu compañero`]],
  [/^Faça (.+) pontos antes do tempo acabar$/, (m) => [`Score ${m[1]} points before time runs out`, `Haz ${m[1]} puntos antes de que acabe el tiempo`]],
  [/^Surfe (\d+) ondas clássicas$/, (m) => [`Surf ${m[1]} classic waves`, `Surfea ${m[1]} olas clásicas`]],
  [/^META (\d+) · (.+)$/, (m) => [`GOAL ${m[1]} · ${t(m[2])}`, `META ${m[1]} · ${t(m[2])}`]],
  [/^progresso (\d+)\/(\d+)$/, (m) => [`progress ${m[1]}/${m[2]}`, `progreso ${m[1]}/${m[2]}`]],
  [/^(\d+)º TEMPO · \u2605(\d+)$/, (m) => [`PERIOD ${m[1]} · \u2605${m[2]}`, `TIEMPO ${m[1]} · \u2605${m[2]}`]],
  [/^(\d+)º TEMPO FECHADO$/, (m) => [`PERIOD ${m[1]} CLOSED`, `TIEMPO ${m[1]} CERRADO`]],
  [/^(\d+)º TEMPO$/, (m) => [`PERIOD ${m[1]}`, `TIEMPO ${m[1]}`]],
  [/^PRÓXIMO: (\d+)º TEMPO$/, (m) => [`NEXT: PERIOD ${m[1]}`, `SIGUIENTE: TIEMPO ${m[1]}`]],
  [/^PLACAR (\d+)$/, (m) => [`SCORE ${m[1]}`, `MARCADOR ${m[1]}`]],
  [/^ESCOLHA SALVA: (.+)$/, (m) => [`SAVED CHOICE: ${t(m[1])}`, `ELECCIÓN GUARDADA: ${t(m[1])}`]],
];

const DECO = /^[<>\u25C0\u25B6\u2665\u00B7\u2022\s]+|[<>\u25C0\u25B6\u2665\u00B7\u2022\s]+$/g;

function lookup(str) {
  const hit = LEX[str];
  if (hit) return state.lang === 'en' ? hit[0] : hit[1];
  for (const [re, make] of RULES) {
    const m = re.exec(str);
    if (m) {
      const out = make(m);
      return state.lang === 'en' ? out[0] : out[1];
    }
  }
  return str;
}

/* drawText runs this for every label every frame, so results are memoised and
   pure numbers/symbols skip the dictionary entirely. */
const cache = new Map();

/** Translate a PT string. Unknown strings pass through untouched. */
export function t(str) {
  if (state.lang === 'pt') return str;
  if (typeof str !== 'string' || !str) return str;
  if (!/[A-Za-zÀ-ÿ]/.test(str)) return str;
  const memo = cache.get(state.lang + '\u0000' + str);
  if (memo !== undefined) return memo;
  const out = translate(str);
  if (cache.size > 4000) cache.clear();
  cache.set(state.lang + '\u0000' + str, out);
  return out;
}

function translate(str) {
  const direct = lookup(str);
  if (direct !== str) return direct;
  // Labels built by concatenation ("Faça 9000 pontos · CAMPO", "noite · 170s")
  // have no literal entry: localise each segment and glue it back with the
  // same middle dot, so a joined label never keeps half of it in Portuguese.
  if (str.includes(' · ')) {
    const parts = str.split(' · ');
    const loc = parts.map((p) => lookup(p));
    if (loc.some((p, i) => p !== parts[i])) return loc.join(' · ');
  }
  // Menus decorate labels with a heart, arrows or padding (<  ON  >). Keep the
  // decoration and translate what is inside it.
  const core = str.replace(DECO, '');
  if (core && core !== str) {
    const inner = lookup(core);
    if (inner !== core) {
      const at = str.indexOf(core);
      return str.slice(0, at) + inner + str.slice(at + core.length);
    }
  }
  return str;
}
