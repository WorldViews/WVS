import * as types from '../constants'
import JanusVideoRoom from 'lib/janusvideoroom';
import store from 'containers/VideoChatApp/store';
import _ from 'lodash';

let janusClient = new JanusVideoRoom({
    url: 'wss://sd6.dcpfs.net:8989/janus'
});

export const chatUserEnter = (users) => ({ type: types.CHAT_USER_ENTER, users });
export const chatUserExit = (users) => ({ type: types.CHAT_USER_EXIT, users });
export const chatUserUpdate = (users) => ({ type: types.CHAT_USER_UPDATE, users });
export const chatSelectUser = (user) => ({ type: types.CHAT_SELECT_USER, user });
export const chatConnect = (roomid) => {
    return (dispatch) => {
        janusClient.connect().then(() => {
            return janusClient.join(roomid);
        }).then(() => {
            let constraints = {
                video: true,
                audio: true
            }
            navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
                janusClient.publish(stream).then(() => {
                    console.log(' ::::  published local stream');
                    dispatch({ type: types.CHAT_CONNECT });
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
janusClient.on('localstream', (stream) => {
    let user = {
        stream,
        id: janusClient.status.id,
        display: 'me'
    };
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
});

janusClient.on('chatMsg', (msg) => {
    let user = msg[0];
    let message = msg[1];
    console.log('chatMsg user: ' + user.display + ': ' + message);
});
