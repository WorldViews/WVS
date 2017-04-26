import * as types from '../constants';

const defaultState = {
    selectedTrack: undefined,
    selectedTrec: undefined,
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
                selectedTrack: action.track,
                selectedTrec: action.trec
            };
        default:
            return {
                ...state
            }
    }
}
