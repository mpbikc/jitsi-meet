
/**
 * Base class for all Large containers which we can show.
 */
export default class LargeContainer {

    /**
     * Show this container.
     * @returns Promise
     */
    show () {
    }

    /**
     * Hide this container.
     * @returns Promise
     */
    hide () {
    }

    /**
     * Resize this container.
     * @param {number} containerWidth available width
     * @param {number} containerHeight available height
     * @param {boolean} animate if container should animate it's resize process
     */
    resize (containerWidth, containerHeight, animate) {
    }

    /**
     * Handler for "hover in" events.
     */
    onHoverIn (e) {
    }

    /**
     * Handler for "hover out" events.
     */
    onHoverOut (e) {
    }

    /**
     * Update video stream.
     * @param {JitsiTrack?} stream new stream
     * @param {string} videoType video type
     */
    setStream (stream, videoType) {
    }

    /**
     * Show or hide user avatar.
     * @param {boolean} show
     */
    showAvatar (show) {
    }

    /**
     * Whether current container needs to be switched on dominant speaker event
     * when the container is on stage.
     * @return {boolean}
     */
    stayOnStage () {
    }
}
