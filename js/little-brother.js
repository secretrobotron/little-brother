
var LittleBrother = (function () {

  var scene, mainLoop, mvc;

  var sequences = [], currentEditingSequence, currentPlayingSequence;
  var editorProperties = {};

  var shaderList = [], shaders = {}, fxChain;

  var cameraTarget, mainLight, mainLightTarget;

  var consoleQueue = "", consoleTimeout;

  var cssCamera = new (function () {
    var that = this;
    this.targetPosition = [0, 0];
    this.position = [0, 0];
    this.stepPosition = function () {
      that.position[0] -= (that.position[0] - that.targetPosition[0])*.35;
      that.position[1] -= (that.position[1] - that.targetPosition[1])*.35;
    };
  })();

  /******************************************************************************
   * Internal LB Functions
   ******************************************************************************/
  function setMotionTo(object, position, startTime, duration) {
    var endTime = startTime + duration;
    var m = object.motion = new CubicVR.Motion();
    var p = object.position;
    m.setKey(CubicVR.enums.motion.POS, CubicVR.enums.motion.X, startTime, p[0]).tension=1;
    m.setKey(CubicVR.enums.motion.POS, CubicVR.enums.motion.Y, startTime, p[1]).tension=1;
    m.setKey(CubicVR.enums.motion.POS, CubicVR.enums.motion.Z, startTime, p[2]).tension=1;
    m.setKey(CubicVR.enums.motion.POS, CubicVR.enums.motion.X, endTime, position[0]).tension=1;
    m.setKey(CubicVR.enums.motion.POS, CubicVR.enums.motion.Y, endTime, position[1]).tension=1;
    m.setKey(CubicVR.enums.motion.POS, CubicVR.enums.motion.Z, endTime, position[2]).tension=1;
    m.setBehavior(CubicVR.enums.motion.POS, CubicVR.enums.motion.X, CubicVR.enums.envelope.behavior.CONSTANT, CubicVR.enums.envelope.behavior.CONSTANT);
    m.setBehavior(CubicVR.enums.motion.POS, CubicVR.enums.motion.Y, CubicVR.enums.envelope.behavior.CONSTANT, CubicVR.enums.envelope.behavior.CONSTANT);
    m.setBehavior(CubicVR.enums.motion.POS, CubicVR.enums.motion.Z, CubicVR.enums.envelope.behavior.CONSTANT, CubicVR.enums.envelope.behavior.CONSTANT);
  }; //setMotionTo

  function stopCurrentSequence () {
    if (currentPlayingSequence) {
      currentPlayingSequence.stop();
    } //if
  }; //stopCurrentSequence

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
    editorProperties.name.value=sequence.name;
    if (editorProperties.audioElement.children) {
      for (var i=0; i<editorProperties.audioElement.children.length; ++i) {
        editorProperties.audioElement.removeChild(editorProperties.audioElement.children[i]);
      } //for
    } //if
    if (editorProperties.panels.children) {
      while (editorProperties.panels.children.length > 0) {
        editorProperties.panels.removeChild(editorProperties.panels.children[0]);
      } //for
    } //if
    for (var i=0; i<sequence.panels.length; ++i) {
      (function (panel) {
        var option = document.createElement('OPTION');
        option.innerHTML = '['+ panel.start +'] ' + panel.image;
        option.addEventListener('dblclick', function (e) {
          if (currentEditingSequence === currentPlayingSequence) {
            currentEditingSequence.focusOnPanel(panel);
          } //if
        }, false);
        editorProperties.panels.appendChild(option);
      })(sequence.panels[i]);
    } //for
    editorProperties.audioElement.appendChild(sequence.audioElement);
    currentEditingSequence = sequence;
  }; //setupEditorProperties

  function addSequenceToEditor(sequence) {
    var sequencesList = document.getElementById('editor-sequences');
    var option = document.createElement('OPTION');
    option.innerHTML = sequence.name;
    option.value = sequences.indexOf(sequence);
    sequencesList.appendChild(option);

    sequence.editorOptionElement = option;

    option.addEventListener('dblclick', function (e) {
      toggleEditorProperties(true);
      setupEditorProperties(sequence);
    }, false);
  }; //addSequenceToEditor


  /******************************************************************************
   * DOM Ready
   ******************************************************************************/
  document.addEventListener( 'DOMContentLoaded', function (e) {

    TrackLiner.plugin('little-brother', {
      setup: function (trackObj, options) {
        var left = options.left || options.x || options.start || 0;
        var width = options.width || options.end ? options.end - left : 1;
        return {
          left: left,
          width: width,
          innerHTML: options.image || '',
          className: 'editor-track-event',
        };

      },
      click: function (track, eventObj, event, ui) {
        eventObj.select();
      },
      dblclick: function (track, eventObj, event, ui) {
        currentEditingSequence.focusOnPanel(eventObj.options.panel);
      },
      moved: function (track, eventObj, event, ui) {
        var panel = eventObj.options.panel;
        var sequence = eventObj.options.sequence;
        panel.start = eventObj.start;
        panel.end = eventObj.end;
        sequence.removePopcornEvent(panel);
        sequence.generatePopcornEvent(panel);
      },
      select: function (track, eventObj, event) {
        eventObj.element.style.background = "-moz-linear-gradient(top,  #00f,  #006)";
      },
      deselect: function (track, eventObj, event) {
        eventObj.element.style.background = "-moz-linear-gradient(top,  #ff0,  #660)";
      },
    });

    var canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.id = "main-canvas";
          
    var gl = CubicVR.GLCore.init(canvas, 'lib/cubicvr/CubicVR_Core.vs', 'lib/cubicvr/CubicVR_Core.fs');
        
    if (!gl) {
      return;
    } //if

    var shaderDepth = new CubicVR.PostProcessShader({
      shader_vertex: "lib/cubicvr/post_shaders/fx_general.vs",
      shader_fragment: "lib/cubicvr/post_shaders/alpha_depth.fs",
    });
    shaders['depth'] = shaderDepth;

    var shaderInvert = new CubicVR.PostProcessShader({
      shader_vertex: "lib/cubicvr/post_shaders/fx_general.vs",
      shader_fragment: "lib/cubicvr/post_shaders/invert.fs"
    });
    shaders['invert'] = shaderInvert;

    var shaderDOF6 = new CubicVR.PostProcessShader({
      shader_vertex: "lib/cubicvr/post_shaders/fx_general.vs",
      shader_fragment: "lib/cubicvr/post_shaders/dof_6tap.fs",
      init: function(shader) {
        shader.addFloat("near_depth");
        shader.addFloat("far_depth");
      },
      onupdate: function(shader) {
        // linear depth
        var d = CubicVR.vec3.length(scene.camera.position, scene.camera.target);

        shader.setFloat("near_depth", (d - 0.5 - scene.camera.nearclip) / scene.camera.farclip);
        shader.setFloat("far_depth", (d + 4 - scene.camera.nearclip) / scene.camera.farclip);
      }
    });
    shaders['dof'] = shaderDOF6;

    var shaderSSAO = new CubicVR.PostProcessShader({
      shader_vertex: "lib/cubicvr/post_shaders/fx_general.vs",
      shader_fragment: "lib/cubicvr/post_shaders/ssao.fs",
    });
    shaders['ssao'] = shaderSSAO;

    var shaderHalfBloom = new CubicVR.PostProcessShader({
      shader_vertex: "lib/cubicvr/post_shaders/fx_general.vs",
      shader_fragment: "lib/cubicvr/post_shaders/bloom_6tap.fs",
      outputMode: CubicVR.enums.post.output.ADD,
      outputDivisor: 2
    });
    shaders['halfbloom'] = shaderHalfBloom;

    var shaderQuarterBloom = new CubicVR.PostProcessShader({
        shader_vertex: "lib/cubicvr/post_shaders/fx_general.vs",
        shader_fragment: "lib/cubicvr/post_shaders/bloom_6tap.fs",
        outputMode: CubicVR.enums.post.output.ADD,
        outputDivisor: 4
    });
    shaders['quarterbloom'] = shaderQuarterBloom;

    shaderList.push(shaderDepth);
    shaderList.push(shaderInvert);
    shaderList.push(shaderSSAO);
    shaderList.push(shaderDOF6);
    shaderList.push(shaderHalfBloom);
    shaderList.push(shaderQuarterBloom);

    fxChain = new CubicVR.PostProcessChain(canvas.width, canvas.height, true);
    fxChain.setBlurOpacity(1);
    fxChain.setBlurIntensity(0);

    for (var i = 0; i < shaderList.length; i++) {
      fxChain.addShader(shaderList[i]);
      shaderList[i].enabled = false;
    } //for

    scene = new CubicVR.Scene(canvas.width, canvas.height, 80, 0.01, 100);
    CubicVR.addResizeable(scene);

    mvc = new CubicVR.MouseViewController(canvas, scene.camera);

    cameraTarget = new CubicVR.SceneObject(null);
    scene.bindSceneObject(cameraTarget);
    cameraTarget.position = [0,0,0];

    mainLightTarget = new CubicVR.SceneObject(null);
    scene.bindSceneObject(mainLightTarget);
    mainLightTarget.position = [0,0,1];

    var defaultObjectMesh = CubicVR.primitives.plane({
      size: 1,
      material: new CubicVR.Material({
        color: [0.3, 0.6, 0.1],
      }),
      uvmapper: {
        projectionMode: CubicVR.enums.uv.projection.PLANAR,
        projectionAxis: CubicVR.enums.uv.axis.Z,
        scale: [1, 1, 1]
      }
    });

    defaultObjectMesh.triangulateQuads().compile().clean();
    var defaultObject = new CubicVR.SceneObject(defaultObjectMesh);

    scene.bindSceneObject(defaultObject);
    defaultObject.position = [0, 0, 20];
    defaultObject.rotation = [0, 0, 0];

    mainLight = new CubicVR.Light({
      type: CubicVR.enums.light.type.SPOT,
      specular: [1, 1, 1],
      diffuse: [1, 1, 1],
      intensity: 20,
      distance: 100,
      position: [0, 0, -10],
      cutoff: 15,
     });
    mainLight.lookat([0, 0, 0]);
    scene.bindLight(mainLight);

    scene.camera.position = [0, 0, -2];
    scene.camera.target = [0, 0, 0];

    CubicVR.setGlobalAmbient([0.2, 0.2, 0.2]);
    //CubicVR.setGlobalDepthAlpha(true, scene.camera.nearclip, scene.camera.farclip);

    /*
    mainLoop = new CubicVR.MainLoop( function (timer, gl) {

      mainLight.lookat(mainLightTarget.position);

      scene.camera.target = cameraTarget.position;
      if (currentPlayingSequence) {
        currentPlayingSequence.updateGraphics(timer, gl);
      } //if

      scene.evaluate(timer.getSeconds());
      fxChain.begin();
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      scene.render();
      fxChain.end();
      fxChain.render();

    });
    */

    document.body.appendChild(canvas);

    editorProperties = {
      name: document.getElementById('editor-sequence-name'),
      audioElement: document.getElementById('editor-sequence-audio'),
      panels: document.getElementById('editor-sequence-panels'),
    };

    toggleEditorProperties(false);

    for (var i=0; i<sequences.length; ++i) {
      addSequenceToEditor(sequences[i]);
    } //for

    //document.getElementById('editor-sequence-panels').addEventListener('dblclick', function (e) {
    //}, false);

    document.getElementById('editor-panel-add-timeline').addEventListener('click', function (e) {
      var sequence = currentEditingSequence;
      sequence.tracks['css-camera-' + Math.round(Math.random()*2)].createTrackEvent('little-brother', {
        start: 0, 
        end: 10
      });
      sequence.popcorn.littlebrother({
        start: 0,
        end: 10,
      });
    }, false);

    document.getElementById('editor-save-sequence').addEventListener('click', function (e) {
      saveEditingSequence();
    }, false);

    document.getElementById('editor-show-sequence').addEventListener('click', function (e) {
      LittleBrother.showSequence(currentEditingSequence);
    }, false);

    document.getElementById('player-play').addEventListener('click', function (e) {
      if (currentPlayingSequence) {
        LittleBrother.playSequence(currentPlayingSequence);
      }
      else {
        LittleBrother.playSequence(sequences[0]);
      } //if
    }, false);

    document.getElementById('player-pause').addEventListener('click', function (e) {
      if (currentPlayingSequence) {
        LittleBrother.pauseSequence(currentPlayingSequence);
      } //if
    }, false);

    document.getElementById('editor-toggle').addEventListener('click', function (e) {
      var editor = document.getElementById('editor');
      if (editor.style.display === 'none' || editor.style.display === '') {
        editor.style.display = 'block';
      }
      else {
        editor.style.display = 'none';
      } //if
    }, false);

    document.getElementById('timeline-toggle').addEventListener('click', function (e) {
      var editor = document.getElementById('timeline');
      if (editor.style.display === 'none' || editor.style.display === '') {
        editor.style.display = 'block';
      }
      else {
        editor.style.display = 'none';
      } //if
    }, false);

    for (var i=0; i<sequences.length; ++i) {
      sequences[i].prepare(scene);
    } //for

    $('#console').hide();

    (function () {
      document.body.addEventListener('mousedown', function (e) {
        if (e.ctrlKey && currentPlayingSequence) {
          var mouseDownPos, startPos, div;
          var mouseUpHandler = function (e) {
            document.body.removeEventListener('mouseup', mouseUpHandler, false);
            document.body.removeEventListener('mousemove', mouseMoveHandler, false);
          };
          var mouseMoveHandler = function (e) {
            var nx = e.pageX - mouseDownPos[0], ny = e.pageY - mouseDownPos[1];
            cssCamera.targetPosition = [startPos[0] + nx, startPos[1] + ny];
          };
          mouseDownPos = [e.pageX, e.pageY];
          div = currentPlayingSequence.rootElement;
          startPos = [cssCamera.position[0], cssCamera.position[1]];
          document.body.addEventListener('mouseup', mouseUpHandler, false);
          document.body.addEventListener('mousemove', mouseMoveHandler, false);
        } //if
      }, false);
    })();

    toggleEditorProperties(true);
    setupEditorProperties(sequences[0]);
    LittleBrother.showSequence(sequences[0]);

    // shim layer with setTimeout fallback
    window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function(callback, element){
                window.setTimeout(callback, 1000 / 60);
              };
    })();
 
    (function animloop(){
      cssCamera.stepPosition();
      requestAnimFrame(animloop);
      currentEditingSequence.rootElement.style.left = cssCamera.position[0] + "px";
      currentEditingSequence.rootElement.style.top = cssCamera.position[1] + "px";
    })(); 
 
  }, false); //DOM ready

  /******************************************************************************
   * Little Brother Object
   ******************************************************************************/
  return {
    getSequences: function () {
      return sequences;
    },

    addSequence: function (sequence) {
      sequences.push(sequence);
    }, //addSequence

    stopCurrentSequence: stopCurrentSequence,

    playSequence: function (sequence) {
      sequence.play();
    }, //playSequence

    showSequence: function (sequence) {
      if (sequence !== currentPlayingSequence) {
        currentPlayingSequence = sequence;
        sequence.show();
      } //if
    },

    pauseSequence: function (sequence) {
      sequence.pause();
    }, //stopSequence

    stopSequence: function (sequence) {
      sequence.stop();
    }, //stopSequence

    /*******************************
     * Panel
     *******************************/
    Panel: function (options) {
      this.image = options.image;
      this.start = options.start;
      this.end = options.end;
      this.position = options.position || [0,0,0];
      this.rotation = options.rotation || [0,0,0];
      this.scale = options.scale || [1,1,1];

      var mesh = new CubicVR.Mesh();
      var image = this.sourceImage = new Image();
      var that = this;
      var BORDER_WIDTH = 20;
      var sourceCanvas = this.sourceCanvas = document.createElement('CANVAS');
      image.onload = function (e) {
        var w = image.width, h = image.height;
        that.width = w;
        that.height = h;
        var texture = new CubicVR.CanvasTexture({canvas: sourceCanvas, width: w, height: h, update: function (canvas, ctx) {
          ctx.drawImage(image, 0, 0);
          /*
          ctx.lineWidth = BORDER_WIDTH;
          ctx.strokeStyle = "#000000";
          ctx.beginPath();
          ctx.rect(0, 0, w, h);
          ctx.stroke();
          ctx.lineWidth = BORDER_WIDTH/2;
          ctx.strokeStyle = "#ffffff";
          ctx.beginPath();
          ctx.rect(0, 0, w, h);
          ctx.stroke();
          */
        }});
        CubicVR.primitives.plane( {
          mesh: mesh,
          size: 1.0,
          material: new CubicVR.Material({
            color: [1, 1, 1],
            specular: [.01, .01, .01],
            diffuse: [1, 1, 1],
            textures: {
              color: texture,
            },
          }),
          uvmapper: {
            projectionMode: CubicVR.enums.uv.projection.PLANAR,
            projectionAxis: CubicVR.enums.uv.axis.Z,
            scale: [1, 1, 1],
          },
        }).triangulateQuads().compile().clean();

        texture.update();
        sourceCanvas.style.width = w/2 + 'px';
        sourceCanvas.style.height = h/2 + 'px';
      };
      image.src = options.image;

      var so = new CubicVR.SceneObject(mesh);
      this.sceneObject = so;

      so.position = [this.position[0], this.position[1], this.position[2]];
      so.rotation = [this.rotation[0], this.rotation[1], this.rotation[2]];
      so.scale = [this.scale[0], this.scale[1], this.scale[2]];
      this.originalPosition = [this.position[0], this.position[1], this.position[2]];

    
    }, //Panel

    /*******************************
     * Sequence
     *******************************/
    Sequence: function (options) {

      var that = this;

      this.rootElement = document.createElement('DIV');
      this.rootElement.className = 'sequence-div';

      this.name = options.name || 'Untitled';
      this.panels = [];

      this.getScene = function () {
        return scene;
      };

      this.options = options;

      this.options.show = this.options.show || function (){};
      this.options.hide = this.options.hide || function (){};

      this.addPanel = function (options) {
        var panel = new LittleBrother.Panel(options);
        this.panels.push(panel);
        return panel;
      }; //addPanel

      var tracks = this.tracks = {};

      this.addAudio = function (audio) {

        var audioElement = this.audioElement = document.createElement('AUDIO');
        var audioSource = document.createElement('SOURCE');
        audioSource.src = audio;
        audioElement.appendChild(audioSource);
        audioElement.setAttribute('controls', true);

        var popcorn = this.popcorn = Popcorn(audioElement);

        popcorn.listen('play', function () {
          LittleBrother.showSequence(that);
          that.options.start.apply(that, [/*mainLoop.timer*/]);
        });

        popcorn.listen('pause', function () {
          that.options.pause.apply(that, [/*mainLoop.timer*/]);
        });

        this.popcorn.listen('loadedmetadata', function (e) {
          var trackliner = new TrackLiner({
            element: 'timeline',
            scale: 10,
            duration: popcorn.duration(),
          });
          tracks['css-camera-0'] = trackliner.createTrack('CSS Camera 0');
          tracks['css-camera-1'] = trackliner.createTrack('CSS Camera 1');
          tracks['css-camera-2'] = trackliner.createTrack('CSS Camera 2');
        });

      }; //addAudio

      this.update = that.options.update || function () {};
      this.updateGraphics = that.options.updateGraphics || function () {};

      if (that.options.audio) {
        this.addAudio(that.options.audio);
      } //if

      this.show = function () {
        that.options.show.apply(that);
      }; //show

      this.hide = function () {
        that.options.hide.apply(that);
      };

      this.createTrackEvent = function (track, options) {
        this.tracks[track].createTrackEvent('little-brother', options);
      };

      this.prepare = function (scene) {
        if (that.options.panels) {
          for (var i=0; i<that.options.panels.length; ++i) {
            this.addPanel(that.options.panels[i]);
          } //for
        } //if
        if (that.options.popcorn) {
          that.options.popcorn.apply(this, []);
          var trackEvents = this.popcorn.getTrackEvents();
          for (var i=0; i<trackEvents.length; ++i) {
            if (trackEvents[i]._id.indexOf('littlebrother') > -1) {
              var trackName = 'css-camera-' + Math.round(Math.random() * 2);
              trackEvents[i].panel = that.addPanel(trackEvents[i]);
              trackEvents[i].track = that.tracks[trackName];
              trackEvents[i].sequence = that;
              that.createTrackEvent(trackName, trackEvents[i]);
            } //if
          } //for
        } //if
        that.options.prepare.apply(that, [{scene: scene}]);
      };

      this.play = function () {
        this.popcorn.play();
      }; //play

      this.stop = function () {
        this.popcorn.pause();
      }; //stop

      this.pause = function () {
        this.popcorn.pause();
      }; //pause

      this.popcorn.listen('timeupdate', function (e) {
        that.update();
      });

      this.sortPanels = function (panel) {
        for (var i=0; i<that.panels.length; ++i) {
          that.panels[i].sourceCanvas.style.zIndex = 8000;
        } //for
        panel.sourceCanvas.style.zIndex = 9000;
      };

      this.focusOnPanel = function (panel, offset) {
        offset = offset || [0,0,0];
        cssCamera.targetPosition = [
          -panel.position[0],
          -panel.position[1],
        ];
        that.sortPanels(panel);
      };

      this.removePopcornEvent = function (panel) {
        that.popcorn.removeTrackEvent(panel.popcornTrackEventId);
      };

      this.generatePopcornEvent = function (panel) {
        that.popcorn.code({
          start: panel.start,
          end: panel.end,
          onStart: function (options) {
            that.focusOnPanel(panel);
          },
        });

        panel.popcornTrackEventId = that.popcorn.getLastTrackEventId();
      };


      /*
      this.focusOnPanel = function (panel, offset) {
        offset = offset || [0,0,0];
        var sec = mainLoop.timer.getSeconds();
        var rot = panel.sceneObject.rotation;

        var norm = [
          Math.sin(rot[1]/180*Math.PI),
          0,
          Math.cos(rot[1]/180*Math.PI),
        ];

        var adj = [
          panel.sceneObject.position[0] + offset[0],
          panel.sceneObject.position[1] + offset[1],
          panel.sceneObject.position[2] + offset[2],
        ];

        function rand() {
          return (Math.random()*2)-1;
        }

        var cameraPos = [
          adj[0] - norm[0]*1.5 + rand() * .15,
          adj[1] - norm[1]*1.5 + rand() * .4,
          adj[2] - norm[2]*1.5 + rand() * .15,
        ];

        var lightPos = [
          adj[0] - norm[0] * 5,
          adj[1] - norm[1] * 5,
          adj[2] - norm[2] * 5,
        ];

        var lightTar = [
          adj[0] + rand() * .3,
          adj[1] + rand() * .3,
          adj[2] + rand() * .3,
        ];

        setMotionTo(scene.camera, cameraPos, sec, 1);
        setMotionTo(mainLight, lightPos, sec, 1);
        setMotionTo(mainLightTarget, lightTar, sec, 2);
        setMotionTo(cameraTarget, adj, sec, 1);
      };
      */

    }, //Sequence

    clearConsole: function () {
      document.getElementById('console').value = '';
    }, //clearConsole

    pauseConsole: function (duration) {
      consoleQueue = consoleQueue.concat('|WAIT'+duration+'|');
    }, //pauseConsole

    typeToConsole: function (message) {
      message = '\n> ' + message;
      consoleQueue = consoleQueue.concat(message);
      function typeLetter() {
        var con = document.getElementById('console');
        if (consoleQueue.length > 0) {
          if (consoleQueue.indexOf('|STARTBLOCK|') === 0) {
            var end = consoleQueue.indexOf('|ENDBLOCK|');
            con.value += consoleQueue.substring(12, end);
            consoleQueue = consoleQueue.slice(end+10);
            consoleTimeout = setTimeout(typeLetter, Math.random()*50+50);
          }
          else if (consoleQueue.indexOf('|WAIT') === 0) {
            var end = consoleQueue.indexOf('|', 3);
            var duration = parseInt(consoleQueue.substring(5, end));
            consoleQueue = consoleQueue.slice(end+1);
            consoleTimeout = setTimeout(typeLetter, duration);
          }
          else {
            con.value += consoleQueue[0];
            consoleQueue = consoleQueue.slice(1);
            consoleTimeout = setTimeout(typeLetter, Math.random()*50+50);
          } //if
        } //if
        con.scrollTop = con.scrollHeight;
      } //function
      if (consoleTimeout === undefined) {
        typeLetter();
      } //if
    }, //typeToConsole

    addToConsole: function (message) {
      LittleBrother.typeToConsole('|STARTBLOCK|'+message+'|ENDBLOCK|');
    }, //addToConsole

    toggleConsole: function (state) {
      var c = $('#console');
      if (state) {
        c.show();
        c.animate({
          bottom: 0,
        }, 500);
      }
      else {
        c.animate({
          bottom: -c.height(),
        }, 500, function () {
          c.hide();
        });
      } //if
    }, //toggleConsole

  };

}()); //LittleBrother

