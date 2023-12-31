# mediapipe2osc
 A Javascript solution for sending mediapipe landmark coordinates via UDP as OSC messages to any application that can receive them such as Unity, Unreal, Ableton Live, Max and more. Offers the potential to control and manipluate data, audio and visual output using body, hand or face detection and positional tracking.

 This solution uses the [osc.js library](https://github.com/adzialocha/osc-js#osc-js) and builds on [monlim's MediaPipe-Hands-OSC](https://github.com/monlim/MediaPipe-Hands-OSC) to include face and body detection and tracking.


# Installation 
You need to have Node installed on your computer. Download the latest stable version [here](https://nodejs.org/en/). Launch the installer and install Node.

Open your terminal window and go to the folder where you downloaded mediapipe2osc. 

Install package dependencies (the files you will need to run the code) by typing in:

```$ npm install```

Then, run bridge.js to enable OSC sending: 

```$ node bridge.js```

You should see the message 'osc success'.

Open one of the files in your browser (for example: mediapipe-face-detection-to-osc.html) grant permission for your webcam to begin sending OSC messages.

<b>If your browser doesn't load the page, you will probably need to disable cross-origin restrictions (see instructions for your specific browser).</b>

UDP is currently set to send on port 8080 and receive on port 9129.

You will then need another application to receive your OSC messages, you can test this pretty quickly in Ableton or Max, or build a quick OSC receiver in Unity or Unreal.

# Current capabilities

mediapipe2osc-face-detection: sends value 1 as an OSC message when a face is detected in the camera frame and value 0 when no face is detected.

mediapipe2osc-face-landmarks: sends the x and y coordinates of the rightEye, leftEye, noseTip, mouthCenter, rightEar and leftEar as OSC messages.

mediapipe2osc-distance: sends the distance from the camera to the face in cm as an OSC message.

mediapipe2osc-pose: for now this sends some basic pose landmark coordinates of some main body parts via OSC

mediapipe2osc-hand-landmarks: this currently send the coords of the wrist and finger tips for each hand as OSC messages


