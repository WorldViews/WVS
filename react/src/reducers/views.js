import * as types from '../constants';

const defaultState = {
    leftView: undefined,
    rightView: undefined
};

export default function reducer(state = defaultState, action) {
    switch (action.type) {
        case types.VIEWS_UPDATE_LEFT:
            return {
                ...state,
                leftView: action.view
            };
        case types.VIEWS_UPDATE_RIGHT:
            return {
                ...state,
                rightView: action.view
            };
        default:
            return {
                ...state
            }
    }
}
