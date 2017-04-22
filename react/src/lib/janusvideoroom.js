import Janus from './janus';
import Promise from 'bluebird';
import EventEmitter from 'super-event-emitter';
import _ from 'lodash';

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
        this.options.id = this.options.userame || this._id();
        this.options.url = this.options.url || 'ws://localhost:8188';
        this.options.username = this.options.userame || this._id();
        this.publisherHandle = undefined;
        this.subscriberHandles = {};
        this.promises = {};
        this.localStreams = {};
        this.publishers = {};
        this.roomInfo = {};
        this.status = {
            id: 0,
            audioEnabled: true,
            videoEnabled: true,
            speaking: false,
            picture: null,
            display: this.options.username
        };
    }

    /**
     * Create randomly generated client id
     * @private
     * @returns {string} id
     */
    _id() {
        if (!this.options.id) {
            this.options.id = 'viewer-' + this._randomString(15);
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
            new Promise((resolve) => {
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
                    onmessage: (msg, jsep) => { self.onMessagePublisher(msg, jsep); },
                    mediaState: self.onMediaState.bind(self),
                    webrtcState: self.onWebrtcState.bind(self),
                    onlocalstream: self.onLocalStream.bind(self),
                    onremotestream: self.onRemoteStream.bind(self),
                    oncleanup: self.onCleanup.bind(self),
                    // ondataopen: () => {
                    //     self.onDataOpenSubscriber()
                    // },
                    // ondata: (data) => {
                    //     self.onDataSubscriber(data);
                    // }
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

            let stopTrack = (track) => {
                track.stop();
            }

            _.forEach(this.localStreams, (stream) => {
                _.forEach(stream.getVideoTracks(), stopTrack);
                _.forEach(stream.getAudioTracks(), stopTrack);
            });

            resolve();
        });

        return promise;
    }

    enableAudio(enable) {
        if (enable !== undefined) {
            this.status.audioEnabled = enable;

            _.forEach(this.localStreams, (stream) => {
                _.forEach(stream.getAudioTracks(), (track) => {
                    track.enable = this.status.audioEnabled;
                });
            });
        }
        return this.status.audioEnabled;
    }

    enableVideo(enable) {
        if (enable !== undefined) {
            this.status.videoEnabled = enable;

            _.forEach(this.localStreams, (stream) => {
                _.forEach(stream.getAudioTracks(), (track) => {
                    track.enable = this.status.videoEnabled;
                });
            });
        }
        return this.status.videoEnabled;
    }

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

    subscribe(userid, options) {
        let media = _.merge({
            audioSend: true,
            videoSend: false,
            data: true
        }, options);
        let roomid = this.roomInfo.room;
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
                    self.onMessageSubscriber(userid, msg, jsep, media);
                },
                mediaState: self.onMediaState.bind(self),
                webrtcState: self.onWebrtcState.bind(self),
                onlocalstream: self.onLocalStream.bind(self),
                onremotestream: self.onRemoteStream.bind(self),
                oncleanup: () => {
                    self.onCleanupSubscriber(userid);
                },
                ondataopen: () => {
                    self.onDataOpenSubscriber(userid)
                },
                ondata: (data) => {
                    self.onDataSubscriber(userid, data);
                }
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

    // private
    _sendStatus(userid) {
      let content = {
        source: userid,
        status: this.status
      };

      this._sendMessage(userid, "statusUpdate", content);
    }

    _sendMessage(userid, type, content) {
        if (this.publisherHandle === null) {
          return;
        }

        var text = JSON.stringify({
            type: type,
            content: content
        });

        this.publisherHandle.data({
            text: text,
            error: function(reason) { console.error(reason); },
            success: function() { console.log("Data sent: " + type); }
        });
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

    onMessageSubscriber(userid, msg, jsep, media) {
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
                media: media,	// We want recvonly audio/video
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
        this.localStreams[stream.id] = stream;
        this.status.stream = stream;
        this.emit('localstream', stream);
    }

    onRemoteStream(stream) {
        Janus.debug(" ::: Got a remote stream :::");
        this.emit('remotestream', stream);
    }

    onCleanup() {
        Janus.debug(" ::: Got a cleanup message :::");
    }

    onDataOpenSubscriber(userid) {
        this._sendStatus();
    }

    onDataSubscriber(userid, data) {
        console.log('data: ' + data);
        data = JSON.parse(data);
        let user = this.publishers[userid];
        if (user) {
            this.emit(data.type, [user, data.content]);
        }
    }

    // message handlers
    onmsg_attached(msg, jsep) {
        console.log("Successfully attached room " + msg.room + " feed " + msg.id);
        this.emit('attached', msg);
    }

    onmsg_joined(msg, jsep) {
        console.log("Successfully joined room " + msg.room);
        let self = this;
        let promise = this.promises['join'];
        if (promise) {
            promise.resolve(msg);
        }
        this.roomInfo = {
            ...msg,
            publishers: undefined
        };
        this.status.id = this.roomInfo.id;
        this.emit('joined', msg);
        let publishers = [];
        _.forEach(msg.publishers, (publisher) => {
            let pub = _.merge(self.publishers[publisher.id], publisher);
            self.publishers[publisher.id] = pub;
            publishers.push(pub)
        });
        this.emit('publishers', publishers);
    }

    onmsg_event(msg, jsep) {
        let self = this;
        if (msg.publishers) {
            let publishers = [];
            _.forEach(msg.publishers, (publisher) => {
                let pub = _.merge(self.publishers[publisher.id], publisher);
                self.publishers[publisher.id] = pub;
                publishers.push(pub)
            });
            this.emit('publishers', publishers);
        } else if (msg.leaving) {
            let id = msg.leaving;
            let publisher = self.publishers[id];
            if (publisher) {
                this.emit('leaving', publisher);
                delete self.publishers[id];
            }
        } else if (msg.unpublished) {
            let id = msg.unpublished;
            let publisher = self.publishers[id];
            if (publisher) {
                this.emit('unpublished', publisher);
                delete self.publishers[id];
            }
        } else if (msg.error) {
            this.emit('error', msg.error);
            console.error(msg.error);
        }
    }
}
