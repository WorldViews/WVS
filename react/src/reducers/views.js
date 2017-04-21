import * as types from '../constants';

const defaultState = {
    maximizePanel: undefined,
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
        case types.VIEWS_MAXIMIZE_PANEL: {
            return {
                ...state,
                maximizePanel: action.panel
            }
        }
        case types.VIEWS_RESET_PANELS: {
            return {
                ...state,
                maximizePanel: null
            }
        }
        default:
            return {
                ...state
            }
    }
}
