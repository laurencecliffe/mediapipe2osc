
/**
 * @fileoverview Demonstrates a minimal use case for MediaPipe face tracking.
 */
const controls = window;
const drawingUtils = window;
const mpFaceDetection = window;
// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
var osc = new OSC();
osc.open(); //connect by default to ws://localhost.8080

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

    // Draw detected faces on canvas
    if (results.detections.length > 0) {
        let i = 0;
        while (i < results.detections.length) {

            drawingUtils.drawRectangle(canvasCtx, results.detections[i].boundingBox, { color: 'blue', lineWidth: 4, fillColor: '#00000000' });
            drawingUtils.drawLandmarks(canvasCtx, results.detections[i].landmarks, {
            color: 'red',
            radius: 5,
            });
            i += 1;

        }


    }

    // Send OSC message to confirm a face is detected

    if (results.detections.length > 0) {
        var faceDetected = new OSC.Message("/faceDetected true");
        osc.send(faceDetected);

        // Send the coordinates of all the detected face landmarks as OSC messages

        let i = 0;
        while (i < results.detections.length) {

            var landmarks = results.detections[i].landmarks;

            // right eye, 
            var rightEye = new OSC.Message("/rightEye/",i,landmarks[0].x,landmarks[0].y);
            osc.send(rightEye);
            
            // left eye, 
            var leftEye = new OSC.Message("/leftEye/",i,landmarks[1].x,landmarks[1].y);
            osc.send(leftEye);
            
            // nose tip, 
            var noseTip = new OSC.Message("/noseTip/",i,landmarks[2].x,landmarks[2].y);
            osc.send(noseTip);
            
            // mouth center
            var mouthCenter = new OSC.Message("/mouthCenter/",i,landmarks[3].x,landmarks[3].y);
            osc.send(mouthCenter);

            // right ear tragion
            var rightEar = new OSC.Message("/rightEar/",i,landmarks[4].x,landmarks[4].y);
            osc.send(rightEar);

            // left ear tragion
            var leftEar = new OSC.Message("/leftEar/",i,landmarks[5].x,landmarks[5].y);
            osc.send(leftEar);
            
            
            i += 1;
        }

        // Send OSC message if no face detected

    } else {
        faceDetected = new OSC.Message("/faceDetected false");
        osc.send(faceDetected);
    }
      
    canvasCtx.restore();
}
const faceDetection = new mpFaceDetection.FaceDetection({ locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`;
    } });
faceDetection.onResults(onResults);
// Present a control panel through which the user can manipulate the solution
// options.
new controls
    .ControlPanel(controlsElement, {
    selfieMode: true,
    model: 'short',
    minDetectionConfidence: 0.5,
})
    .add([
    new controls.StaticText({ title: 'MediaPipe Face Detection' }),
    fpsControl,
    new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new controls.SourcePicker({
        onSourceChanged: () => {
            faceDetection.reset();
        },
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
            await faceDetection.send({ image: input });
        },
        examples: {
            images: [],
            videos: [],
        },
    }),
    new controls.Slider({
        title: 'Model Selection',
        field: 'model',
        discrete: { 'short': 'Short-Range', 'full': 'Full-Range' },
    }),
    new controls.Slider({
        title: 'Min Detection Confidence',
        field: 'minDetectionConfidence',
        range: [0, 1],
        step: 0.01
    }),
])
    .on(x => {
    const options = x;
    videoElement.classList.toggle('selfie', options.selfieMode);
    faceDetection.setOptions(options);
});