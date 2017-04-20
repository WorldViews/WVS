import * as types from '../constants'

export const chatUserEnter = (users) => ({ type: types.CHAT_USER_ENTER, users });
export const chatUserExit = (users) => ({ type: types.CHAT_USER_EXIT, users });
export const chatUserUpdate = (users) => ({ type: types.CHAT_USER_UPDATE, users });
export const chatSelectUser = (user) => ({ type: types.CHAT_SELECT_USER, user });