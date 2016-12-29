var audioCtx = new (window.AudioContext || window.webkitAudioContext) ();

var oscillator = audioCtx.createOscillator();

oscillator.start();

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
