import * as types from '../constants';
import _ from 'lodash';
import * as actions from '../actions/chat'

const defaultState = {
    connected: false,
    mainStream: undefined,
    enableAudio: true,
    enableVideo: true,
    users: []
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
            let users = _.unionWith(action.users, state.users, (a,b) => a.id == b.id);
            let mainStream = state.mainStream;
            if (users.length == 1) {
                mainStream = users[0].stream;
            }
            let result = {
                ...state,
                users,
                mainStream
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
        case types.CHAT_CONNECT: {
            return {
                ...state,
                connected: true
            }
        }
        case types.CHAT_DISCONNECT: {
            return {
                ...state,
                mainStream: undefined,
                connected: false,
                users: []
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
        default:
            return state;
    }
    return state;
}