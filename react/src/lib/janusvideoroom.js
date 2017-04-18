import Janus from './janus';
import Promise from 'bluebird';

let charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export default class JanusVideoRoom  {

    constructor(options) {
        options = options || {};
        this.options = options;
        this.options.url = this.options.url || 'ws://localhost:8188';
        // this.janus = new Janus.Client(options.url, 
        // {
        //     'token': options.token,
        //     'apisecret': options.apisecret
        // });
    }

    id() {
        return this.options.id || 'janus-' + this.randomString(15);
    }

    randomString(len) {
        var randomString = '';
        for (var i = 0; i < len; i++) {
            var randomPoz = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPoz, randomPoz + 1);
        }
        return randomString;
    }

    connect() {
        let self = this;
        let promise = new Promise((resolve, reject) => {
            // Initialize Janus
            let p = new Promise((resolve) => {
                Janus.init({
                    debug: 'all',
                    callback: resolve});
            })
            .then(() => {
                // create Janus connection
                return new Promise((resolve) => {
                    self.janus = new Janus({
                        server: self.options.url,
                        success: resolve,
                        error: reject
                    });
                });
            }).then(() => {
                // attach a video room
                self.janus.attach({
                    plugin: 'janus.plugin.videoroom',
                    opaqueId: self.id(),
                    success: (pluginHandle) => {
                        console.info("janus.plugin.video room attached")
                        self.pluginHandle = pluginHandle;
                        resolve();
                    },
                    error: reject,
                    onmessage: self.onmessage.bind(),
                    mediaState: self.mediaState.bind(),
                    webrtcState: self.webrtcState.bind(),
                    onlocalstream: self.onlocalstream.bind(),
                    onremotestream: self.onremotestream.bind(),
                    oncleanup: self.oncleanup.bind()
                });
            });
        });

        return promise;
    }

    disconnect() {
        let promise = new Promise((resolve, reject) => {
            if (this.pluginHandle) {
                this.pluginHandle.detach();
                this.pluginHandle = undefined;
            }

            if (this.session) {
                this.session.destroy(); 
                this.session = undefined;
            }

            if (this.session) {
                this.connection.close();
                this.connection = undefined;
            }
            resolve();
        });

        return promise;
    }

    createRoom() {

    }

    destroyRoom(roomid) {

    }

    listRooms() {
        let self = this;
        let promise = new Promise((resolve, reject) => {
            if (self.pluginHandle) {
                var request = { "request": "list" };
                self.pluginHandle.send({
                    message: request, 
                    success: (result) => {
                        if (result.videoroom === "success") {
                            resolve(result.list);
                        } else {
                            reject("list request failed");
                        }
                    }
                });
            } else {
                reject("plugin not attached");
            }
                
        });
        return promise;
    }

    forwardRtp() {

    }

    stopForwardRtp() {

    }

    roomExists(roomid) {

    }

    kick(roomid, userid) {

    }

    listUsers(roomid) {
        let self = this;
        let promise = new Promise((resolve, reject) => {
            if (self.pluginHandle) {
                var request = { "request": "listparticipants", "room": roomid };
                self.pluginHandle.send({
                    message: request, 
                    success: (result) => {
                        if (result.videoroom === "participants") {
                            resolve(result.participants);
                        } else {
                            reject("listparticipants request failed");
                        }
                    }
                });
            } else {
                reject("plugin not attached");
            }
                
        });
        return promise;
    }


    // callback handlers
    onmessage(msg, jsep) {

    }

    mediaState(medium, on) {
        Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
    }

    webrtcState(on) {
        Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
    }

    onlocalstream(stream) {
        Janus.debug(" ::: Got a local stream :::");
    }

    onremotestream(stream) {
        Janus.debug(" ::: Got a remote stream :::");
    }

    oncleanup() {
        Janus.debug(" ::: Got a cleanup message :::");
    }
}