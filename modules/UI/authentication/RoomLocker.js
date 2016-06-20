/* global APP, JitsiMeetJS */
import UIUtil from '../util/UIUtil';
//FIXME:
import AnalyticsAdapter from '../../statistics/AnalyticsAdapter';

/**
 * Show dialog which asks user for new password for the conference.
 * @returns {Promise<string>} password or nothing if user canceled
 */
function askForNewPassword () {
    let passMsg = APP.translation.generateTranslationHTML("dialog.passwordMsg");
    let yourPassMsg = APP.translation.translateString("dialog.yourPassword");
    let msg = `
        <h2>${passMsg}</h2>
        <input name="lockKey" type="text"
               data-i18n="[placeholder]dialog.yourPassword"
               placeholder="${yourPassMsg}" autofocus>
    `;

    return new Promise(function (resolve, reject) {
        APP.UI.messageHandler.openTwoButtonDialog(
            null, null, null,
            msg, false, "dialog.Save",
            function (e, v, m, f) {
                if (v && f.lockKey) {
                    resolve(UIUtil.escapeHtml(f.lockKey));
                }
                else {
                    reject(APP.UI.messageHandler.CANCEL);
                }
            },
            null, null, 'input:first'
        );
    });
}

/**
 * Show dialog which asks for required conference password.
 * @returns {Promise<string>} password or nothing if user canceled
 */
function askForPassword () {
    let passRequiredMsg = APP.translation.translateString(
        "dialog.passwordRequired"
    );
    let passMsg = APP.translation.translateString("dialog.password");
    let msg = `
        <h2 data-i18n="dialog.passwordRequired">${passRequiredMsg}</h2>
        <input name="lockKey" type="text"
               data-i18n="[placeholder]dialog.password"
               placeholder="${passMsg}" autofocus>
    `;
    return new Promise(function (resolve, reject) {
        APP.UI.messageHandler.openTwoButtonDialog(
            null, null, null, msg,
            true, "dialog.Ok",
            function (e, v, m, f) {}, null,
            function (e, v, m, f) {
                if (v && f.lockKey) {
                    resolve(UIUtil.escapeHtml(f.lockKey));
                } else {
                    reject(APP.UI.messageHandler.CANCEL);
                }
            },
            ':input:first'
        );
    });
}

/**
 * Show dialog which asks if user want remove password from the conference.
 * @returns {Promise}
 */
function askToUnlock () {
    return new Promise(function (resolve, reject) {
        APP.UI.messageHandler.openTwoButtonDialog(
            null, null, "dialog.passwordCheck",
            null, false, "dialog.Remove",
            function (e, v) {
                if (v) {
                    resolve();
                } else {
                    reject(APP.UI.messageHandler.CANCEL);
                }
            }
        );
    });
}

/**
 * Show notification that user cannot set password for the conference
 * because server doesn't support that.
 */
function notifyPasswordNotSupported () {
    console.warn('room passwords not supported');
    APP.UI.messageHandler.showError(
        "dialog.warning", "dialog.passwordNotSupported");
}

/**
 * Show notification that setting password for the conference failed.
 * @param {Error} err error
 */
function notifyPasswordFailed(err) {
    console.warn('setting password failed', err);
    APP.UI.messageHandler.showError(
        "dialog.lockTitle", "dialog.lockMessage");
}

const ConferenceErrors = JitsiMeetJS.errors.conference;

/**
 * Create new RoomLocker for the conference.
 * It allows to set or remove password for the conference,
 * or ask for required password.
 * @returns {RoomLocker}
 */
export default function createRoomLocker (room) {
    let password;

    function lock (newPass) {
        return room.lock(newPass).then(function () {
            password = newPass;
        }).catch(function (err) {
            console.error(err);
            if (err === ConferenceErrors.PASSWORD_NOT_SUPPORTED) {
                notifyPasswordNotSupported();
            } else {
                notifyPasswordFailed(err);
            }
            throw err;
        });
    }

    /**
     * @class RoomLocker
     */
    return {
        get isLocked () {
            return !!password;
        },

        get password () {
            return password;
        },

        /**
         * Allows to remove password from the conference (asks user first).
         * @returns {Promise}
         */
        askToUnlock () {
            return askToUnlock().then(
                () => { return lock(); }
            ).then(function () {
                AnalyticsAdapter.sendEvent('toolbar.lock.disabled');
            }).catch(
                reason => {
                    if (reason !== APP.UI.messageHandler.CANCEL)
                        console.error(reason);
                }
            );
        },

        /**
         * Allows to set password for the conference.
         * It asks user for new password and locks the room.
         * @returns {Promise}
         */
        askToLock () {
            return askForNewPassword().then(
                newPass => { return lock(newPass);}
            ).then(function () {
                AnalyticsAdapter.sendEvent('toolbar.lock.enabled');
            }).catch(
                reason => {
                    if (reason !== APP.UI.messageHandler.CANCEL)
                        console.error(reason);
                }
            );
        },

        /**
         * Asks user for required conference password.
         */
        requirePassword () {
            return askForPassword().then(
                newPass => { password = newPass; }
            ).catch(
                reason => {
                    if (reason !== APP.UI.messageHandler.CANCEL)
                        console.error(reason);
                }
            );
        },

        /**
         * Show notification that to set/remove password user must be moderator.
         */
        notifyModeratorRequired () {
            if (password) {
                APP.UI.messageHandler
                    .openMessageDialog(null, "dialog.passwordError");
            } else {
                APP.UI.messageHandler
                    .openMessageDialog(null, "dialog.passwordError2");
            }
        }
    };
}
