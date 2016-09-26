let frequencyArray
const keyTofrequency = (key) => Math.pow(Math.pow(2, 1 / 12), key - 49) * 440
const frequencyToKey = (frequency) => Math.round(12 * Math.log2(frequency / 440) + 49)
const keyToColor = (key) => `hsl(${((key-1)%12)*30}, 90%, 65%)`
const maxIndex = (array) => array.indexOf(Math.max(...array))
const noteMap = ['G#','A','A#','B','C','C#','D','D#','E','F','F#','G']
const keyToNote = (key) =>
  noteMap[Math.round(key%12)] //Find note
  +Math.round(key/12) // Find octave

const frequencyToNote = (frequency) => keyToNote( frequencyToKey(frequency))

let paths = document.getElementsByTagName('path')
let path
let report = 0
const BIN_COUNT = 2<<8

window.onload = function() {
    "use strict"
    const visualizer = document.getElementById('visualizer')
    visualizer.setAttribute('viewBox', `0 0 ${BIN_COUNT-1} ${BIN_COUNT-1}`)
    const mask = visualizer.getElementById('mask')
    const h = document.querySelector('h1')
    //Declare variables initialized in microphonePermissionGranted()
    let analyser, frequencyPerBin

    const draw = () => {
        requestAnimationFrame(draw)
        analyser.getByteFrequencyData(frequencyArray)

        //Find out key
        let loudestBin = maxIndex(frequencyArray.slice(0, BIN_COUNT - 1))

        const SILENCE_THRESHOLD = 60
        const loudEnough = () => frequencyArray[loudestBin] > SILENCE_THRESHOLD

        h.innerHTML = loudEnough() ? keyToNote(frequencyToKey(loudestBin * frequencyPerBin)) : 'Silent'
            // h.innerHTML = loudEnough()?  (loudestBin*frequencyPerBin).toFixed() + 'Hz' : 'Silent'
        h.style.color = loudEnough() ? keyToColor(frequencyToKey(loudestBin * frequencyPerBin)) : 'white'
            // h.style.color = keyToColor

        let heightToBinRatio = BIN_COUNT/256
        for (let i = 0; i < BIN_COUNT - 1; i++) {
          // log⁡(1+x)/log(256) , x from 0 to 255, normalized log scale.
            paths[i].setAttribute('d', `M ${i} ${BIN_COUNT-1} l 0,-` + Math.log2(1+frequencyArray[i])*32* heightToBinRatio)
            //32 = 1/Math.log2(256)*256
        }
    }

    let microphonePermissionGranted = (stream) => {
        let audio = new AudioContext()
        let audioStream = audio.createMediaStreamSource(stream)
        analyser = audio.createAnalyser()
        audioStream.connect(analyser)
        audio.sampleRate
        // Separates the sampled freqencies into fftSize/2 bins.
        analyser.fftSize = 4096*2 // fftSize = 2*frequencyBinCount
        frequencyPerBin = audio.sampleRate/analyser.fftSize
        frequencyArray = new Uint8Array(analyser.frequencyBinCount)

        for (let i = 0; i < BIN_COUNT-1; i++) {
            path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            mask.appendChild(path)
        }
        draw()
    }

    let microphonePermissionNotGranted = (error) => {
      console.log(error)
        h.innerHTML = "Without access to your microphone I have no audio to work with."
        h.style.color = '#ff3'
    }

    // Ask user for permission to use their microphone
    // Use promise based microphone input if available
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
      navigator.mediaDevices.getUserMedia({audio:true})
      .then(microphonePermissionGranted)
      .catch(microphonePermissionNotGranted)
    }else if(navigator.getUserMedia){ // Unavailable, so use the old navigator.getUserMedia legacy API.
      navigator.getUserMedia = (navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia)

      navigator.getUserMedia({
          audio: true
      }, microphonePermissionGranted, microphonePermissionNotGranted)
    }else{
        h.innerHTML = "GetUserMedia does not work with IE and Safari"
        h.style.color = '#a22'
    }
}
