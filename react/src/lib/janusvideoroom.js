import Janus from './janus';
import Promise from 'bluebird';
import EventEmitter from 'super-event-emitter';

let charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Janus Video Room Plugin manager
 *
 * Allow you to manage the janus.plugin.videoroom plugin.
 *
 * Events:
 * 
 */
export default class JanusVideoRoom {

    /**
     * Constructor
     * @param {string:any} options - configuration options
     */
    constructor(options) {
        EventEmitter.mixin(this);
        options = options || {};
        this.options = options;
        this.options.url = this.options.url || 'ws://localhost:8188';
        this.options.username = this.options.userame || this._id();
        this.publisherHandle = undefined;
        this.subscriberHandles = {};
        this.promises = {};
    }

    /**
     * Create randomly generated client id
     * @private
     * @returns {string} id
     */
    _id() {
        if (!this.options.id) {
            this.options.id = 'janus-' + this._randomString(15);
        }
        return this.options.id;
    }

    /**
     * Create a random string
     * @private
     * @param {number} len - length of randome string to generate
     */
    _randomString(len) {
        var randomString = '';
        for (var i = 0; i < len; i++) {
            var randomPoz = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPoz, randomPoz + 1);
        }
        return randomString;
    }

    /**
     * Connect to the janus url specified in the contructor
     * @returns {Promise} promise
     */
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
                    opaqueId: self.options.id,
                    success: (pluginHandle) => {
                        console.info("janus.plugin.video room attached")
                        self.publisherHandle = pluginHandle;
                        resolve();
                    },
                    error: reject,
                    onmessage: self.onMessagePublisher.bind(self),
                    mediaState: self.onMediaState.bind(self),
                    webrtcState: self.onWebrtcState.bind(self),
                    onlocalstream: self.onLocalStream.bind(self),
                    onremotestream: self.onRemoteStream.bind(self),
                    oncleanup: self.onCleanup.bind(self)
                });
            });
        });

        return promise;
    }

    /**
     * Disconnect from janus server
     * @returns {Promise} promise
     */
    disconnect() {
        let promise = new Promise((resolve, reject) => {
            if (this.publisherHandle) {
                this.publisherHandle.detach();
                this.publisherHandle = undefined;
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

    // createRoom() {
    //     console.error('unsupported');
    // }

    // destroyRoom(roomid) {
    //     console.error('unsupported');
    // }

    // forwardRtp() {
    //     console.error('unsupported');
    // }

    // stopForwardRtp() {
    //     console.error('unsupported');
    // }

    listRooms() {
        let self = this;
        let promise = new Promise((resolve, reject) => {
            if (self.publisherHandle) {
                var request = { "request": "list" };
                self.publisherHandle.send({
                    message: request,
                    success: (result) => {
                        if (result.videoroom === "success") {
                            resolve(result.list);
                        } else {
                            reject("list request failed");
                        }
                    },
                    error: reject
                });
            } else {
                reject("plugin not attached");
            }

        });
        return promise;
    }

    roomExists(roomid) {
        let self = this;
        let promise = new Promise((resolve, reject) => {
            if (self.publisherHandle) {
                var request = { "request": "exists", "room": roomid };
                self.publisherHandle.send({
                    message: request,
                    success: (result) => {
                        if (result.videoroom === "success") {
                            resolve(result.exists);
                        } else {
                            reject("exists request failed");
                        }
                    },
                    error: reject
                });
            } else {
                reject("plugin not attached");
            }

        });
        return promise;
    }

    kick(roomid, userid, adminsecret) {
        let self = this;
        let promise = new Promise((resolve, reject) => {
            if (self.publisherHandle) {
                var request = {
                    "request": "kick",
                    "room": roomid,
                    "secret": adminsecret,
                    "id": userid
                };
                self.publisherHandle.send({
                    message: request,
                    success: (result) => {
                        resolve(result.videoroom === "success");
                    },
                    error: reject
                });
            } else {
                reject("plugin not attached");
            }

        });
        return promise;
    }

    listUsers(roomid) {
        let self = this;
        let promise = new Promise((resolve, reject) => {
            if (self.publisherHandle) {
                var request = { "request": "listparticipants", "room": roomid };
                self.publisherHandle.send({
                    message: request,
                    success: (result) => {
                        if (result.videoroom === "participants") {
                            resolve(result.participants);
                        } else {
                            reject("listparticipants request failed");
                        }
                    },
                    error: reject
                });
            } else {
                reject("plugin not attached");
            }

        });
        return promise;
    }

    publish(stream) {
        return new Promise((resolve, reject) => {
            let self = this;
            let media = {
                videoRecv: false,
                audioRecv: false,
                videoSend: stream.getVideoTracks().length > 0,
                audioSend: stream.getAudioTracks().length > 0,
                data: true,
                video: 'main'
            };
            self.publisherHandle.createOffer({
                stream: stream,
                media: media,
                success: (jsep) => {
                    console.log("Got publisher SDP!");
                    console.log(jsep);
                    var publish = {
                        "request": "publish",
                        "audio": media.videoSend,
                        "video": media.audioSend
                    };
                    self.publisherHandle.send({"message": publish, "jsep": jsep});
                    resolve();
                },
                error: (error) => {
                    console.error("WebRTC error publishing");
                    console.error(error);
                    reject(error);
                }
            });
        });
    }

    unpublish(roomid) {
        let self = this;
        let promise = new Promise((resolve, reject) => {
            if (self.publisherHandle) {
                var request = { "request": "unpublish" };
                self.publisherHandle.send({
                    message: request,
                    success: resolve,
                    error: reject
                });
            } else {
                reject("plugin not attached");
            }

        });
        return promise;
    }

    subscribe(roomid, userid) {
        let self = this;
        let promise = new Promise((resolve, reject) => {
            self.janus.attach({
                plugin: 'janus.plugin.videoroom',
                opaqueId: self.options.id,
                success: (pluginHandle) => {
                    console.info("janus.plugin.videoroom subscriber attached")
                    self.subscriberHandles[userid] = pluginHandle;

                    var listen = {
                        "request": "join",
                        "room": roomid,
                        "ptype": "listener",
                        "feed": userid
                    };
                    pluginHandle.send({"message": listen});
                    resolve();
                },
                error: reject,
                onmessage: (msg, jsep) => {
                    self.onMessageSubscriber(userid, msg, jsep)
                },
                mediaState: self.onMediaState.bind(self),
                webrtcState: self.onWebrtcState.bind(self),
                onlocalstream: self.onLocalStream.bind(self),
                onremotestream: self.onRemoteStream.bind(self),
                oncleanup: self.onCleanup.bind(self)
            });
        });
        return promise;
    }

    join(roomid) {
        let self = this;
        self.roomid = roomid;
        let promise = new Promise((resolve, reject) => {
            self.promises['join'] = { resolve, reject };
            if (self.publisherHandle) {
                let request = {
                    "request": "join",
                    "room": roomid,
                    "ptype": "publisher",
                    "display": self.options.username
                };
                self.publisherHandle.send({
                    message: request,
                    success: () => {
                        console.debug('Successfully sent');
                    },
                    error: reject
                });
            } else {
                reject("plugin not attached");
            }
        });
        return promise;
    }

    leave(roomid) {
        let self = this;
        self.roomid = undefined;
        let promise = new Promise((resolve, reject) => {
            if (self.publisherHandle) {
                let request = { "request": "leave" };
                self.publisherHandle.send({
                    message: request,
                    success: () => {
                        console.debug('Successfully sent');
                        resolve();
                    },
                    error: reject
                });
            } else {
                reject("plugin not attached");
            }
        });
        return promise;
    }


    // callback handlers
    onMessagePublisher(msg, jsep) {
        let event = msg.videoroom;
        Janus.debug("onmessage: msg = " +
            JSON.stringify(msg) + " jsep = " + JSON.stringify(jsep));

        switch (event) {
            case "joined":
                this.onmsg_joined(msg, jsep);
                break;

            case "event":
                this.onmsg_event(msg, jsep);
                break;
        }

        if (jsep) {
            this.publisherHandle.handleRemoteJsep({jsep: jsep});
        }
    }

    onMessageSubscriber(userid, msg, jsep) {
        Janus.debug("onmessage: msg = " +
            JSON.stringify(msg) + " jsep = " + JSON.stringify(jsep));

        let event = msg.videoroom;
        switch (event) {
            case "attached":
                this.onmsg_attached(msg, jsep);
                break;

            case "event":
                this.onmsg_event(msg, jsep);
                break;
        }

        let self = this;
        let subscriberHandle = self.subscriberHandles[userid];
        if (jsep) {
            subscriberHandle.handleRemoteJsep({jsep: jsep});

            subscriberHandle.createAnswer({
                jsep: jsep,
                // Add data:true here if you want to subscribe to datachannels as well
                // (obviously only works if the publisher offered them in the first place)
                media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
                success: function(jsep) {
                    var body = { "request": "start", "room": self.roomid };
                    subscriberHandle.send({"message": body, "jsep": jsep});
                },
                error: function(error) {
                    console.error("WebRTC error:", error);
                }
            });
        }
    }

    onMediaState(medium, on) {
        Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
        this.emit('mediastate', medium, on);
    }

    onWebrtcState(on) {
        Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
        this.emit('webrtcstate', on);
    }

    onLocalStream(stream) {
        Janus.debug(" ::: Got a local stream :::");
        this.emit('localstream', stream);
    }

    onRemoteStream(stream) {
        Janus.debug(" ::: Got a remote stream :::");
        this.emit('remotestream', stream);
    }

    onCleanup() {
        Janus.debug(" ::: Got a cleanup message :::");
    }

    // message handlers
    onmsg_attached(msg, jsep) {
        console.log("Successfully attached room " + msg.room + " feed " + msg.id);
        this.emit('attached', msg);
    }

    onmsg_joined(msg, jsep) {
        console.log("Successfully joined room " + msg.room);
        let promise = this.promises['join'];
        if (promise) {
            promise.resolve(msg);
        }
        this.emit('joined', msg);
    }

    onmsg_event(msg, jsep) {
        if (msg.publishers) {
            this.emit('publishers', msg.publishers);
        } else if (msg.leaving) {
            this.emit('leaving', msg.publishers);
        } else if (msg.unpublished) {
            this.emit('unpublished', msg.unpublished);
        } else if (msg.error) {
            this.emit('error', msg.error);
            console.error(msg.error);
        }
    }
}
