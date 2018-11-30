// This is the js for the default/index.html view.
var app = function() {

    var self = {};

    Vue.config.silent = false; // show all warnings

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    // Enumerates an array.
    var enumerate = function(v) { var k=0; return v.map(function(e) {e._idx = k++;});};

    self.submit_post = function () {
        // We disable the button, to prevent double submission.
        $.web2py.disableElement($("#submit-post"));
        var sent_title = self.vue.form_title; // Makes a copy
        var sent_content = self.vue.form_content; //
        $.post(submit_post_url,
            // Data we are sending.
            {
                post_title: self.vue.form_title,
                post_content: self.vue.form_content
            },
            // What do we do when the post succeeds?
            function (data) {
                // Re-enable the button.
                $.web2py.enableElement($("#submit-post"));
                // Clears the form.
                self.vue.form_title = "";
                self.vue.form_content = "";
                // Adds the post to the list of posts.
                var new_post = {
                    id: data.post_id,
                    post_author: self.vue.user_email,
                    post_title: sent_title,
                    post_content: sent_content,
                    like: false,
                    dislike: false,
                    vote_count: 0,
                };
                self.vue.post_list.unshift(new_post);
                self.vue.add_post_visible = false;
                // We re-enumerate the array.
                self.process_posts();
            });
        // If you put code here, it is run BEFORE the call comes back.
    };

    self.submit_reply = function (post_idx) {
        // We disable the button, to prevent double submission.
        var p = self.vue.post_list[post_idx];
        $.web2py.disableElement($("#submit-reply"));
        var sent_content = self.vue.form_content; //
        $.post(submit_reply_url,
            // Data we are sending.
            {
                post_id: p.id,
                reply_content: self.vue.form_content,
            },
            // What do we do when the reply succeeds?
            function (data) {
                // Re-enable the button.
                $.web2py.enableElement($("#submit-reply"));
                // Clears the form.
                self.vue.form_content = "";
                // Adds the reply to the list of replys.
                var new_reply = {
                    id: data.reply_id,
                    post_id: p.id,
                    reply_author: self.vue.user_email,
                    reply_content: sent_content,
                };
                self.vue.reply_list.unshift(new_reply);
                p._add_reply_visible = false;
                // We re-enumerate the array.
                self.process_posts();
            });
        // If you put code here, it is run BEFORE the call comes back.
    };

    self.add_post = function () {
        self.vue.add_post_visible = !self.vue.add_post_visible;
        if (self.vue.add_post_visible) {
            self.vue.post_list.map(function (e) {
                e._add_reply_visible = false;
            });
        }
    };

    self.add_reply = function (post_idx) {
        var p = self.vue.post_list[post_idx];
        p._add_reply_visible = !p._add_reply_visible;
        if (p._add_reply_visible) {
            self.vue.add_post_visible = false;
            self.vue.post_list.map(function (e) {
                if (post_idx != e._idx)
                    e._add_reply_visible = false;
            });
        }

    };

    self.edit_post = function (post_idx) {
        var p = self.vue.post_list[post_idx];
        p._editing = !p._editing;
        if (!p._editing) {
            $.post(set_edit_content_url, {
                post_id: p.id,
                post_content: p.post_content,
            });
        }
    };

    self.edit_reply = function (reply_idx) {
        var r = self.vue.reply_list[reply_idx];
        r._editing = !r._editing;
        if (!r._editing) {
            $.post(set_edit_reply_content_url, {
                reply_id: r.id,
                reply_content: r.reply_content,
            });
        }
    };

    self.reply_list_toggle = function (post_idx) {
        var p = self.vue.post_list[post_idx];
        p._reply_list_visible = !p._reply_list_visible;
        if (p._reply_list_visible) {
            self.get_replies(post_idx);
        }
    };

    self.get_posts = function() {
        $.getJSON(get_post_list_url,
            function(data) {
                // I am assuming here that the server gives me a nice list
                // of posts, all ready for display.
                self.vue.post_list = data.post_list;
                // Post-processing.
                self.process_posts();
                // console.log("I got my list");
            }
        );
        // console.log("I fired the get");
    };

    self.get_replies = function(post_idx) {
        p = self.vue.post_list[post_idx];

        $.post(get_reply_list_url,
            // Data we are sending.
            {
                post_id: p.id,
            },
            function(data) {
                // I am assuming here that the server gives me a nice list
                // of posts, all ready for display.
                self.vue.reply_list = data.reply_list;
                // Post-processing.
                self.process_replies();
                // console.log("I got my list");
            }
        );
        // console.log("I fired the get");
    };

    self.process_posts = function() {
        // This function is used to post-process posts, after the list has been modified
        // or after we have gotten new posts.
        // We add the _idx attribute to the posts.
        enumerate(self.vue.post_list);
        // We initialize the smile status to match the like.
        self.vue.post_list.map(function (e) {
            // I need to use Vue.set here, because I am adding a new watched attribute
            // to an object.  See https://vuejs.org/v2/guide/list.html#Object-Change-Detection-Caveats
            // Did I like it?
            // If I do e._like = e.like, then Vue won't see the changes to e._like .
            Vue.set(e, 'post_content', e.post_content);

            Vue.set(e, '_like', e.like);
            Vue.set(e, '_dislike', e.dislike);
            Vue.set(e, '_original_like', e.like);
            Vue.set(e, '_original_dislike', e.dislike);

            Vue.set(e, '_original_vote_count', e.vote_count);
            Vue.set(e, '_vote', e.vote_count);

            Vue.set(e, '_editing', false);
            Vue.set(e, '_add_reply_visible', false);
            Vue.set(e, '_reply_list_visible', false);
        });
    };

    self.process_replies = function() {

        enumerate(self.vue.reply_list);

        self.vue.reply_list.map(function (e) {
            // I need to use Vue.set here, because I am adding a new watched attribute
            // to an object.  See https://vuejs.org/v2/guide/list.html#Object-Change-Detection-Caveats
            // Did I like it?
            // If I do e._like = e.like, then Vue won't see the changes to e._like .
            Vue.set(e, '_reply_content', e.reply_content);

            Vue.set(e, '_editing', false)
        });
    }

    self.get_user_email = function() {
        $.getJSON(get_user_email_url,
            function(data) {
                self.vue.user_email = data.user_email;
            }
        );
    };

    // Smile change code.
    self.like_mouseover = function (post_idx) {
        // When we mouse over something, the face has to assume the opposite
        // of the current state, to indicate the effect.
        var p = self.vue.post_list[post_idx];
        p._like = !p.like;
        if ((p.like == false) && p.dislike)
            p._dislike = false;
    };

    self.like_click = function (post_idx) {
        // The like status is toggled; the UI is not changed.
        var p = self.vue.post_list[post_idx];
        var templike = p.like;
        p.like = !p.like;

        if (p.like && p.dislike) {
            if(templike) {
                p.like = false;
            }
            else {
                p.dislike = false;
            }
        }

        self.vote_click(post_idx);
        // We need to post back the change to the server.
        $.post(set_like_url, {
            post_id: p.id,
            like: p.like,
        });
        $.post(set_dislike_url, {
            post_id: p.id,
            dislike: p.dislike,
        });
    };

    self.like_mouseout = function (post_idx) {
        // The like and smile status coincide again.
        var p = self.vue.post_list[post_idx];
        p._like = p.like;
        p._dislike = p.dislike;
    };

    // Smile change code.
    self.dislike_mouseover = function (post_idx) {
        // When we mouse over something, the face has to assume the opposite
        // of the current state, to indicate the effect.
        var p = self.vue.post_list[post_idx];
        if ((p.dislike == false) && p.like)
            p._like = false;
        p._dislike = !p.dislike;
    };

    self.dislike_click = function (post_idx) {
        // The like status is toggled; the UI is not changed.
        var p = self.vue.post_list[post_idx];
        var templike = p.dislike;
        p.dislike = !p.dislike;

        if (p.like && p.dislike) {
            if(templike) {
                p.dislike = false;
            }
            else {
                p.like = false;
            }
        }

        self.vote_click(post_idx);
        // We need to post back the change to the server.
        $.post(set_like_url, {
            post_id: p.id,
            like: p.like,
        });
        $.post(set_dislike_url, {
            post_id: p.id,
            dislike: p.dislike,
        });
    };

    self.dislike_mouseout = function (post_idx) {
        // The like and smile status coincide again.
        var p = self.vue.post_list[post_idx];
        p._like = p.like;
        p._dislike = p.dislike;
    };

    self.vote_click = function (post_idx) {
        var p = self.vue.post_list[post_idx];

        self.vote_handle(post_idx);

        p._vote = p.vote_count;

        $.post(get_post_list_url, {
            post_id: p.id,
            vote_count: p.vote_count,
        });
    };

    self.vote_handle = function (post_idx) {
        var p = self.vue.post_list[post_idx];

        if (p._original_like) {
            if (!(p.like && p.dislike))
                p.vote_count = p._original_vote_count - 1;
            if (p.like)
                p.vote_count = p._original_vote_count;
            if (p.dislike)
                p.vote_count = p._original_vote_count - 2;
        }
        else if (p._original_dislike){
            if (!(p.like && p.dislike))
                p.vote_count = p._original_vote_count + 1;
            if (p.like)
                p.vote_count = p._original_vote_count + 2;
            if (p.dislike)
                p.vote_count = p._original_vote_count;
        }
        else {
            if (!(p.like && p.dislike))
                p.vote_count = p._original_vote_count;
            if (p.like)
                p.vote_count = p._original_vote_count + 1;
            if (p.dislike)
                p.vote_count = p._original_vote_count - 1;
        }
    };

    // Complete as needed.
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            form_title: "",
            form_content: "",
            user_email: "",
            post_list: [],
            reply_list: [],
            add_post_visible: false,
        },
        methods: {
            get_user_email: self.get_user_email,

            submit_post: self.submit_post,
            add_post: self.add_post,
            edit_post: self.edit_post,

            reply_list_toggle: self.reply_list_toggle,
            submit_reply: self.submit_reply,
            add_reply: self.add_reply,
            edit_reply: self.edit_reply,
            // Likers.
            like_mouseover: self.like_mouseover,
            like_mouseout: self.like_mouseout,
            like_click: self.like_click,

            dislike_mouseover: self.dislike_mouseover,
            dislike_mouseout: self.dislike_mouseout,
            dislike_click: self.dislike_click,

            vote_count: self.vote_count,
            vote_handle: self.vote_handle,
        }

    });

    // If we are logged in, shows the form to add posts.
    if (is_logged_in) {
        $("#submit_post").show();
    }

    // Gets the posts.
    self.get_user_email();
    self.get_posts();
    //self.get_replies();

    return self;
};

var APP = null;

// No, this would evaluate it too soon.
// var APP = app();

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
