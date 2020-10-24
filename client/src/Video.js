import React from 'react'

const Video = () => {
    const videoEleRef = React.useRef(null);
    React.useEffect(() => {
        if (!videoEleRef.current) return;
        const init = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    // audio: true
                });
                videoEleRef.current.srcObject = mediaStream;
                // videoEleRef.current.onloadedmetadata = e => {
                //     videoEleRef.current.play();
                // }
            } catch (err) {
                console.error(err)
                alert(err)
            }
        };
        init();
    }, [])
    return <video autoPlay ref={videoEleRef}>not suppert video</video>
}

export default Video;