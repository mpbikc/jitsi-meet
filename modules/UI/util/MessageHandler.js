/* global $, APP, jQuery, toastr, Impromptu */
/* jshint -W101 */

import UIUtil from './UIUtil';

/**
 * Flag for enable/disable of the notifications.
 * @type {boolean}
 */
let notificationsEnabled = true;

/**
 * Flag for enabling/disabling popups.
 * @type {boolean}
 */
let popupEnabled = true;

var messageHandler = {
    OK: "dialog.OK",
    CANCEL: "dialog.Cancel",

    /**
     * Shows a message to the user.
     *
     * @param titleKey the key used to find the translation of the title of the
     * message, if a message title is not provided.
     * @param messageKey the key used to find the translation of the message,
     * if a message is not provided.
     * @param title the title of the message. If a falsy value is provided,
     * titleKey will be used to get a title via the translation API.
     * @param message the message to show. If a falsy value is provided,
     * messageKey will be used to get a message via the translation API.
     */
    openMessageDialog: function(titleKey, messageKey, title, message) {
        if (!popupEnabled)
            return;

        if (!title) {
            title = APP.translation.generateTranslationHTML(titleKey);
        }
        if (!message) {
            message = APP.translation.generateTranslationHTML(messageKey);
        }

        $.prompt(message,
            {title: title, persistent: false}
        );
    },
    /**
     * Shows a message to the user with two buttons: first is given as a
     * parameter and the second is Cancel.
     *
     * @param titleString the title of the message
     * @param msgString the text of the message
     * @param persistent boolean value which determines whether the message is
     *        persistent or not
     * @param leftButton the fist button's text
     * @param submitFunction function to be called on submit
     * @param loadedFunction function to be called after the prompt is fully
     *        loaded
     * @param closeFunction function to be called after the prompt is closed
     * @param focus optional focus selector or button index to be focused after
     *        the dialog is opened
     * @param defaultButton index of default button which will be activated when
     *        the user press 'enter'. Indexed from 0.
     */
    openTwoButtonDialog: function(titleKey, titleString, msgKey, msgString,
        persistent, leftButtonKey, submitFunction, loadedFunction,
        closeFunction, focus, defaultButton) {

        if (!popupEnabled)
            return;

        var buttons = [];

        var leftButton = APP.translation.generateTranslationHTML(leftButtonKey);
        buttons.push({ title: leftButton, value: true});

        var cancelButton
            = APP.translation.generateTranslationHTML("dialog.Cancel");
        buttons.push({title: cancelButton, value: false});

        var message = msgString, title = titleString;
        if (titleKey) {
            title = APP.translation.generateTranslationHTML(titleKey);
        }
        if (msgKey) {
            message = APP.translation.generateTranslationHTML(msgKey);
        }
        $.prompt(message, {
            title: title,
            persistent: false,
            buttons: buttons,
            defaultButton: defaultButton,
            focus: focus,
            loaded: loadedFunction,
            submit: submitFunction,
            close: closeFunction
        });
    },

    /**
     * Shows a message to the user with two buttons: first is given as a
     * parameter and the second is Cancel.
     *
     * @param titleString the title of the message
     * @param msgString the text of the message
     * @param persistent boolean value which determines whether the message is
     *        persistent or not
     * @param buttons object with the buttons. The keys must be the name of the
     *        button and value is the value that will be passed to
     *        submitFunction
     * @param submitFunction function to be called on submit
     * @param loadedFunction function to be called after the prompt is fully
     *        loaded
     */
    openDialog: function (titleString, msgString, persistent, buttons,
                              submitFunction, loadedFunction) {
        if (!popupEnabled)
            return;

        var args = {
            title: titleString,
            persistent: persistent,
            buttons: buttons,
            defaultButton: 1,
            loaded: loadedFunction,
            submit: submitFunction
        };
        if (persistent) {
            args.closeText = '';
        }
        return new Impromptu(msgString, args);
    },

    /**
     * Closes currently opened dialog.
     */
    closeDialog: function () {
        $.prompt.close();
    },

    /**
     * Shows a dialog with different states to the user.
     *
     * @param statesObject object containing all the states of the dialog.
     */
    openDialogWithStates: function (statesObject, options) {
        if (!popupEnabled)
            return;

        return new Impromptu(statesObject, options);
    },

    /**
     * Opens new popup window for given <tt>url</tt> centered over current
     * window.
     *
     * @param url the URL to be displayed in the popup window
     * @param w the width of the popup window
     * @param h the height of the popup window
     * @param onPopupClosed optional callback function called when popup window
     *        has been closed.
     *
     * @returns {object} popup window object if opened successfully or undefined
     *          in case we failed to open it(popup blocked)
     */
    openCenteredPopup: function (url, w, h, onPopupClosed) {
        if (!popupEnabled)
            return;

        var l = window.screenX + (window.innerWidth / 2) - (w / 2);
        var t = window.screenY + (window.innerHeight / 2) - (h / 2);
        var popup = window.open(
            url, '_blank',
            'top=' + t + ', left=' + l + ', width=' + w + ', height=' + h + '');
        if (popup && onPopupClosed) {
            var pollTimer = window.setInterval(function () {
                if (popup.closed !== false) {
                    window.clearInterval(pollTimer);
                    onPopupClosed();
                }
            }, 200);
        }
        return popup;
    },

    /**
     * Shows a dialog prompting the user to send an error report.
     *
     * @param titleKey the title of the message
     * @param msgKey the text of the message
     * @param error the error that is being reported
     */
    openReportDialog: function(titleKey, msgKey, error) {
        this.openMessageDialog(titleKey, msgKey);
        console.log(error);
        //FIXME send the error to the server
    },

    /**
     *  Shows an error dialog to the user.
     * @param titleKey the title of the message.
     * @param msgKey the text of the message.
     */
    showError: function(titleKey, msgKey) {

        if (!titleKey) {
            titleKey = "dialog.oops";
        }
        if (!msgKey) {
            msgKey = "dialog.defaultError";
        }
        messageHandler.openMessageDialog(titleKey, msgKey);
    },

    /**
     * Displayes notification.
     * @param displayName display name of the participant that is associated with the notification.
     * @param displayNameKey the key from the language file for the display name.
     * @param cls css class for the notification
     * @param messageKey the key from the language file for the text of the message.
     * @param messageArguments object with the arguments for the message.
     * @param options object with language options.
     */
    notify: function(displayName, displayNameKey,
                         cls, messageKey, messageArguments, options) {

        if(!notificationsEnabled)
            return;

        var displayNameSpan = '<span class="nickname" ';
        if (displayName) {
            displayNameSpan += ">" + UIUtil.escapeHtml(displayName);
        } else {
            displayNameSpan += "data-i18n='" + displayNameKey +
                "'>" + APP.translation.translateString(displayNameKey);
        }
        displayNameSpan += "</span>";
        return toastr.info(
            displayNameSpan + '<br>' +
            '<span class=' + cls + ' data-i18n="' + messageKey + '"' +
                (messageArguments?
                    " data-i18n-options='" + JSON.stringify(messageArguments) + "'"
                    : "") + ">" +
            APP.translation.translateString(messageKey,
                messageArguments) +
            '</span>', null, options);
    },

    /**
     * Removes the toaster.
     * @param toasterElement
     */
    remove: function(toasterElement) {
        toasterElement.remove();
    },

    /**
     * Enables / disables notifications.
     */
    enableNotifications: function (enable) {
        notificationsEnabled = enable;
    },

    enablePopups: function (enable) {
        popupEnabled = enable;
    }
};

module.exports = messageHandler;
