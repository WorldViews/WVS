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

    static VIDEO_TYPE_NORMAL = 'normal';
    static VIDEO_TYPE_360 = '360';
    static VIDEO_TYPE_DRONE = 'drone';

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
        this.thumbnailTimers = {};
        this.audioElements = {};
        this.roomInfo = {};
        this.me = {};
        this.connected = false;
        this.connecting = false;

        // used to create thumbnail
        this.video = document.createElement('video')
        this.canvas = document.createElement('canvas');
        this.canvas.width = 100;
        this.canvas.height = 100;
        this.canvasContext = this.canvas.getContext('2d');

        this.status = {
            id: 0,
            audioEnabled: true,
            videoEnabled: true,
            speaking: false,
            picture: null,
            display: this.options.username,
            videoType: 'normal'
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

    _stopStream(stream) {
        let stopTrack = (track) => {
            track.stop();
        }

        _.forEach(stream.getVideoTracks(), stopTrack);
        _.forEach(stream.getAudioTracks(), stopTrack);
    }

    _createThumbnail() {
        let self = this;
        _.forEach(this.localStreams, (stream) => {
            if (stream.getVideoTracks().length > 0) {
                self.video.srcObject = stream;
                setTimeout(() => {
                    self.canvasContext.drawImage(self.video, 0, 0, self.video.videoWidth, self.video.videoHeight, 0, 0, 100, 100);
                    self.status.picture = self.canvas.toDataURL('image/jpeg', 0.5);
                    self.me.status.picture = self.status.picture;
                    self._sendStatus();
                    self.emit('thumbnailUpdate', self.me);
                }, 1000);
            } else {
                self._sendStatus();
            }
        });
    }

    /**
     * Connect to the janus url specified in the contructor
     * @returns {Promise} promise
     */
    connect() {
        let self = this;
        let promise = new Promise((resolve, reject) => {
            if (self.connecting) {
                reject("Connecting...");
            }
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
                        success: () => {
                            self.connecting = false;
                            resolve()
                        },
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
                        self.connected = true;
                        resolve();
                    },
                    error: reject,
                    onmessage: (msg, jsep) => { self.onMessagePublisher(msg, jsep); },
                    mediaState: self.onMediaState.bind(self),
                    webrtcState: self.onWebrtcState.bind(self),
                    onlocalstream: self.onLocalStream.bind(self),
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
            this.connected = false
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

            _.forEach(this.publishers, (pub) => {
                this._stopStream(pub.stream);
            });

            _.forEach(this.thumbnailTimers, (t) => {
                clearInterval(t);
            });
            this.audioElements = {};

            _.forEach(this.localStreams, (stream) => {
                this._stopStream(stream);
            });

            this.janus.destroy();

            resolve();
        });

        return promise;
    }

    /**
     * Enable or disable audio
     *
     * @param {boolean} enable - enable/disable audio
     */
    enableAudio(enable) {
        if (enable !== undefined) {
            this.status.audioEnabled = enable;

            _.forEach(this.localStreams, (stream) => {
                _.forEach(stream.getAudioTracks(), (track) => {
                    track.enabled = this.status.audioEnabled;
                });
            });
        }
        return this.status.audioEnabled;
    }

    /**
     * Enable or disable video
     *
     * @param {boolean} enable - enable/disable video
     */
    enableVideo(enable) {
        if (enable !== undefined) {
            this.status.videoEnabled = enable;

            _.forEach(this.localStreams, (stream) => {
                _.forEach(stream.getVideoTracks(), (track) => {
                    track.enabled = this.status.videoEnabled;
                });
            });
        }
        return this.status.videoEnabled;
    }

    /**
     * List rooms
     *
     * @returns {Promise<array>} - promise to be resolved
     */
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

    /**
     * Check if a room exists
     *
     * @param {number} roomid
     * @returns {Promise<boolean>}
     */
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

    /**
     * Kick a user from a room
     *
     * @param {number} roomid
     * @param {number} userid
     * @param {string} adminsecret
     * @returns {Promise<boolean>}
     */
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

    /**
     * List users in a room
     *
     * @param {number} roomid
     * @returns {Promise<array>}
     */
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

    /**
     * Publish a media stream from getUserMedia().
     *
     * @param {MediaStream} stream
     * @returns {Promise}
     */
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

    /**
     * Unpublish a media stream.
     *
     * @returns {Promise}
     */
    unpublish() {
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

    /**
     * Subscribe to a user's stream feed
     *
     * @param {number} userid - user id
     * @param {object} options - options dictionary
     */
    subscribe(userid, options) {
        let media = _.merge({
            audioSend: false,
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
                onremotestream: (stream) => {
                    self.onRemoteStream(userid, stream);
                },
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

    /**
     * Reconfigure the stream already published
     *
     * @param {number} userid - user id
     * @param {object} options - dictionary of options
     */
    configure(userid, options) {
        let promise = new Promise((resolve, reject) => {
            let pluginHandle = self.subscriberHandles[userid];
            var listen = {
                "request": "configure",
                "audio": options.audio || true,
                "video": options.video || true,
                "data": options.data || true
            };
            pluginHandle.send({"message": listen});
            resolve();
        });
        return promise;
    }

    /**
     * Join a room
     *
     * @param {number} roomid - room number to join
     */
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
                    "bitrate": self.options.bitrate,
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

    /**
     * Leave the room
     */
    leave() {
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

    /**
     * Sets or gets the username
     * @param {string} [name] - username
     */
    username(name) {
        if (name) {
            this.options.username = name;
            this._sendStatus();
        }
        return this.options.username;
    }

    /**
     * Sets or gets the video type.
     *
     * Valid video types are 'normal', '360', or 'drone'
     * @param {string} [type] - video type
     */
    videoType(type) {
        if (type) {
            this.options.videoType = type;
            this._sendStatus();
        }
        return this.options.videoType;
    }

    /**
     * Sends a text message
     *
     * @param {string} msg - text message
     */
    sendTextMessage(msg) {
        this._sendMessage("chatMsg", msg);
    }

    /**
     * Find a stream given a username
     *
     * @param {string} username - username
     */
    getStream(username) {
        if (username === 'me') {
            return this.me.stream;
        }
        let info = _.find(this.publishers, {'display': username});
        return _.get(info, 'stream');
    }

    // private
    _sendStatus() {
      let content = {
        source: this.roomInfo.id,
        status: this.status
      };

      this._sendMessage("statusUpdate", content);
    }

    _sendMessage(type, content) {
        if (!this.publisherHandle) {
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

        let self = this;
        this.localStreams[stream.id] = stream;
        this.status.stream = stream;
        this.thumbnailTimers['me'] = setInterval(() => {
            self._createThumbnail();
        }, 10000);
        setTimeout(() => {
            self._createThumbnail();
        }, 2000);

        // make sure the saved audio/video toggle state is updated to
        // the new stream that has been published.
        self.enableAudio(self.enableAudio());
        self.enableVideo(self.enableVideo());

        this.me = {
            ...this.me,
            stream,
            id: this.status.id,
            local: true,
            display: 'me',
            status: {
                picture: null,
                // uncomment this to test 360 view for local stream
                // videoType: '360'
            }
        };

        this.emit('localstream', this.me);
    }

    onRemoteStream(userid, stream) {
        Janus.debug(" ::: Got a remote stream :::");

        let audio = document.createElement('audio');
        this.audioElements[userid] = audio;
        audio.srcObject = stream;
        audio.play();

        let user = this.publishers[userid];
        if (user) {
            if (user.stream) {
                this._stopStream(user.stream);
            }
            user.stream = stream;
            this.emit("remotestream", user);
        }
    }

    onCleanup() {
        Janus.debug(" ::: Got a cleanup message :::");
    }

    onCleanupSubscriber(userid) {
        Janus.debug(" ::: Got a cleanup message " + userid + " :::");

        delete this.publishers[userid];
        clearInterval(this.thumbnailTimers[userid]);
        delete this.thumbnailTimers[userid];
        delete this.audioElements[userid];
    }

    onDataOpenSubscriber(userid) {
        this._sendStatus();
    }

    onDataSubscriber(userid, data) {
        console.log('data: ' + data);
        data = JSON.parse(data);
        let user = this.publishers[userid];
        if (user) {
            switch (data.type) {
                case "statusUpdate":
                    user.status = data.content.status;
                    this.emit(data.type, [user, data.content.status]);
                    break;
                case "chatMsg":
                    this.emit(data.type, [user, data.content]);
                    break;
            }
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

                clearInterval(self.thumbnailTimers[id]);
                delete self.thumbnailTimers[id];


            }
        } else if (msg.error) {
            this.emit('error', msg.error);
            console.error(msg.error);
        }
    }
}
