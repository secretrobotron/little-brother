
var LittleBrother = (function () {

  var scene, mainLoop, mvc;

  var sequences = [], currentSequence, currentSequence;
  var editorProperties = {};

  /* -------------------------------------------------------------------------
   * CSS Camera
   */
  var cssCamera = new (function () {
    var that = this;
    this.targetPosition = [0, 0];
    this.position = [0, 0];
    this.stepPosition = function () {
      that.position[0] -= (that.position[0] - that.targetPosition[0])*.35;
      that.position[1] -= (that.position[1] - that.targetPosition[1])*.35;
    };
  })();

  /* -------------------------------------------------------------------------
   * Internal LB Functions
   */
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

  var editMode = false,
      editingObject = undefined;
  function enterEditMode (object) {
    $('#editor').dialog('close');
    $('#editor').hide();
    $('#timeline-container').hide();
    $('#player').hide();
    editingObject = object;
  } //enterModalMode

  function exitEditMode () {
    $('#editor').dialog('open');
    $('#editor').show();
    $('#timeline-container').show();
    $('#player').show();
    editingObject = undefined;
  } //exitModalMode

  function stopCurrentSequence () {
    if (currentSequence) {
      currentSequence.stop();
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
    var sequence = currentSequence;
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
        option.innerHTML = panel.image;
        option.addEventListener('dblclick', function (e) {
          if (currentSequence === currentSequence) {
            currentSequence.focusOnPanel(panel);
          } //if
        }, false);
        editorProperties.panels.appendChild(option);
        option.panel = panel;
        option.value = panel.image;
      })(sequence.panels[i]);
    } //for
    editorProperties.audioElement.appendChild(sequence.audioElement);

    for (var i=0; i<sequence.assets.images.length; ++i) {
      var fileName = sequence.assets.images[i];
      $img = $('<img>', {
        id: 'panel-image-' + i,
        src: fileName,
      });
      $div = $('<div>', {
        class: 'add-panel-image',
        'data-filename': fileName,
      }).append($img);
      $div.append($('<span>'+ fileName +'</span>'));
      $div.append($img);
      $('#add-panel-images').append($div);
    } //for

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


  /* -------------------------------------------------------------------------
   * DOM Ready
   */
  document.addEventListener( 'DOMContentLoaded', function (e) {

    $('#timeline-playhead').draggable({
      axis: 'x',
      drag: function (e, ui) {
        var popcorn = currentSequence.popcorn,
            trackliner = currentSequence.trackliner;
        popcorn.currentTime($('#timeline-playhead').position().left/trackliner.scale());
      },
    });

    $('#timeline-container').resizable({
      handles: 'n',
    });

    (function () {
      var selectedImage;
      
      $('#add-panel-dialog').dialog({
        autoOpen: false,
        modal: true,
        height: 500,
        width: 700,
        title: 'Add Panel',

        open: function ( e, ui ) {
          selectedImage = undefined;
        },

        buttons: {
          'Cancel': function (e, ui) {
            $(this).dialog('close');
          },
          'Add': function (e, ui) {
            var fileName = selectedImage.getAttribute('data-filename');
            var panel = new LittleBrother.Panel({
              image: fileName,
            });
            currentSequence.addPanel(panel);
            $(this).dialog('close');
          },
        },
      });

      $('#add-panel-images').selectable({
        selected: function (e, ui) {
          $('.ui-selected', this).each( function () {
            selectedImage = this;
          });
        },
      });
    })();

    $('#editor').dialog({
      autoOpen: true,
      height: 500,
      width: 350,
      title: 'Editor',
      position: 'right',
    });

    $('#editor-panel-droppable').draggable({
      helper: 'clone',
      revert: true,
      revertDuration: 0,
      start: function () {
        var index = editorProperties.panels.selectedIndex;
        return index !== -1;
      },
    });

    $('#editor-camera-droppable').draggable({
      helper: 'clone',
      revert: true,
      revertDuration: 0,
      start: function () {
      },
    });


    /* -------------------------------------------------------------------------
     * Trackliner Plugins
     */

    (function () {
      $('#add-panel-event-dialog').dialog({
        autoOpen: false,
        modal: false,
        height: 500,
        width: 500,
        title: 'Edit Panel Event',
        open: function (e, ui) {
        },
        close: function (e, ui) {
          exitEditMode();
        },
      });

      $('#add-panel-start-get-attrs').click( function (e) {
        $('#add-panel-start-x').val($(editingObject).position().left);
        $('#add-panel-start-y').val($(editingObject).position().top);
        $('#add-panel-start-width').val($(editingObject).width());
        $('#add-panel-start-height').val($(editingObject).height());
      });

      $('#add-panel-end-get-attrs').click( function (e) {
        $('#add-panel-end-x').val($(editingObject).position().left);
        $('#add-panel-end-y').val($(editingObject).position().top);
        $('#add-panel-end-width').val($(editingObject).width());
        $('#add-panel-end-height').val($(editingObject).height());
      });

      function makePopcorn(object, start, end, startPos, endPos, startDims, endDims) {
        var duration = end - start;
        var popcorn = currentSequence.popcorn;
        popcorn.code({
          start: start,
          end: end,
          onStart: function (options) {
            $(object).css({
              left: startPos[0] + 'px',
              top: startPos[1] + 'px',
              width: startDims[0] + 'px',
              height: startDims[1] + 'px',
            });
          },
          onFrame: function (options) {
            var time = popcorn.media.currentTime,
                p = Math.min(1, Math.max(0, (time - start)/(end-start))),
                pos = [],
                dim = [];
            pos[0] = startPos[0] + (endPos[0] - startPos[0])*p;
            pos[1] = startPos[1] + (endPos[1] - startPos[1])*p;
            dim[0] = startDims[0] + (endDims[0] - startDims[0])*p;
            dim[1] = startDims[1] + (endDims[1] - startDims[1])*p;
            $(object).css({
              left: pos[0] + 'px',
              top: pos[1] + 'px',
              width: dim[0] + 'px',
              height: dim[1] + 'px',
            });
          },
          onEnd: function (options) {
            var time = popcorn.media.currentTime,
                pos = Math.min(1, Math.max(0, (time - start)/(end-start))) < 0.5 ? startPos : endPos,
                dim = Math.min(1, Math.max(0, (time - start)/(end-start))) < 0.5 ? startDims : endDims;
            $(object).css({
              left: pos[0] + 'px',
              top: pos[1] + 'px',
              width: dim[0] + 'px',
              height: dim[1] + 'px',
            });
          },
        });
        return popcorn.getTrackEvent(popcorn.getLastTrackEventId());
      } //makePopcorn

      TrackLiner.plugin('little-brother-panel', {
        setup: function (trackObj, options) {
          var index = editorProperties.panels.selectedIndex;
          var option = editorProperties.panels.options[index];
          var left = options.left || options.x || options.start || 0;
          var width = options.width || options.end ? options.end - left : 10;
          options.panel = option.panel;
          options.startPos = [0,0];
          options.endPos = [0,0];
          options.startDims = [options.panel.canvas.width/2, options.panel.canvas.height/2];
          options.endDims = [options.panel.canvas.width/2, options.panel.canvas.height/2];

          options.popcorn = makePopcorn(options.panel.canvas, left, left+width, options.startPos, options.endPos, options.startDims, options.endDims);
          return {
            left: left,
            width: width,
            innerHTML: 'p: 0,0 &rarr; 0,0<br />d: 0,0 &rarr; 0,0',
            classes: ['track-event'],
          };
        },
        click: function (track, eventObj, event, ui) {
          eventObj.select();
        },
        dblclick: function (track, eventObj, event, ui) {
          var options = eventObj.options;
          options.popcorn._natives.end(event, options.popcorn);
          currentSequence.focusOnPanel(eventObj.options.panel);
          enterEditMode(eventObj.options.panel.canvas);
          $('#add-panel-start-x').val(options.startPos[0]);
          $('#add-panel-start-y').val(options.startPos[1]);
          $('#add-panel-end-x').val(options.endPos[0]);
          $('#add-panel-end-y').val(options.endPos[1]);
          $('#add-panel-start-width').val(options.startDims[0]);
          $('#add-panel-start-height').val(options.startDims[1]);
          $('#add-panel-end-width').val(options.endDims[0]);
          $('#add-panel-end-height').val(options.endDims[1]);
          $('#add-panel-event-dialog').dialog('option', 'buttons', {
            'Cancel': function (e, ui) {
              $(this).dialog('close');
            },
            'Save': function (e, ui) {
              options.startPos[0] = parseFloat($('#add-panel-start-x').val());
              options.startPos[1] = parseFloat($('#add-panel-start-y').val());
              options.startDims[0] = parseFloat($('#add-panel-start-width').val());
              options.startDims[1] = parseFloat($('#add-panel-start-height').val());
              options.endPos[0] = parseFloat($('#add-panel-end-x').val());
              options.endPos[1] = parseFloat($('#add-panel-end-y').val());
              options.endDims[0] = parseFloat($('#add-panel-end-width').val());
              options.endDims[1] = parseFloat($('#add-panel-end-height').val());
              currentSequence.popcorn.removeTrackEvent(options.popcorn._id);
              options.popcorn = makePopcorn(eventObj.options.panel.canvas, eventObj.start, eventObj.end, options.startPos, options.endPos, options.startDims, options.endDims);
              eventObj.element.innerHTML = 'p: ' + options.startPos + '&rarr;' + options.endPos + '<br />d: ' + options.startDims + '&rarr;' + options.endDims;
              $(this).dialog('close');
            },
          });
          $('#add-panel-event-dialog').dialog('open');
        },
        moved: function (track, eventObj, event, ui) {
          var options = eventObj.options;
          currentSequence.popcorn.removeTrackEvent(options.popcorn._id)
          options.popcorn = makePopcorn(eventObj.options.panel.canvas, eventObj.start, eventObj.end, options.startPos, options.endPos, options.startDims, options.endDims);
        },
        select: function (track, eventObj, event) {
          $(eventObj.element).addClass('track-event-selected');
        },
        deselect: function (track, eventObj, event) {
          $(eventObj.element).removeClass('track-event-selected');
        },
      });

    })();

    (function () {

      function makePopcorn(start, end, startPos, endPos) {
        var duration = end - start;
        var popcorn = currentSequence.popcorn;
        popcorn.code({
          start: start,
          end: end,
          onStart: function (options) {
            cssCamera.position = cssCamera.targetPosition = [
              startPos[0],
              startPos[1],
            ];
          },
          onFrame: function (options) {
            var time = popcorn.media.currentTime,
                p = Math.min(1, Math.max(0, (time - start)/(end-start))),
                pos = [];
            pos[0] = startPos[0] + (endPos[0] - startPos[0])*p;
            pos[1] = startPos[1] + (endPos[1] - startPos[1])*p;
            cssCamera.position[0] = cssCamera.targetPosition[0] = pos[0];
            cssCamera.position[1] = cssCamera.targetPosition[1] = pos[1];
          },
          onEnd: function (options) {
            var time = popcorn.media.currentTime,
                pos = Math.min(1, Math.max(0, (time - start)/(end-start))) < 0.5 ? startPos : endPos;
            cssCamera.position = [
              pos[0],
              pos[1],
            ];
            cssCamera.targetPosition = [
              pos[0],
              pos[1],
            ];
          },
        });
        return popcorn.getTrackEvent(popcorn.getLastTrackEventId());
      } //makePopcorn

      $('#add-camera-event-dialog').dialog({
        autoOpen: false,
        modal: false,
        height: 500,
        width: 500,
        title: 'Edit Camera Event',
        open: function (e, ui) {
          enterEditMode();
        },
        close: function (e, ui) {
          exitEditMode();
        },
      });

      $('#add-camera-start-get-pos').click( function (e) {
        $('#add-camera-start-x').val(cssCamera.targetPosition[0]);
        $('#add-camera-start-y').val(cssCamera.targetPosition[1]);
      });

      $('#add-camera-end-get-pos').click( function (e) {
        $('#add-camera-end-x').val(cssCamera.targetPosition[0]);
        $('#add-camera-end-y').val(cssCamera.targetPosition[1]);
      });

      TrackLiner.plugin('little-brother-camera', {
        setup: function (trackObj, options, event, ui) {
          var left = options.left || options.x || options.start || 0;
          var width = options.width || options.end ? options.end - left : 10;
          options.startPos = [cssCamera.targetPosition[0], cssCamera.targetPosition[1]];
          options.endPos = [cssCamera.targetPosition[0], cssCamera.targetPosition[1]];
          options.popcorn = makePopcorn(left, left+width, cssCamera.targetPosition, cssCamera.targetPosition);
          return {
            left: left,
            width: width,
            innerHTML: 'p: 0,0 &rarr; 0,0',
            classes: ['track-event'],
          };
        },
        click: function (track, eventObj, event, ui) {
          eventObj.select();
        },
        dblclick: function (track, eventObj, event, ui) {
          var options = eventObj.options;
          options.popcorn._natives.end(event, options.popcorn);
          $('#add-camera-start-x').val(options.startPos[0]);
          $('#add-camera-start-y').val(options.startPos[1]);
          $('#add-camera-end-x').val(options.endPos[0]);
          $('#add-camera-end-y').val(options.endPos[1]);
          $('#add-camera-event-dialog').dialog('option', 'buttons', {
            'Cancel': function (e, ui) {
              $(this).dialog('close');
            },
            'Save': function (e, ui) {
              options.startPos[0] = parseFloat($('#add-camera-start-x').val());
              options.startPos[1] = parseFloat($('#add-camera-start-y').val());
              options.endPos[0] = parseFloat($('#add-camera-end-x').val());
              options.endPos[1] = parseFloat($('#add-camera-end-y').val());
              currentSequence.popcorn.removeTrackEvent(options.popcorn._id);
              options.popcorn = makePopcorn(eventObj.start, eventObj.end, options.startPos, options.endPos);
              eventObj.element.innerHTML = 'p: ' + options.startPos + '&rarr;' + options.endPos;
              $(this).dialog('close');
            },
          });

          $('#add-camera-event-dialog').dialog('open');
        },
        moved: function (track, eventObj, event, ui) {
          var options = eventObj.options;
          currentSequence.popcorn.removeTrackEvent(options.popcorn._id)
          options.popcorn = makePopcorn(eventObj.start, eventObj.end, options.startPos, options.endPos);
        },
        select: function (track, eventObj, event) {
          $(eventObj.element).addClass('track-event-selected');
        },
        deselect: function (track, eventObj, event) {
          $(eventObj.element).removeClass('track-event-selected');
        },
      });

    })();


    /* -------------------------------------------------------------------------
     * Editor Properties
     */
    editorProperties = {
      name: document.getElementById('editor-sequence-name'),
      audioElement: document.getElementById('editor-sequence-audio'),
      panels: document.getElementById('editor-sequence-panels'),
    };

    toggleEditorProperties(false);

    for (var i=0; i<sequences.length; ++i) {
      addSequenceToEditor(sequences[i]);
    } //for


    /* -------------------------------------------------------------------------
     * DOM Events
     */
    $('#editor-panel-remove').click(function (e) {
      
    });

    $('#editor-save-sequence').click( function (e) {
      saveEditingSequence();
    });

    $('#editor-show-sequence').click( function (e) {
      LittleBrother.showSequence(currentSequence);
    });

    $('#player-play').click( function (e) {
      if (currentSequence) {
        LittleBrother.playSequence(currentSequence);
      }
      else {
        LittleBrother.playSequence(sequences[0]);
      } //if
    });

    $('#player-pause').click( function (e) {
      if (currentSequence) {
        LittleBrother.pauseSequence(currentSequence);
      } //if
    });

    $('#editor-toggle').click( function (e) {
      $('#editor').dialog('open');
    });

    $('#timeline-toggle').click( function (e) {
      var editor = document.getElementById('timeline');
      if (editor.style.display === 'none') {
        editor.style.display = 'block';
      }
      else {
        editor.style.display = 'none';
      } //if
    });

    $('#editor-add-panel').click( function (e) {
      $('#add-panel-dialog').dialog('open');
    });

    (function () {
      document.body.addEventListener('mousedown', function (e) {
        if (e.altKey && currentSequence) {
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
          div = currentSequence.rootElement;
          startPos = [cssCamera.position[0], cssCamera.position[1]];
          document.body.addEventListener('mouseup', mouseUpHandler, false);
          document.body.addEventListener('mousemove', mouseMoveHandler, false);
        } //if
      }, false);
    })();


    /* -------------------------------------------------------------------------
     * Init
     */
    for (var i=0; i<sequences.length; ++i) {
      sequences[i].prepare(scene);
    } //for

    toggleEditorProperties(true);
    setupEditorProperties(sequences[0]);
    LittleBrother.showSequence(sequences[0]);
    currentSequence = sequences[0];


    /* -------------------------------------------------------------------------
     * CSS Animation Loop
     */
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
      currentSequence.rootElement.style.left = cssCamera.position[0] + "px";
      currentSequence.rootElement.style.top = cssCamera.position[1] + "px";
    })(); 
 
  }, false); //DOM ready

  /* -------------------------------------------------------------------------
   * Little Brother Object
   */
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
      if (sequence !== currentSequence) {
        sequence.show();
      } //if
    },

    pauseSequence: function (sequence) {
      sequence.pause();
    }, //stopSequence

    stopSequence: function (sequence) {
      sequence.stop();
    }, //stopSequence


    /* -------------------------------------------------------------------------
     * Panel
     */
    Panel: function (options) {
      this.image = options.image;
      this.position = options.position || [0,0,0];
      this.rotation = options.rotation || [0,0,0];
      this.scale = options.scale || [1,1,1];

      var image = this.sourceImage = new Image(),
          that = this,
          BORDER_WIDTH = 20,
          canvas = this.canvas = document.createElement('CANVAS');

      image.onload = function (e) {
        var w = image.width, h = image.height;
        that.width = w;
        that.height = h;
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
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
        canvas.style.width = w/2 + 'px';
        canvas.style.height = h/2 + 'px';
      };
      image.src = options.image;

      canvas.style.position = 'absolute';
      canvas.style.top = this.position[0] + 'px';
      canvas.style.left = this.position[1] + 'px';
      $(canvas).draggable({
        start: function (event, ui) {
          if (event.altKey || event.shiftKey || (editingObject !== canvas)) {
            return false;
          } //if
          currentSequence.sortPanels(that);
        },
        stop: function (event, ui) {
          that.position = [canvas.offsetLeft, canvas.offsetTop, 0];
        },
      });

      canvas.addEventListener('mousedown', function (e) {
        if (e.shiftKey && editingObject === canvas) {

          var mouseDownPos = [e.pageX, e.pageY], 
              canvasSize = [0,0], 
              startPos = [0,0], 
              startDist = [0,0],
              ratio = 0;

          function mouseUpHandler(ev) {
            document.body.removeEventListener('mouseup', mouseUpHandler, false);
            document.body.removeEventListener('mousemove', mouseMoveHandler, false);
            that.width = $(canvas).width();
            that.height = $(canvas).height();
          }

          function mouseMoveHandler(ev) {
            var diff = [ev.pageX - startPos[0], ev.pageY - startPos[1]];
            var dist = Math.sqrt(diff[0]*diff[0] + diff[1]*diff[1]);
            canvas.style.width = canvasSize[0] + (-startDist + dist) + 'px';
            canvas.style.height = canvasSize[1] + (-startDist + dist)/ratio + 'px';
          }

          canvasSize[0] = $(canvas).width();
          canvasSize[1] = $(canvas).height();
          ratio = canvasSize[0]/canvasSize[1];
          var rect = canvas.getClientRects()[0];
          startPos[0] = rect.left;
          startPos[1] = rect.top;
          var d = [mouseDownPos[0] - startPos[0], mouseDownPos[1] - startPos[1]];
          startDist = Math.sqrt(d[0]*d[0] + d[1]*d[1]);

          document.body.addEventListener('mouseup', mouseUpHandler, false);
          document.body.addEventListener('mousemove', mouseMoveHandler, false);
        } //if
      }, false);

    }, //Panel



    /* -------------------------------------------------------------------------
     * Sequence
     */
    Sequence: function (options) {

      var that = this;

      this.rootElement = document.createElement('DIV');
      this.rootElement.className = 'sequence-div';
      $testDiv = $('<div>Test</div>');
      $testDiv.css({
        position: 'absolute',
        left: '0px',
        top: '0px',
        border: '1px solid #000',
        width: '100px',
        height: '100px',
        color: '#000',
      });
      $(this.rootElement).append($testDiv);

      this.assets = options.assets || {
        images:[],
      };

      this.name = options.name || 'Untitled';
      this.panels = [];

      this.getScene = function () {
        return scene;
      };

      this.options = options;

      this.options.show = this.options.show || function (){};
      this.options.hide = this.options.hide || function (){};

      this.addPanel = function (panel) {
        this.panels.push(panel);
        this.rootElement.appendChild(panel.canvas);
        setupEditorProperties(this);
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

        var trackliner;

        popcorn.listen('loadedmetadata', function (e) {
          trackliner = that.trackliner = new TrackLiner({
            element: 'timeline',
            scale: 10,
            restrictToKnownPlugins: true,
            duration: popcorn.duration(),
          });
          tracks['css-camera-0'] = trackliner.createTrack('CSS Camera 0', 'little-brother-camera');
          tracks['panels'] = trackliner.createTrack('Panels', 'little-brother-panel');
        });

        popcorn.listen('timeupdate', function (e) {
          $('#timeline-playhead').css({left:
            popcorn.currentTime()*trackliner.scale() + "px",
          });
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
          //for (var i=0; i<that.options.panels.length; ++i) {
          //  this.addPanel(that.options.panels[i]);
          //} //for
        } //if
        if (that.options.popcorn) {
          that.options.popcorn.apply(this, []);
          var trackEvents = this.popcorn.getTrackEvents();
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
          that.panels[i].canvas.style.zIndex = 8000;
        } //for
        panel.canvas.style.zIndex = 9000;
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

    }, //Sequence
  };

}()); //LittleBrother

