import * as types from '../constants'
import JanusVideoRoom from 'lib/janusvideoroom';
import store from 'containers/VideoChatApp/store';

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
        id: stream.id,
        username: stream.id
    };
    let action = chatUserUpdate([user]);
    store.dispatch(action);
});

janusClient.on('remotestream', (user) => {
    store.dispatch(chatUserUpdate([user]));
});

janusClient.on('publishers', (users) => {
    store.dispatch(chatUserEnter(users));
});

janusClient.on('unpublished', (users) => {
    store.dispatch(chatUserExit(users));
});

janusClient.on('leaving', (users) => {
    store.dispatch(chatUserExit(users));
});
