/* global APP, $ */

import {processReplacements, linkify} from './Replacement';
import CommandsProcessor from './Commands';
import ToolbarToggler from '../../toolbars/ToolbarToggler';

import UIUtil from '../../util/UIUtil';
import UIEvents from '../../../../service/UI/UIEvents';

var smileys = require("./smileys.json").smileys;

var notificationInterval = false;
var unreadMessages = 0;


/**
 * Shows/hides a visual notification, indicating that a message has arrived.
 */
function setVisualNotification(show) {
    var unreadMsgElement = document.getElementById('unreadMessages');
    var unreadMsgBottomElement
        = document.getElementById('bottomUnreadMessages');

    var glower = $('#toolbar_button_chat');
    var bottomGlower = $('#chatBottomButton');

    if (unreadMessages) {
        unreadMsgElement.innerHTML = unreadMessages.toString();
        unreadMsgBottomElement.innerHTML = unreadMessages.toString();

        ToolbarToggler.dockToolbar(true);

        var chatButtonElement
            = document.getElementById('toolbar_button_chat');
        var leftIndent = (UIUtil.getTextWidth(chatButtonElement) -
            UIUtil.getTextWidth(unreadMsgElement)) / 2;
        var topIndent = (UIUtil.getTextHeight(chatButtonElement) -
            UIUtil.getTextHeight(unreadMsgElement)) / 2 - 5;

        unreadMsgElement.setAttribute(
            'style',
                'top:' + topIndent +
                '; left:' + leftIndent + ';');

        var chatBottomButtonElement
            = document.getElementById('chatBottomButton').parentNode;
        var bottomLeftIndent = (UIUtil.getTextWidth(chatBottomButtonElement) -
            UIUtil.getTextWidth(unreadMsgBottomElement)) / 2;
        var bottomTopIndent = (UIUtil.getTextHeight(chatBottomButtonElement) -
            UIUtil.getTextHeight(unreadMsgBottomElement)) / 2 - 2;

        unreadMsgBottomElement.setAttribute(
            'style',
                'top:' + bottomTopIndent +
                '; left:' + bottomLeftIndent + ';');


        if (!glower.hasClass('icon-chat-simple')) {
            glower.removeClass('icon-chat');
            glower.addClass('icon-chat-simple');
        }
    }
    else {
        unreadMsgElement.innerHTML = '';
        unreadMsgBottomElement.innerHTML = '';
        glower.removeClass('icon-chat-simple');
        glower.addClass('icon-chat');
    }

    if (show && !notificationInterval) {
        notificationInterval = window.setInterval(function () {
            glower.toggleClass('active');
            bottomGlower.toggleClass('active glowing');
        }, 800);
    }
    else if (!show && notificationInterval) {
        window.clearInterval(notificationInterval);
        notificationInterval = false;
        glower.removeClass('active');
        bottomGlower.removeClass('glowing');
        bottomGlower.addClass('active');
    }
}


/**
 * Returns the current time in the format it is shown to the user
 * @returns {string}
 */
function getCurrentTime(stamp) {
    var now     = (stamp? new Date(stamp): new Date());
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds();
    if(hour.toString().length === 1) {
        hour = '0'+hour;
    }
    if(minute.toString().length === 1) {
        minute = '0'+minute;
    }
    if(second.toString().length === 1) {
        second = '0'+second;
    }
    return hour+':'+minute+':'+second;
}

function toggleSmileys() {
    var smileys = $('#smileysContainer');
    if(!smileys.is(':visible')) {
        smileys.show("slide", { direction: "down", duration: 300});
    } else {
        smileys.hide("slide", { direction: "down", duration: 300});
    }
    $('#usermsg').focus();
}

function addClickFunction(smiley, number) {
    smiley.onclick = function addSmileyToMessage() {
        var usermsg = $('#usermsg');
        var message = usermsg.val();
        message += smileys['smiley' + number];
        usermsg.val(message);
        usermsg.get(0).setSelectionRange(message.length, message.length);
        toggleSmileys();
        usermsg.focus();
    };
}

/**
 * Adds the smileys container to the chat
 */
function addSmileys() {
    var smileysContainer = document.createElement('div');
    smileysContainer.id = 'smileysContainer';
    for(var i = 1; i <= 21; i++) {
        var smileyContainer = document.createElement('div');
        smileyContainer.id = 'smiley' + i;
        smileyContainer.className = 'smileyContainer';
        var smiley = document.createElement('img');
        smiley.src = 'images/smileys/smiley' + i + '.svg';
        smiley.className =  'smiley';
        addClickFunction(smiley, i);
        smileyContainer.appendChild(smiley);
        smileysContainer.appendChild(smileyContainer);
    }

    $("#chatspace").append(smileysContainer);
}

/**
 * Resizes the chat conversation.
 */
function resizeChatConversation() {
    var msgareaHeight = $('#usermsg').outerHeight();
    var chatspace = $('#chatspace');
    var width = chatspace.width();
    var chat = $('#chatconversation');
    var smileys = $('#smileysarea');

    smileys.height(msgareaHeight);
    $("#smileys").css('bottom', (msgareaHeight - 26) / 2);
    $('#smileysContainer').css('bottom', msgareaHeight);
    chat.width(width - 10);
    chat.height(window.innerHeight - 15 - msgareaHeight);
}

/**
 * Chat related user interface.
 */
var Chat = {
    /**
     * Initializes chat related interface.
     */
    init (eventEmitter) {
        if (APP.settings.getDisplayName()) {
            Chat.setChatConversationMode(true);
        }

        $('#nickinput').keydown(function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                let val = this.value;
                this.value = '';
                eventEmitter.emit(UIEvents.NICKNAME_CHANGED, val);
            }
        });

        var usermsg = $('#usermsg');
        usermsg.keydown(function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                var value = this.value;
                usermsg.val('').trigger('autosize.resize');
                this.focus();
                var command = new CommandsProcessor(value, eventEmitter);
                if (command.isCommand()) {
                    command.processCommand();
                } else {
                    var message = UIUtil.escapeHtml(value);
                    eventEmitter.emit(UIEvents.MESSAGE_CREATED, message);
                }
            }
        });

        var onTextAreaResize = function () {
            resizeChatConversation();
            Chat.scrollChatToBottom();
        };
        usermsg.autosize({callback: onTextAreaResize});

        $("#chatspace").bind("shown",
            function () {
                unreadMessages = 0;
                setVisualNotification(false);
            });

        addSmileys();
    },

    /**
     * Appends the given message to the chat conversation.
     */
    updateChatConversation (id, displayName, message, stamp) {
        var divClassName = '';

        if (APP.conference.isLocalId(id)) {
            divClassName = "localuser";
        } else {
            divClassName = "remoteuser";

            if (!Chat.isVisible()) {
                unreadMessages++;
                UIUtil.playSoundNotification('chatNotification');
                setVisualNotification(true);
            }
        }

        // replace links and smileys
        // Strophe already escapes special symbols on sending,
        // so we escape here only tags to avoid double &amp;
        var escMessage = message.replace(/</g, '&lt;').
            replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
        var escDisplayName = UIUtil.escapeHtml(displayName);
        message = processReplacements(escMessage);

        var messageContainer =
            '<div class="chatmessage">'+
                '<img src="images/chatArrow.svg" class="chatArrow">' +
                '<div class="username ' + divClassName +'">' + escDisplayName +
                '</div>' + '<div class="timestamp">' + getCurrentTime(stamp) +
                '</div>' + '<div class="usermessage">' + message + '</div>' +
            '</div>';

        $('#chatconversation').append(messageContainer);
        $('#chatconversation').animate(
                { scrollTop: $('#chatconversation')[0].scrollHeight}, 1000);
    },

    /**
     * Appends error message to the conversation
     * @param errorMessage the received error message.
     * @param originalText the original message.
     */
    chatAddError (errorMessage, originalText) {
        errorMessage = UIUtil.escapeHtml(errorMessage);
        originalText = UIUtil.escapeHtml(originalText);

        $('#chatconversation').append(
            '<div class="errorMessage"><b>Error: </b>' + 'Your message' +
            (originalText? (' \"'+ originalText + '\"') : "") +
            ' was not sent.' +
            (errorMessage? (' Reason: ' + errorMessage) : '') +  '</div>');
        $('#chatconversation').animate(
            { scrollTop: $('#chatconversation')[0].scrollHeight}, 1000);
    },

    /**
     * Sets the subject to the UI
     * @param subject the subject
     */
    setSubject (subject) {
        if (subject) {
            subject = subject.trim();
        }
        $('#subject').html(linkify(UIUtil.escapeHtml(subject)));
        if (subject) {
            $("#subject").css({display: "block"});
        } else {
            $("#subject").css({display: "none"});
        }
    },

    /**
     * Sets the chat conversation mode.
     * @param {boolean} isConversationMode if chat should be in
     * conversation mode or not.
     */
    setChatConversationMode (isConversationMode) {
        $('#chatspace').toggleClass('is-conversation-mode', isConversationMode);
        if (isConversationMode) {
            $('#usermsg').focus();
        }
    },

    /**
     * Resizes the chat area.
     */
    resizeChat (width, height) {
        $('#chatspace').width(width).height(height);

        resizeChatConversation();
    },

    /**
     * Indicates if the chat is currently visible.
     */
    isVisible () {
        return UIUtil.isVisible(document.getElementById("chatspace"));
    },
    /**
     * Shows and hides the window with the smileys
     */
    toggleSmileys,

    /**
     * Scrolls chat to the bottom.
     */
    scrollChatToBottom () {
        setTimeout(function () {
            $('#chatconversation').scrollTop(
                $('#chatconversation')[0].scrollHeight);
        }, 5);
    }
};

export default Chat;
