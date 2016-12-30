var audioCtx = new (window.AudioContext || window.webkitAudioContext) ();

var oscillator = audioCtx.createOscillator();

var midi = null;
var activeNotes = [];
var envelope=null;    // the envelope for the single oscillator
var attack=0.05;      // attack speed
var release=0.05;   // release speed
var portamento=0.05;  // portamento/glide speed

oscillator.frequency.setValueAtTime(110, 0);
envelope = audioCtx.createGain();
oscillator.connect(envelope);
envelope.connect(audioCtx.destination);
envelope.gain.value = 0.0;  // Mute the sound
oscillator.start(0);

var oscillatorStarted = false;
function startStopOscillator(btn) {
    if(oscillatorStarted) {
        oscillator.disconnect(audioCtx.destination);
        btn.innerText = 'Start';
    }
    else {
        oscillator.connect(audioCtx.destination);
        btn.innerText = 'Stop';
    }
    oscillatorStarted = !oscillatorStarted;
}


function onMidiMessage(e) {
    console.log(e.data);
}

function onMidiSuccess(midiAccess) {
    midi = midiAccess;
    listInputsAndOutputs(midi);
    startLoggingMIDIInput(midi);
    console.log("Midi is ready");
}

function onMidiFailue(msg) {
    console.log("Failed to get MIDI access - " + msg);
}

function listInputsAndOutputs( midiAccess ) {
    for (var entry of midiAccess.inputs) {
        var input = entry[1];
        console.log( "Input port [type:'" + input.type + "'] id:'" + input.id +
            "' manufacturer:'" + input.manufacturer + "' name:'" + input.name +
            "' version:'" + input.version + "'" );
    }

    for (var entry of midiAccess.outputs) {
        var output = entry[1];
        console.log( "Output port [type:'" + output.type + "'] id:'" + output.id +
            "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
            "' version:'" + output.version + "'" );
    }
}

function onMIDIMessage( event ) {
    switch (event.data[0] & 0xf0){
        case 0x90:
            if(event.data[2]!=0){
                noteOn(event.data[1]);
                return;
            }
        case 0x80:
            noteOff(event.data[1]);
            return
    }
    var str = "MIDI message received at timestamp " + event.timestamp + "[" + event.data.length + " bytes]: ";
    for (var i=0; i<event.data.length; i++) {
        str += "0x" + event.data[i].toString(16) + " ";
    }
    console.log( str );
}

function startLoggingMIDIInput( midiAccess ) {
    midiAccess.inputs.forEach( function(entry) {
        entry.onmidimessage = onMIDIMessage;
    });
}

function frequencyFromNoteNumber( note ) {
    return 440 * Math.pow(2,(note-69)/12);
}

function noteOn(noteNumber) {
    activeNotes.push(noteNumber);
    oscillator.frequency.cancelScheduledValues(0);
    oscillator.frequency.setTargetAtTime(frequencyFromNoteNumber(noteNumber), 0, portamento);
    envelope.gain.cancelScheduledValues(0);
    envelope.gain.setTargetAtTime(1.0, 0, attack);
}

function noteOff(noteNumber) {
    var position = activeNotes.indexOf(noteNumber);
    if (position!=-1) {
        activeNotes.splice(position,1);
    }
    if (activeNotes.length==0) {  // shut off the envelope
        envelope.gain.cancelScheduledValues(0);
        envelope.gain.setTargetAtTime(0.0, 0, release );
    } else {
        oscillator.frequency.cancelScheduledValues(0);
        oscillator.frequency.setTargetAtTime( frequencyFromNoteNumber(activeNotes[activeNotes.length-1]), 0, portamento );
    }
}

navigator.requestMIDIAccess().then(onMidiSuccess, onMidiFailue);
