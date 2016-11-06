/*
 *
 * MCD4290 2016-T3 Assignment 1 web app
 * 
 * Copyright (c) 2016  Monash University
 *
 * Written by Nawfal Ali
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
*/

function cameraErrorCallback(error)
{
    cameraFailed("Browser not allowing access to camera.");
    console.log("navigator.getUserMedia error: ", error);
}


navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

var video  = document.querySelector('video');

var messageFinishedFlag = false;   // boolean variable: true if the transmission has ended, false otherwise

var canvas = document.querySelector('canvas');
var ctx              = canvas.getContext('2d');
var localMediaStream = null;
var capturingIntervalID;

var unitTime = 200;      // Camera capturing interval


if (typeof MediaStreamTrack === 'undefined')
{
    cameraFailed("Cameras not supported on this device.");
}
else
{
    MediaStreamTrack.getSources(processCameraSources);
}


function cameraFailed(error)
{
    var message = '<span class="errorMessage">' + error + '</span>';
    document.getElementById("cameraContainer").innerHTML = message;
}

/*
 * This function retrieves the list of audio and video resources and selects 
 * the rear camera only
 */
function processCameraSources(sourceInfos)
{
    var audioSource = null;
    var videoSource = null;

    for (var i = 0; i != sourceInfos.length; ++i)
    {
        var sourceInfo = sourceInfos[i];
        if (sourceInfo.kind === 'audio')
        {
            console.log(sourceInfo.id, sourceInfo.label || 'microphone');

            audioSource = sourceInfo.id;
        }
        else if (sourceInfo.kind === 'video')
        {
            console.log(sourceInfo.id, sourceInfo.label || 'camera');

            videoSource = sourceInfo.id;
        }
        else
        {
            console.log('Some other kind of source: ', sourceInfo);
        }
    }

    sourceSelected(audioSource, videoSource); 
    
    /*
    * timeout function to ensure the video is fully loaded in order to 
    * avoid this error:
    *     Failed to execute 'getImageData' on 'CanvasRenderingContext2D':
    *     The source width is 0
    */
    setTimeout(function () {
        capturingIntervalID = setInterval(snapshot, unitTime);
    }, 2000);
}


function sourceSelected(audioSource, videoSource)
{
    var constraints = {
        audio: false,
        video: {
            optional: [{sourceId: videoSource}]
        }
    };

    if (navigator.getUserMedia)
    {
        navigator.getUserMedia(constraints, function (stream) {
            video.src        = window.URL.createObjectURL(stream);
            localMediaStream = stream;
            //   updateImageData();
            //   requestAnimationFrame(draw);
        }, cameraErrorCallback);
    }
    else
    {
        cameraFailed("Back camera not supported on this device.");
    }
}

/*
 * This is a callback function that will be called at regular intervals.
 * Each time it is called it will draw the current video frame to a canvas
 * then ask the canvas for an array or pixel colour values which it will
 * pass to the sutdent's decodeImageData() function.
 */
function snapshot()
{
    var imageData;
    var imageStatus;
    if (localMediaStream)
    {
    	// Draw the video frame to an HTML canvas element.
        canvas.setAttribute('width', 180);
        canvas.setAttribute('height', 240);
        ctx.drawImage(video, 66, 100, 320, 480, 0, 0, 120, 180);

	// Extract from the canvas an array of image pixel colours.
        imageData   = ctx.getImageData(0, 0, 120, 180).data;
        
	// Call the student code to decode the image.
	imageStatus = decodeCameraImage(imageData);
        if (!messageFinishedFlag)
        {    
            // The mesage is not finished, so show the image status.
            setImageStatus((imageStatus) ? 'onSignal' : 'offSignal');
        }
    }
}


/* 
 * This function is intended to be called by student code to indicate when 
 * they have received the complete message.
 */
function messageFinished()
{
    clearInterval(capturingIntervalID);
    setImageStatus('ready');
    messageFinishedFlag = true;
}


/*
 * This anonymous function is called when the user clicks the restart button.
 * It resets the state of the skeleton code.  This code has nothing to do 
 * with the student task of resetting the state of their own code and can 
 * be safely ignored.
 */
document.getElementById('restartButton').addEventListener('click', function() {
    clearInterval(capturingIntervalID);
    setImageStatus('restart');
    capturingIntervalID = setInterval(snapshot, unitTime);
    messageFinishedFlag = false;
});


/*
 * This function accepts one of four input strings:
 *   * 'onSignal'  : Blue status circle
 *   * 'offSignal' : Red status circle
 *   * 'ready'	   : Green status circle
 *   * 'restart'   : Green status circle
 */
function setImageStatus(status)
{
    var statusDot = document.getElementById("imgStatus"); 
    if (status === 'onSignal')
    {
        statusDot.style.backgroundColor = "blue";
    }
    else if (status === 'offSignal')
    {
        statusDot.style.backgroundColor = "red";
    }
    else if (status === 'ready')
    {
        statusDot.style.backgroundColor = "green";
        document.getElementById("spinner").classList.remove('is-active');  // Stop the spinner
    }
    else if (status === 'restart')
    {
        statusDot.style.backgroundColor = "green";
        document.getElementById("spinner").classList.add('is-active');   // Start the spinners
    }
}
