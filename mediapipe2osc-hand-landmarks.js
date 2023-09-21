
const mpHands = window;
const drawingUtils = window;
const controls = window;
const controls3d = window;
// Usage: testSupport({client?: string, os?: string}[])
// Client and os are regular expressions.
// See: https://cdn.jsdelivr.net/npm/device-detector-js@2.2.10/README.md for
// legal values for client and os

// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
var osc = new OSC();
osc.open(); //connect by default to ws://localhost.8080
const config = { locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${mpHands.VERSION}/${file}`;
    } };
// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new controls.FPS();
// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
    spinner.style.display = 'none';
};

function onResults(results) {
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Update the frame rate.
    fpsControl.tick();
    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks && results.multiHandedness) {
        for (let index = 0; index < results.multiHandLandmarks.length; index++) {
            const classification = results.multiHandedness[index];
            const isRightHand = classification.label === 'Right';
            const landmarks = results.multiHandLandmarks[index];
            drawingUtils.drawConnectors(canvasCtx, landmarks, mpHands.HAND_CONNECTIONS, { color: isRightHand ? '#00FF00' : '#FF0000' });
            drawingUtils.drawLandmarks(canvasCtx, landmarks, {
                color: isRightHand ? '#00FF00' : '#FF0000',
                fillColor: isRightHand ? '#FF0000' : '#00FF00',
                radius: (data) => {
                    return drawingUtils.lerp(data.from.z, -0.15, .1, 10, 1);
                }
            });

            // Send the coords of the left wrist and finger tips if a lefthand is detected

            if (isRightHand === false) {

                var leftHandDetected = new OSC.Message("/leftHandDetected true");
                osc.send(leftHandDetected);

                var leftWrist = new OSC.Message("/leftWrist/",landmarks[0].x,landmarks[0].y);
                osc.send(leftWrist);

                var leftThumbTip = new OSC.Message("/leftThumbTip/",landmarks[4].x,landmarks[4].y);
                osc.send(leftThumbTip);

                var leftIndexTip = new OSC.Message("/leftIndexTip/",landmarks[8].x,landmarks[8].y);
                osc.send(leftIndexTip);

                var leftMiddleTip = new OSC.Message("/leftMiddleTip/",landmarks[12].x,landmarks[12].y);
                osc.send(leftMiddleTip);

                var leftRingTip = new OSC.Message("/leftRingTip/",landmarks[16].x,landmarks[16].y);
                osc.send(leftRingTip);

                var leftPinkyTip = new OSC.Message("/leftPinkyTip/",landmarks[20].x,landmarks[20].y);
                osc.send(leftPinkyTip);

                // Send the coords of the right wrist and finger tips if a righthand is detected

              } else {

                var rightHandDetected = new OSC.Message("/rightHandDetected true");
                osc.send(rightHandDetected);

                var rightWrist = new OSC.Message("/rightWrist/",landmarks[0].x,landmarks[0].y);
                osc.send(rightWrist);

                var rightThumbTip = new OSC.Message("/rightThumbTip/",landmarks[4].x,landmarks[4].y);
                osc.send(rightThumbTip);

                var rightIndexTip = new OSC.Message("/rightIndexTip/",landmarks[8].x,landmarks[8].y);
                osc.send(rightIndexTip);

                var rightMiddleTip = new OSC.Message("/rightMiddleTip/",landmarks[12].x,landmarks[12].y);
                osc.send(rightMiddleTip);

                var rightRingTip = new OSC.Message("/rightRingTip/",landmarks[16].x,landmarks[16].y);
                osc.send(rightRingTip);

                var rightPinkyTip = new OSC.Message("/rightPinkyTip/",landmarks[20].x,landmarks[20].y);
                osc.send(rightPinkyTip);

                
              }

        }


    }

// Send OSC message to confirm a hand is detected



// if (isLeftHand === false) {
//     var leftHandDetected = new OSC.Message("/leftHandDetected true");
//     osc.send(leftHandDetected);

// } else {
//     leftHandDetected = new OSC.Message("/leftHandDetected false");
//     osc.send(leftHandDetected);
// }

// Send the coordinates of all the detected hand(s) landmarks as OSC messages

    canvasCtx.restore();
  
    
}
const hands = new mpHands.Hands(config);
hands.onResults(onResults);
// Present a control panel through which the user can manipulate the solution
// options.
new controls
    .ControlPanel(controlsElement, {
    selfieMode: true,
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
})
    .add([
    new controls.StaticText({ title: 'MediaPipe Hands' }),
    fpsControl,
    new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new controls.SourcePicker({
        onFrame: async (input, size) => {
            const aspect = size.height / size.width;
            let width, height;
            if (window.innerWidth > window.innerHeight) {
                height = window.innerHeight;
                width = height / aspect;
            }
            else {
                width = window.innerWidth;
                height = width * aspect;
            }
            canvasElement.width = width;
            canvasElement.height = height;
            await hands.send({ image: input });
        },
    }),
    new controls.Slider({
        title: 'Max Number of Hands',
        field: 'maxNumHands',
        range: [1, 4],
        step: 1
    }),
    new controls.Slider({
        title: 'Model Complexity',
        field: 'modelComplexity',
        discrete: ['Lite', 'Full'],
    }),
    new controls.Slider({
        title: 'Min Detection Confidence',
        field: 'minDetectionConfidence',
        range: [0, 1],
        step: 0.01
    }),
    new controls.Slider({
        title: 'Min Tracking Confidence',
        field: 'minTrackingConfidence',
        range: [0, 1],
        step: 0.01
    }),
])
    .on(x => {
    const options = x;
    videoElement.classList.toggle('selfie', options.selfieMode);
    hands.setOptions(options);
});