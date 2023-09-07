
const controls = window;

const drawingUtils = window;
const mpPose = window;
const options = {
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}/${file}`;
    }
};
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

let activeEffect = 'mask';
function onResults(results) {
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Update the frame rate.
    fpsControl.tick();
    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (results.segmentationMask) {
        canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
        // Only overwrite existing pixels.
        if (activeEffect === 'mask' || activeEffect === 'both') {
            canvasCtx.globalCompositeOperation = 'source-in';
            // This can be a color or a texture or whatever...
            canvasCtx.fillStyle = '#00FF007F';
            canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
        else {
            canvasCtx.globalCompositeOperation = 'source-out';
            canvasCtx.fillStyle = '#0000FF7F';
            canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
        // Only overwrite missing pixels.
        canvasCtx.globalCompositeOperation = 'destination-atop';
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.globalCompositeOperation = 'source-over';
    }
    else {
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }
    if (results.poseLandmarks) {
        drawingUtils.drawConnectors(canvasCtx, results.poseLandmarks, mpPose.POSE_CONNECTIONS, { visibilityMin: 0.65, color: 'white' });
        drawingUtils.drawLandmarks(canvasCtx, Object.values(mpPose.POSE_LANDMARKS_LEFT)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' });
        drawingUtils.drawLandmarks(canvasCtx, Object.values(mpPose.POSE_LANDMARKS_RIGHT)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' });
        drawingUtils.drawLandmarks(canvasCtx, Object.values(mpPose.POSE_LANDMARKS_NEUTRAL)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'white' });


        // Find positions of landmarks and send their coordinates as OSC messages here
            
            // Nose x coord
            var noseX = new OSC.Message("/noseX/",results.poseLandmarks[0].x);
            osc.send(noseX);
            // Nose y coord
            var noseY = new OSC.Message("/noseY/",results.poseLandmarks[0].y);
            osc.send(noseY)
            // Left index finger x coord
            var leftIndexX = new OSC.Message("/leftIndexX/",results.poseLandmarks[19].x);
            osc.send(leftIndexX);
            // Left index finger y coord
            var leftIndexY = new OSC.Message("/leftIndexY/",results.poseLandmarks[19].y);
            osc.send(leftIndexY);
            // Right index finger x coord
            var rightIndexX = new OSC.Message("/rightIndexX/",results.poseLandmarks[20].x);
            osc.send(rightIndexX);
            // Right index finger y coord
            var rightIndexY = new OSC.Message("/rightIndexY/",results.poseLandmarks[20].y);
            osc.send(rightIndexY);
            // Left hip x coord
            var leftHipX = new OSC.Message("/leftHipX/",results.poseLandmarks[23].x);
            osc.send(leftHipX);
            // Left hip y coord
            var leftHipY = new OSC.Message("/leftHipY/",results.poseLandmarks[23].y);
            osc.send(leftHipY);
            // Right hip x coord
            var rightHipX = new OSC.Message("/rightHipX/",results.poseLandmarks[24].x);
            osc.send(rightHipX);
            // Right hip y coord
            var rightHipY = new OSC.Message("/rightHipY/",results.poseLandmarks[24].y);
            osc.send(rightHipY);
            // Left foot index x coord
            var leftFootIndexX = new OSC.Message("/leftFootIndexX/",results.poseLandmarks[31].x);
            osc.send(leftFootIndexX);
            // Left foot index y coord
            var leftFootIndexY = new OSC.Message("/leftFootIndexY/",results.poseLandmarks[31].y);
            osc.send(leftFootIndexY);
             // Right foot index x coord
             var rightFootIndexX = new OSC.Message("/rightFootIndexX/",results.poseLandmarks[32].x);
             osc.send(rightFootIndexX);
             // Right foot index y coord
             var rightFootIndexY = new OSC.Message("/rightFootIndexY/",results.poseLandmarks[32].y);
             osc.send(rightFootIndexY);

    }

    canvasCtx.restore();
  
}
const pose = new mpPose.Pose(options);
pose.onResults(onResults);
// Present a control panel through which the user can manipulate the solution
// options.
new controls
    .ControlPanel(controlsElement, {
    selfieMode: true,
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    effect: 'background',
})
    .add([
    new controls.StaticText({ title: 'MediaPipe Pose' }),
    fpsControl,
    new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new controls.SourcePicker({
        onSourceChanged: () => {
            // Resets because this model gives better results when reset between
            // source changes.
            pose.reset();
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
            await pose.send({ image: input });
        },
    }),
    new controls.Slider({
        title: 'Model Complexity',
        field: 'modelComplexity',
        discrete: ['Lite', 'Full', 'Heavy'],
    }),
    new controls.Toggle({ title: 'Smooth Landmarks', field: 'smoothLandmarks' }),
    new controls.Toggle({ title: 'Enable Segmentation', field: 'enableSegmentation' }),
    new controls.Toggle({ title: 'Smooth Segmentation', field: 'smoothSegmentation' }),
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
    new controls.Slider({
        title: 'Effect',
        field: 'effect',
        discrete: { 'background': 'Background', 'mask': 'Foreground' },
    }),
])
    .on(x => {
    const options = x;
    videoElement.classList.toggle('selfie', options.selfieMode);
    activeEffect = x['effect'];
    pose.setOptions(options);
});