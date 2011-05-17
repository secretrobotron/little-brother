
var LittleBrother = (function () {

  var scene;

  var sequences = [], currentEditingSequence;
  var editorProperties = {};

  function toggleEditorProperties (state) {
    var editor = document.getElementById('editor-properties');
    var inputs = editor.getElementsByTagName('input');
    var selects = editor.getElementsByTagName('select');
    if (state) {
      for (var i=0; i<inputs.length; ++i) {
        inputs[i].removeAttribute('disabled');
      } //for
      for (var i=0; i<selects.length; ++i) {
        selects[i].removeAttribute('disabled');
      } //for
    }
    else {
      for (var i=0; i<inputs.length; ++i) {
        inputs[i].setAttribute('disabled', 'disabled');
      } //for
      for (var i=0; i<selects.length; ++i) {
        selects[i].setAttribute('disabled', 'disabled');
      } //for
    } //if
  }; //toggleEditorProperties

  function saveEditingSequence() {
    var sequence = currentEditingSequence;
    sequence.name = editorProperties['name'].value;
    sequence.editorOptionElement.innerHTML = sequence.name;
  }; //saveEditingSequence

  function setupEditorProperties(sequence) {
    editorProperties['name'].value=sequence.name;
    currentEditingSequence = sequence;
  }; //setupEditorProperties

  function addSequenceToEditor(sequence) {
    var sequencesList = document.getElementById('editor-sequences');
    var option = document.createElement('OPTION');
    option.innerHTML = sequence.name;
    option.value = sequences.indexOf(sequence);
    sequencesList.appendChild(option);

    sequence.editorOptionElement = option;

    option.addEventListener('click', function (e) {
      toggleEditorProperties(true);
      setupEditorProperties(sequence);
    }, false);
  }; //addSequenceToEditor

  document.addEventListener( 'DOMContentLoaded', function (e) {

    var canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
          
    var gl = CubicVR.GLCore.init(canvas, 'lib/cubicvr/CubicVR_Core.vs', 'lib/cubicvr/CubicVR_Core.fs');
        
    if (!gl) {
      return;
    } //if

    scene = new CubicVR.Scene(canvas.width, canvas.height, 80);

    scene.bindSceneObject( new CubicVR.SceneObject( CubicVR.primitives.box( {
      size: 1.0,
      material: new CubicVR.Material({
        color: [0,0,0],
      }),
    }).triangulateQuads().compile().clean()));

    CubicVR.setGlobalDepthAlpha(true, scene.camera.nearclip, scene.camera.farclip);

    scene.camera.position = [0, 0.5, 2];
    scene.camera.target = [0, 0, 0];

    CubicVR.MainLoop( function (timer, gl) {
      scene.render();
    });

    document.body.appendChild(canvas);

    editorProperties = {
      name: document.getElementById('editor-sequence-name'),
    };

    toggleEditorProperties(false);

    for (var i=0; i<sequences.length; ++i) {
      addSequenceToEditor(sequences[i]);
    } //for

    document.getElementById('editor-save-sequence').addEventListener('click', function (e) {
      saveEditingSequence();
    }, false);

    document.getElementById('editor-goto-sequence').addEventListener('click', function (e) {

      LittleBrother.playSequence(currentEditingSequence);

    }, false);

  }, false); //DOM ready

  return {
    getSequences: function () {
      return sequences;
    },

    addSequence: function (sequence) {
      sequences.push(sequence);
    }, //addSequence

    playSequence: function (sequence) {
      sequence.popcorn.play();
    }, //playSequence

    Panel: function (options) {
      var so = new CubicVR.SceneObject( CubicVR.primitives.plane( {
        size: 1.0,
        material: new CubicVR.Material({
          textures: {
            color: options.image
          }
        }),
      }).triangulateQuads().compile().clean() );

      this.sceneObject = so;
    }, //Panel

    Sequence: function (options) {

      this.name = options.name || 'Untitled';
      this.panels = [];

      this.addPanel = function (options) {
        var panel = options.panel || new LittleBrother.Panel(options);
        panels.push(panel);
      }; //addPanel

      this.addAudio = function (audio) {
        var audioElement = this.audioElement = document.createElement('AUDIO');
        var audioSource = document.createElement('SOURCE');
        audioSource.src = audio;
        audioElement.appendChild(audioSource);
        this.popcorn = Popcorn(audioElement);
      }; //addAudio

      if (options.audio) {
        this.addAudio(options.audio);
      } //if

      if (options.panels) {
        for (var i=0; i<options.panels.length; ++i) {
          this.addPanel(options.panels[i]);
        } //for
      } //if

    }, //Sequence

  };

}()); //LittleBrother

