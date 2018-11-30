// This is the js for the default/index.html view.
var app = function() {

    var self = {};
    const None = undefined;

    Vue.config.silent = false; // show all warnings

    // Extends an array
  /*  self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);

        }
    };*/

    // Enumerates an array.
    var enumerate = function(v) {
      var k=0; return v.map(function(e) {
        e._idx = k++;
        Vue.set(e, 'showComments', false);
        Vue.set(e, 'comments', []);
        Vue.set(e, 'addingComment', false);
        Vue.set(e, 'newComment', '');
        Vue.set(e, 'editedComment', 'blah');
        Vue.set(e, 'editedPost', 'test');

      });
    };

    //process posts
    self.process_posts = function() {
        enumerate(self.vue.post_list);
        self.vue.post_list.map(function (post) {
           Vue.set(post, 'hoverThumb', null);
        });
    };

     //on page load
     self.get_posts = function() {
        $.getJSON(get_post_list_url,
            function(data) {
                self.vue.post_list = data.post_list;
                self.process_posts();
            }
        );
    };

   //add post
    self.add_post = function () {
        $.web2py.disableElement($("#add-post"));
        var sent_title = self.vue.form_title; // Makes a copy
        var sent_content = self.vue.form_content; //
        $.post(add_post_url,
            // Data we are sending.
            {
                post_title: self.vue.form_title,
                post_content: self.vue.form_content
            },
            // What do we do when the post succeeds?
            function (data) {
                // Re-enable the button.
                $.web2py.enableElement($("#add-post"));
                // Clears the form.
                self.vue.form_title = "";
                self.vue.form_content = "";
                // Adds the post to the list of posts.
                var new_post = {
                    id: data.post_id,
                    post_title: sent_title,
                    post_content: sent_content,
                    like_count: 0
                };
                self.vue.post_list.unshift(new_post);
                // We re-enumerate the array.
                self.process_posts();
            });
        // If you put code here, it is run BEFORE the call comes back.
    };

    self.showComments = function(idx) {
      console.log("show");
      var id = self.vue.post_list[idx].id;
      var url = getCommentsUrl + '?id=' + id;
      self.vue.post_list[idx].showComments = true;
      $.post(url, function(response) {
        console.log(response);
        self.vue.post_list[idx].comments = response.comments;
      });
    };

    self.hideComments = function(idx) {
      console.log("hide");
      self.vue.post_list[idx].showComments = false;
    };

    self.toggleAddingComment = function(idx) {
      console.log("toggle");
      self.vue.post_list[idx].addingComment = !self.vue.post_list[idx].addingComment;
    };

    self.saveComment = function(idx) {
    // Your code goes here. Remember, we need to set the id of the new comment!
      $.post(insertCommentUrl, {
        post_id: self.vue.post_list[idx].id,
        body: self.vue.post_list[idx].newComment
      }, (response) => {
        self.vue.post_list[idx].comments.unshift({
            id: response.id,
            post_id: self.vue.post_list[idx].id,
            body: self.vue.post_list[idx].newComment
        });
      });
    };

    //edit a post
    self.editPost = function(idx){
      console.log("clicky click -- post edition");
      self.vue.is_post_editable = true;
    };

    //send post
    self.send_post = function(idx){
      self.vue.is_post_editable = false;
      console.log("sendy send -- post edition");

      /*$.post(editPostUrl, {
        post_id: self.vue.post_list[idx].id,
        content: self.vue.post_list[idx].editedPost
      }, (response) => {
        self.vue.post_list[idx].comments.unshift({
            id: response.id,
            post_id: self.vue.post_list[idx].id,
            content: self.vue.post_list[idx].editedPost
        });
        console.log(response.id);
        console.log(self.vue.post_list[idx].editedPost);
      });*/
    };



    //edit a comment
    self.editComment = function(idx){
      console.log("clicky click");
      self.vue.is_comment_editable = true;
      //self.vue.post_list.comments[idx].is_comment_editable = true;
      //self.send_comment();
    };

    self.send_comment = function(idx){
      self.vue.is_comment_editable = false;
      console.log("sendy send");
    }

    self.end_edit_comment = function(){
      self.vue.is_comment_editable = false;
      self.send_comment();
    }


    //update like count on screen
    var updateLikeCountOnScreen = function(idx, id){
       var url = get_like_count_url;
       console.log(url)
       url += '?post_id' +id;
       $.post(url, function(response){
          self.vue.post_list[idx].like_count = response.like_count;
       });
    };


    //mouse click
    self.thumb_click = function(post_idx, newThumbState){
       var jsThumbValue = newThumbState;
       var pythonThumbValue = newThumbState;
       if(self.vue.post_list[post_idx].thumb == newThumbState){
          jsThumbValue = null;
          pythonThumbValue = None;
       }
       console.log(self.vue.post_list[post_idx]);
       $.post(get_thumb_url, {id: self.vue.post_list[post_idx].post_id, thumb_state: pythonThumbValue}, function(data){
           self.vue.post_list[post_idx].thumb = jsThumbValue;
           updateLikeCountOnScreen(post_idx, self.vue.post_list[post_idx].post_id);
       });
    };

    //hover over posts
    self.thumb_mouseover = function(post_idx, newHoverThumbState){
       self.vue.post_list[post_idx].hoverThumb = newHoverThumbState;
    }

    //handle mouseout
    var thumb_mouseout = function(post_idx){
       self.vue.post_list[post_idx].hoverThumb = null;
    };


    // Complete as needed.
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            form_title: "",
            form_content: "",
            post_list: [],
            is_comment_editable: false,
            is_post_editable: false,
            comment_save_pending: false
        },
        methods: {
            add_post: self.add_post,
            thumb_mouseover: self.thumb_mouseover,
            thumb_mouseout: self.thumb_mouseout,
            thumb_click: self.thumb_click,
            showComments: self.showComments,
            hideComments: self.hideComments,
            toggleAddingComment: self.toggleAddingComment,
            saveComment: self.saveComment,
            send_comment: self.send_comment,
            editComment: self.editComment,
            end_edit_comment: self.end_edit_comment,
            send_post: self.send_post,
            editPost: self.editPost
        }

    });

    // If we are logged in, shows the form to add posts.
    /*if (is_logged_in) {
        $("#add_post").show();
    }*/

    // Gets the posts.
    self.get_posts();

    return self;
};

var APP = null;

// No, this would evaluate it too soon.
// var APP = app();

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
