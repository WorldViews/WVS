import * as types from '../constants';
import _ from 'lodash';

const defaultState = {
    connected: false,
    selectedUser: undefined,
    enableAudio: true,
    enableVideo: true,
    showTextChat: false,
    promptUsername: false,
    username: "",
    users: [],
    messages: []
};

function enableVideo(stream, enable) {
    if (stream) {
        _.forEach(stream.getVideoTracks(), (track) => {
            track.enabled = enable;
        });
    }
}

export default function reducer(state = defaultState, action) {
    switch (action.type) {
        case types.CHAT_USER_ENTER: {
            let users = _.unionWith(action.users, state.users, (a,b) => a.id == b.id);
            users = _.sortBy(users, (u) => u.id);
            if (!state.connected) {
                users = [];
            }
            return {
                ...state,
                users
            }
        }
        case types.CHAT_USER_EXIT: {
            let users = _.differenceWith(state.users, action.users,(a,b) => a.id == b.id);
            users = _.sortBy(users, (u) => u.id);
            // let mainStream = state.mainSteam;
            // if (mainStream) {
            //     let foundUser = _.find(users, (u) => {
            //         return u.stream.id = mainStream.id;
            //     });
            //     if (foundUser) {
            //         mainStream = foundUser.stream;
            //     }
            // }
            let result = {
                ...state,
                // mainStream,
                users

            };
            return result;
        }
        case types.CHAT_USER_UPDATE: {
            let users = _.unionWith(action.users, state.users, (a,b) => a.id == b.id);
            users = _.sortBy(users, (u) => u.id);
            // let users = _.unionBy([action.users, state.users], 'id');
            // let mainStream = state.mainStream;
            // if (users.length == 1) {
            //     mainStream = users[0].stream;
            // }
            if (!state.connected) {
                users = [];
            }
            let result = {
                ...state,
                users,
                // mainStream
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
            let prevStream = _.get(state, 'selectedUser.stream');
            if (!_.get(state, 'selectedUser.local')) {
                enableVideo(prevStream, false);
            }
            if (action.user.stream) {
                enableVideo(action.user.stream, true);
            }

            return {
                ...state,
                selectedUser: action.user
            }
        }
        case types.CHAT_CONNECT: {
            return {
                ...state,
                connected: true
            }
        }
        case types.CHAT_DISCONNECT: {
            return {
                ...state,
                selectedUser: undefined,
                mainStream: undefined,
                connected: false,
                users: [],
                messages: []
            }
        }
        case types.CHAT_ENABLE_AUDIO: {
            return {
                ...state,
                enableAudio: action.enable
            }
        }
        case types.CHAT_ENABLE_VIDEO: {
            return {
                ...state,
                enableVideo: action.enable
            }
        }
        case types.CHAT_SHOW_TEXT_CHAT: {
            return {
                ...state,
                showTextChat: action.show
            }
        }
        case types.CHAT_SEND_TEXT_MESSAGE: {
            return {
                ...state,
                messages: _.concat(state.messages, action.message)
            }
        }
        case types.CHAT_ADD_TEXT_MESSAGE: {
            return {
                ...state,
                messages: _.concat(state.messages, action.message)
            }
        }
        case types.CHAT_CLEAR_TEXT_MESSAGES: {
            return {
                ...state,
                messages: []
            }
        }
        case types.CHAT_PROMPT_USERNAME: {
            return {
                ...state,
                promptUsername: action.show
            }
        }
        default:
            return state;
    }
}