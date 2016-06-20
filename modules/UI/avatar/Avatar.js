/* global MD5, config, interfaceConfig */

let users = {};

export default {
    /**
     * Sets prop in users object.
     * @param id {string} user id
     * @param prop {string} name of the prop
     * @param val {string} value to be set
     */
    _setUserProp: function (id, prop, val) {
        if(!val || (users[id] && users[id][prop] === val))
            return;
        if(!users[id])
            users[id] = {};
        users[id][prop] = val;
    },

    /**
     * Sets the user's avatar in the settings menu(if local user), contact list
     * and thumbnail
     * @param id id of the user
     * @param email email or nickname to be used as a hash
     */
    setUserEmail: function (id, email) {
        this._setUserProp(id, "email", email);
    },

    /**
     * Sets the user's avatar in the settings menu(if local user), contact list
     * and thumbnail
     * @param id id of the user
     * @param url the url for the avatar
     */
    setUserAvatarUrl: function (id, url) {
        this._setUserProp(id, "url", url);
    },

    /**
     * Returns the URL of the image for the avatar of a particular user,
     * identified by its id.
     * @param {string} userId user id
     */
    getAvatarUrl: function (userId) {
        if (config.disableThirdPartyRequests) {
            return 'images/avatar2.png';
        }

        if (!userId) {
            console.error("Get avatar - id is undefined");
            return null;
        }

        let avatarId = null;
        const user = users[userId];

        if(user) {
            if(user.url)
                return users[userId].url;

            avatarId = users[userId].email;
        }

        // If the ID looks like an email, we'll use gravatar.
        // Otherwise, it's a random avatar, and we'll use the configured
        // URL.
        let random = !avatarId || avatarId.indexOf('@') < 0;

        if (!avatarId) {
            console.warn(
                `No avatar stored yet for ${userId} - using ID as avatar ID`);
            avatarId = userId;
        }
        avatarId = MD5.hexdigest(avatarId.trim().toLowerCase());


        let urlPref = null;
        let urlSuf = null;
        if (!random) {
            urlPref = 'https://www.gravatar.com/avatar/';
            urlSuf = "?d=wavatar&size=200";
        }
        else if (random && interfaceConfig.RANDOM_AVATAR_URL_PREFIX) {
            urlPref = interfaceConfig.RANDOM_AVATAR_URL_PREFIX;
            urlSuf = interfaceConfig.RANDOM_AVATAR_URL_SUFFIX;
        }
        else {
            urlPref = 'https://robohash.org/';
            urlSuf = ".png?size=200x200";
        }

        return urlPref + avatarId + urlSuf;
    }
};
