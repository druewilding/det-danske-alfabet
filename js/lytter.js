'use strict';

var input;
var gentagKnap;
var givOpKnap;

var alfabetet = 'abcdefghijklmnopqrstuvwxyzæøå';

var kunBogstavere = function(s) {
  var ikkeBogstavere = new RegExp("[^" + alfabetet + "]", 'g')
  return s.replace(ikkeBogstavere, '');
};

////////////////////////////////////////////////////////////////////////////////

class BogstavSpiller {

  constructor() {
    this.audio = document.getElementById('audio');
    this.stem = 'else';
    this.stop();
  }

  sætStem(ny) {
    if (!["else", "anne-katrine", "jonas"].includes(ny)) throw 'Stemmen findes ikke';
    this.stem = ny;
  }

  spil(bogstav, naarFaerdigt) {
    if (!naarFaerdigt) throw 'Intet callback';

    bogstav = bogstav.toLowerCase();
    if (alfabetet.indexOf(bogstav) < 0) {
      naarFaerdigt();
      return;
    }

    if (this.spillende) throw 'Allerede spillende';

    var filename = BogstavSpiller.letterMap[bogstav] || bogstav;
    this.audio.src = 'audio/' + this.stem + '/' + filename + '.mp3'
    this.audio.load();
    this.audio.play();
    this.spillende = true;
    this.naarFaerdigt = naarFaerdigt;

    var t = this;
    this.audio.addEventListener('ended', function(e) {
      t.spillende = false;
      var cb = t.naarFaerdigt;
      t.naarFaerdigt = null;
      cb();
    }, {once: true});
  }

  stop() {
    this.audio.pause();
    this.spillende = false;
    this.naarFaerdigt = null;
  }
}

BogstavSpiller.letterMap = {
  'æ': 'ae',
  'ø': 'oe',
  'å': 'aa',
};

////////////////////////////////////////////////////////////////////////////////

class BogstaverSpiller {
  constructor(bogstavSpiller) {
    this.bogstavSpiller = bogstavSpiller;
    this.tilbage = '';
    this.naarFaerdigt = null;
  }

  hentSpillende() {
    return this.bogstavSpiller.spillende || tilbage != '';
  }

  sætStem(ny) {
    this.bogstavSpiller.sætStem(ny);
  }

  naesteBogstav() {
    if (this.tilbage == '') {
      var cb = this.naarFaerdigt;
      this.naarFaerdigt = null;
      cb();
    } else {
      var n = this.tilbage.charAt(0);
      this.tilbage = this.tilbage.substr(1);
      var t = this;
      this.bogstavSpiller.spil(n, function () { t.naesteBogstav(); });
    }
  }

  spil(bogstaver, naarFaerdigt) {
    if (this.spillende) throw 'Allerede spillende';
    this.tilbage = bogstaver;
    this.naarFaerdigt = naarFaerdigt;
    this.naesteBogstav();
  }

  stop() {
    this.bogstaver.stop();
    this.tilbage = '';
    this.naarFaerdigt = null;
  }
}

////////////////////////////////////////////////////////////////////////////////

class StemVaelger {
  valg(person) {
    var active = document.getElementsByClassName('active');
    for (var i = active.length - 1; i >= 0; i--) {
      active[i].classList = 'person';
    }
    var target = document.getElementById(person);
    target.classList.add('active');
    this.cb(person);
  }

  constructor(cb) {
    this.cb = cb;

    var t = this;
    var people = document.getElementById('people');
    people.addEventListener('click', function(e) {
      if (e.target.id && e.target.id != 'people') {
        t.valg(e.target.id);
      }
      input.focus();
    });
  }
}

////////////////////////////////////////////////////////////////////////////////

class LytterSpil {
  constructor(bogstaverSpiller, stemVælger) {
    this.rigtigtSvar = null;
    this.timer = null;
    this.bogstaverSpiller = bogstaverSpiller;
    this.stemVælger = stemVælger;
  }

  lavSvar() {
    var s = '';
    var l = Math.random() * Math.random() * 5;
    for (var i=0; i<l; ++i) {
      s += alfabetet.charAt(Math.random() * alfabetet.length);
    }
    return s;
  }

  næsteSpørgsmål() {
    this.rigtigtSvar = this.lavSvar();
    input.value = '';
    this.begyndAtTjekke();
    this.udspil();
    input.focus();
    givOpKnap.disabled = false;
    gentagKnap.disabled = false;
  }

  begyndAtTjekke() {
    var t = this;
    this.timer = setInterval(function () { t.tjekSvar(); }, 100);
  }

  stoppeAtTjekke() {
    clearInterval(this.timer);
    this.timer = null;
  }

  udspil() {
    this.bogstaverSpiller.spil(this.rigtigtSvar, function () {
    });
  }

  tjekSvar() {
    if (kunBogstavere(input.value.toLowerCase()) == this.rigtigtSvar) {
      givOpKnap.disabled = true;
      gentagKnap.disabled = true;
      this.stoppeAtTjekke();
      input.blur();
      input.value = '🇩🇰';
      var t = this; setTimeout(function () { t.næsteSpørgsmål(); }, 1000);
    }
  }

  givOp() {
    givOpKnap.disabled = true;
    gentagKnap.disabled = true;
    this.stoppeAtTjekke();
    input.blur();
    input.value = this.rigtigtSvar;
    var t = this; setTimeout(function() { t.næsteSpørgsmål(); }, 1000);
  }

  gentag() {
    this.udspil();
    input.focus();
  }

  begyn() {
    this.stemVælger.valg('else');
    gentagKnap.disabled = true;
    givOpKnap.disabled = true;

    // Eksplicit handling kræves af brugeren
    // https://bugs.chromium.org/p/chromium/issues/detail?id=138132
    input.value = '[tryk]';
    var t = this; input.addEventListener('click', function() { t.næsteSpørgsmål(); }, {once: true});
  }
}

////////////////////////////////////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', function () {
  input = document.getElementById('letter');
  gentagKnap = document.getElementById('gentag');
  givOpKnap = document.getElementById('givop');

  var bogstaverSpiller = new BogstaverSpiller(new BogstavSpiller());
  var stemVælger = new StemVaelger(function(stem) { bogstaverSpiller.sætStem(stem) });
  var lytterSpil = new LytterSpil(bogstaverSpiller, stemVælger);
  givOpKnap.addEventListener('click', function() { lytterSpil.givOp(); });
  gentagKnap.addEventListener('click', function() { lytterSpil.gentag(); });
  lytterSpil.begyn();
});

// vi: set sw=2 et :
