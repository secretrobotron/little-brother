LittleBrother.addSequence( (function () {

  var sequence;

  sequence = new LittleBrother.Sequence({
    name: 'Test',
    audio: 'assets/littlebrother scratch track_1-2.oga',
    assets: {
      images: [
        'assets/seq1/storyboard0000.png',
        'assets/seq1/storyboard0001.png',
        'assets/seq1/storyboard0002.png',
        'assets/seq1/storyboard0003a.png',
        'assets/seq1/storyboard0003b.png',
        'assets/seq1/storyboard0004.png',
        'assets/seq1/storyboard0005.png',
        'assets/seq1/storyboard0006.png',
        'assets/seq1/storyboard0008.png',
        'assets/seq1/storyboard0009.png',
        'assets/seq1/storyboard0010.png',
        'assets/seq1/storyboard0011.png',
        'assets/seq1/storyboard0012.png',
        'assets/seq1/storyboard0013.png',
        'assets/seq1/storyboard0014.png',
        'assets/seq1/storyboard0015.png',
      ],
    },
    prepare: function (options) {
    },
    show: function () {
      document.body.appendChild(this.rootElement);
    },
    hide: function () {
      document.body.removeChild(this.rootElement);
    },
    start: function (timer) {
    },
    pause: function (timer) {
    },
    stop: function (timer) {
    }, 
    update: function (timer) {
    },
    updateGraphics: function (timer, gl) {
    },
  });

  return sequence;

}()));
