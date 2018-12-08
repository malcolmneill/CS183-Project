// This is the js for the default/index.html view.
const None = undefined;
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

    
    self.getGeo = function(){
        
        if(navigator.geolocation){
            console.log("geo")
            navigator.geolocation.getCurrentPosition(function(position){
                console.log("in getCoords");
                self.vue.form_lat = position.coords.latitude;
                self.vue.form_long = position.coords.longitude;
                self.get_posts();
            });
        }else{
            console.log("not supported by browser");
        }
    }
    self.inRange = function(post){
        var R = 6371;
        
        var x1 = post.post_long;
        var x2 = self.vue.form_long;
        var y1 = post.post_lat;
        var y2 = self.vue.form_lat;
        var dLat = (y2-y1) * (Math.PI/180);
        var dLon = (x2-x1) * (Math.PI/180);
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(y1* (Math.PI/180)) * Math.cos(y2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
        return d; 
    }

    self.add_post = function () {
        // We disable the button, to prevent double submission.
        $.web2py.disableElement($("#add-post"));
        var sent_title = self.vue.form_title; // Makes a copy 
        var sent_content = self.vue.form_content; //
        var sent_long = self.vue.form_long;
        var sent_lat = self.vue.form_lat;
        console.log(sent_long);
        console.log(sent_lat);
       // if(typeof sent_long == 'string'|| sent_long instanceof String){
       //     sent_long = parseInt(sent_long, 10);
       // } 
       // if(typeof sent_lat == 'string'|| sent_lat instanceof String){
       //     sent_lat = parseInt(sent_lat, 10);
       // } 
        console.log("sent_long" + sent_long);
        $.post(add_post_url,
            // Data we are sending.
            {
                post_title: self.vue.form_title,
                post_content: self.vue.form_content,
                post_long: self.vue.form_long,
                post_lat: self.vue.form_lat
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
                    post_long: sent_long,
                    post_lat: sent_lat,
                };
                console.log(new_post)
                console.log(self.inRange(new_post));
                if(self.inRange(new_post) <= 5){
                    self.vue.post_list.unshift(new_post);
                }
                // We re-enumerate the array.
                self.process_posts();
            });
        // If you put code here, it is run BEFORE the call comes back.
    };


    self.get_posts = function() {
        $.getJSON(get_post_list_url,
            function(data) {
                // I am assuming here that the server gives me a nice list
                // of posts, all ready for display.
                //for(int i = 0; i < data.post_list.length)
                console.log(data.post_list.length);
                var tempPosts = [];
                var j = 0;
                for(var i = 0; i < data.post_list.length; i++ ){
                    if(self.inRange(data.post_list[i]) <= 10){
                        tempPosts[i - j] = data.post_list[i];
                    } else {
                        j++;
                    }
                }
                self.vue.post_list = tempPosts;
                // Post-processing.
                console.log(self.vue.post_list);
                self.process_posts();
                console.log("I got my list");
                
            }
        );
        console.log("I fired the get");
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
            // The code below is commented out, as we don't have smiles any more. 
            // Replace it with the appropriate code for thumbs. 
            // // Did I like it? 
            // // If I do e._smile = e.like, then Vue won't see the changes to e._smile . 
            // Vue.set(e, '_smile', e.like);
            Vue.set(e, '_thumb_state', e.thumb);
            Vue.set(e, '_thumbers', []);
            Vue.set(e, '_thumb_count', e.thumb_count);
            Vue.set(e, '_editing', false);
            Vue.set(e, '_sReply', false);
            Vue.set(e, '_addingReply', false);
            Vue.set(e, 'comments', []);
        });
    };

    self.toggle_form = function() {
        self.vue.showForm = !self.vue.showForm;
    };

    self.toggle_editing = function(post_idx){
        self.vue.post_list[post_idx]._editing = !self.vue.post_list[post_idx]._editing;
        console.log(self.vue.post_list[post_idx]._editing);
    };

    self.toggle_commenting = function(post_idx){
        self.vue.post_list[post_idx]._addingReply = !self.vue.post_list[post_idx]._addingReply;
        console.log(self.vue.post_list[post_idx]._addingReply);
    };

    self.showComments = function(post_idx){
        var id = self.vue.post_list[post_idx].id;
        self.vue.post_list[post_idx]._sReply = true;
        $.post(get_comments_url,{post_id: id}, function(response){
            self.vue.post_list[post_idx].comments = response.comments;
            console.log(response.comments)
        })
        console.log(self.vue.post_list[post_idx].comments);
        console.log(self.vue.post_list[post_idx]._sReply);
    };

    self.hideComments = function(post_idx){
        var p = self.vue.post_list[post_idx];
        p._sReply = false;
        console.log(p._sReply);
    };

    self.saveComment = function(post_idx){
        var p = self.vue.post_list[post_idx];
        var newComment = {
            post_id: p.id,
            body: p.newComment
        };
        $.post(insert_comments_url, newComment, function(response){
            newComment['id'] = response.new_comment_id;
            p.comments.push(newComment);
        })
    };

    self.toggleEditingComment = function(post_idx, commentIndex){
        self.vue.post_list[post_idx].comments[commentIndex].editingComment = !self.vue.post_list[post_idx].comments[commentIndex].editingComment;
        console.log(self.vue.post_list[post_idx].comments[commentIndex].editingComment)
    };

    self.saveEdit = function(post_idx){
        var p = self.vue.post_list[post_idx];
        console.log(p.post_content);
        $.post(edit_content_url, {id: p.id, post_content: p.post_content}, function(response){
                console.log("end of method");
            });
    };
    self.saveCommentEdit = function(post_idx, commentIndex){
        var com = self.vue.post_list[post_idx].comments[commentIndex];
        var editedCom = {
            post_id: com.post_id,
            body: com.body,
            editingComment: com.editingComment,
            id: com.id,
        }
        $.post(edit_comment_url, editedCom,function(response){
            console.log("end of method");
        })
    }

    self.thumb_mouseover = function (post_idx, newThumbState) {
        // When we mouse over something, the face has to assume the opposite
        // of the current state, to indicate the effect.
        var p = self.vue.post_list[post_idx];
        p._thumb_state = newThumbState;
    };

    self.thumb_mouseout = function (post_idx) {
        // The like and smile status coincide again.
        var p = self.vue.post_list[post_idx];
        p._thumb_state = p.thumb;
    };

    self.updateThumbCountOnScreen = function(idx, id) {
        var url = get_thumb_count_url;
        url += '?post_id=' +id; 
        $.post(url, function(response) {
            self.vue.post_list[idx].thumb_count = response.thumb_count;
            console.log(response)
        });
    };

    self.set_thumbclick = function(post_idx, newThumbState) {
        // The user has set this as the number of stars for the post.
        var p = self.vue.post_list[post_idx];
        var jsThumbValue = newThumbState;
        var pythonThumbValue = newThumbState;
        console.log(newThumbState);
        if(p.thumb == newThumbState){
            jsThumbValue = null;
            pythonThumbValue = None;
            p._thumb_state = None;
        }
        console.log(jsThumbValue)
        console.log(pythonThumbValue)

        p._thumb_state = jsThumbValue;
        p._thumb_count = p.thumb_count;
        p.thumb = jsThumbValue;
        $.post(set_thumb_url, {id: p.id, thumb_state: pythonThumbValue}, function(response){
            console.log("thumb set");
            self.updateThumbCountOnScreen(post_idx, p.id);
        });
    };

    // Complete as needed.
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            showForm: false,
            test: 'test string',
            form_title: "",
            form_content: "",
            form_long: None,
            form_lat: None,
            post_edit: "",
            post_list: [],
            thumb_indices: ['u','d','None'],
        },
        methods: {
            add_post: self.add_post,
            thumb_mouseover: self.thumb_mouseover,
            thumb_mouseout: self.thumb_mouseout,
            thumb_click: self.set_thumbclick,
            toggle_form: self.toggle_form,
            toggle_editing: self.toggle_editing,
            saveEdit: self.saveEdit,
            hideComments: self.hideComments,
            showComments: self.showComments,
            saveComment: self.saveComment,
            saveCommentEdit: self.saveCommentEdit,
            toggle_commenting: self.toggle_commenting,
            toggleEditingComment: self.toggleEditingComment,
        }

    });

    // If we are logged in, shows the form to add posts.
    if (is_logged_in) {
        $("#add_post").show();
    }
    
    // Gets the posts.
    
    self.getGeo();
    

    return self;
};

var APP = null;

// No, this would evaluate it too soon.
// var APP = app();

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});