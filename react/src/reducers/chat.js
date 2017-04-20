import * as types from '../constants';
import _ from 'lodash';
import JanusVideoRoom from 'lib/janusvideoroom';
import store from 'containers/VideoChatApp/store';

import * as actions from '../actions/chat'

const defaultState = {
    connected: false,
    mainStream: undefined,
    users: [],
    // users: [{
    //           stream: undefined,
    //           thumbnail: undefined,
    //           username: "foobar!!!"
    //       }]
};

export default function reducer(state = defaultState, action) {
    switch (action.type) {
        case types.CHAT_USER_ENTER: {
            return {
                ...state,
                users: _.unionWith(action.users, state.users, (a,b) => a.id == b.id)
            }
        }
        case types.CHAT_USER_EXIT: {
            let result = {
                ...state,
                users: _.differenceWith(state.users, action.users,(a,b) => a.id == b.id)

            };
            return result;
        }
        case types.CHAT_USER_UPDATE: {
            let result = {
                ...state,
                users: _.unionWith(action.users, state.users, (a,b) => a.id == b.id)
            };
            return result;
        }
        case types.CHAT_ROOM_JOIN: {
            return  {
                ...state,
                connected: true
            }
        }
        case types.CHAT_ROOM_LEAVE: {
            return {
                ...defaultState
            }
        }
        case types.CHAT_SELECT_USER: {
            return {
                ...state,
                mainStream: action.user.stream
            }
        }
        default:
            return state;
    }
    return state;
}

let janusClient = new JanusVideoRoom({
    url: 'wss://sd6.dcpfs.net:8989/janus'
});
janusClient.on('localstream', (stream) => {
});

janusClient.on('remotestream', (user) => {
    store.dispatch(actions.chatUserUpdate([user]));
});

janusClient.on('publishers', (users) => {
    store.dispatch(actions.chatUserEnter(users));
});

janusClient.on('unpublished', (users) => {
    store.dispatch(actions.chatUserExit(users));
});

janusClient.on('leaving', (users) => {
    store.dispatch(actions.chatUserExit(users));
});

// connect to janus
janusClient.connect().then(() => {
    return janusClient.join(9000);
}).then(() => {
    let constraints = {
        video: true,
        audio: true
    }
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        let user = {
            stream,
            id: stream.id,
            username: stream.id
        };
        let action = actions.chatUserUpdate([user]);
        store.dispatch(action);

        janusClient.publish(stream).then(() => {
            console.log(' ::::  published local stream');
        });
    });
});