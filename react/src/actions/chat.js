import * as types from '../constants'
import JanusVideoRoom from 'lib/janusvideoroom';
import store from 'containers/VideoChatApp/store';
import _ from 'lodash';

export let janusClient = new JanusVideoRoom({
    bitrate: types.CONFIG_JANUS_BITRATE,
    url: types.CONFIG_JANUS_URL
    // url: 'ws://localhost:8188/janus'
});

export const chatUserEnter = (users) => ({ type: types.CHAT_USER_ENTER, users });
export const chatUserExit = (users) => ({ type: types.CHAT_USER_EXIT, users });
export const chatUserUpdate = (users) => ({ type: types.CHAT_USER_UPDATE, users });
export const chatSelectUser = (user) => ({ type: types.CHAT_SELECT_USER, user });
export const chatShowTextChat = (show) => ({ type: types.CHAT_SHOW_TEXT_CHAT, show })
export const chatClearTextMessages = () => ({ type: types.CHAT_CLEAR_TEXT_MESSAGES })
export const chatPromptUsername = (show) => ({ type: types.CHAT_PROMPT_USERNAME, show })
export const chatSendTextMessage = (text) => {
    let msg = {
        user: janusClient.username(),
        ts: Date.now(),
        text: text
    };
    janusClient.sendTextMessage(text);
    return { type: types.CHAT_SEND_TEXT_MESSAGE, message: msg };
}
export const chatAddTextMessage = (msg) => {
    return { type: types.CHAT_ADD_TEXT_MESSAGE, message: msg };
}
export const chatConnect = (name, roomid = types.CONFIG_JANUS_ROOM) => {
    return (dispatch) => {
        janusClient.username(name);
        janusClient.connect().then(() => {
            return janusClient.join(roomid);
        }).then(() => {
            dispatch({ type: types.CHAT_CONNECT });
            let constraints = {
                video: true,
                audio: true
            }
            return navigator.mediaDevices.getUserMedia(constraints);
        }).then((stream) => {
            return janusClient.publish(stream).then(() => {
                console.log(' ::::  published local stream');
            });
        }).catch((e) => {
            // alert('Unable to find a camera.  Try reconnect the camera and reboot the computer.');
            let constraints = {
                video: false,
                audio: true
            }
            navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
                return janusClient.publish(stream).then(() => {
                    console.log(' ::::  published local stream');
                }).catch((e) => {
                    alert('Unable to find a camera.  Try reconnect the camera or microphone and reboot the computer.');
                });
            });
        });
    }
};

export const chatDisconnect = () => {
    return (dispatch) =>  {
        janusClient.disconnect().then(() => {
            dispatch({ type: types.CHAT_DISCONNECT });
        });
    };
};

export const chatEnableAudio = (enable) => {
    janusClient.enableAudio(enable);
    return { type: types.CHAT_ENABLE_AUDIO, enable }
}

export const chatEnableVideo = (enable) => {
    janusClient.enableVideo(enable);
    return { type: types.CHAT_ENABLE_VIDEO, enable }
}

/**
 * Janus Event Handlers
 */
janusClient.on('localstream', (user) => {
    let action = chatUserUpdate([user]);
    store.dispatch(action);
});

janusClient.on('remotestream', (user) => {

    // disable video by default until the stream is selected
    _.forEach(user.stream.getVideoTracks(), (track) => {
        track.enabled = false;
    });
    store.dispatch(chatUserUpdate([user]));
});

janusClient.on('publishers', (users) => {
    store.dispatch(chatUserEnter(users));
    _.forEach(users, (user) => {
        janusClient.subscribe(user.id, {
            audio: true,
            video: true,
            data: true
        });
    });
});

janusClient.on('unpublished', (user) => {
    store.dispatch(chatUserExit([user]));
});

janusClient.on('leaving', (user) => {
    store.dispatch(chatUserExit([user]));
});

janusClient.on('statusUpdate', (msg) => {
    let user = msg[0];
    let status = msg[1];
    console.log('statusUpdate user: ' + user.display + ': ' + JSON.stringify(status));
    store.dispatch(chatUserUpdate([user]));
});

janusClient.on('chatMsg', (msg) => {
    let user = msg[0];
    let text = msg[1];
    let textMessage = {
        user: user.display,
        ts: Date.now(),
        text: text
    }
    console.log('chatMsg user: ' + user.display + ': ' + text);
    store.dispatch(chatAddTextMessage(textMessage));
});

janusClient.on('thumbnailUpdate', (user) => {
    store.dispatch(chatUserUpdate([user]));
});

janusClient.on('error', (msg) => {
    alert('Server Error: ' + msg + "\n\nPlease try to reload the webpage.");
});