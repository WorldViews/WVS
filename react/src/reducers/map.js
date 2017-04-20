import * as types from '../constants';
import _ from 'lodash';
import * as actions from '../actions/chat'

const defaultState = {
    selectedTrack: undefined,
    position: {
        lat: 0,
        lng: 0
    }
};

export default function reducer(state = defaultState, action) {
    switch (action.type) {
        case types.MAP_MOVE:
            return {
                ...state
            };
        case types.MAP_SELECT_TRACK:
            return {
                ...state,
                selectedTrack: action.track
            };
        default:
            return {
                ...state
            }
    }
};
