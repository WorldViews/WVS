import * as types from '../constants'

export const viewsUpdateLeft = (view) => ({ type: types.VIEWS_UPDATE_LEFT, view });
export const viewsUpdateRight = (view) => ({ type: types.VIEWS_UPDATE_RIGHT, view });
export const viewsSetMediaUrl = (url) => ({ type: types.VIEWS_SET_MEDIA_URL, url });

// panel should be 'left' or 'right'
export const viewsMaximizePanel = (panel) => ({ type: types.VIEWS_MAXIMIZE_PANEL, panel });
export const viewsResetPanels = () => ({ type: types.VIEWS_RESET_PANELS });