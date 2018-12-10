// This is the js for the default/profile.html view.
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
    var enumerate = function(v) { 
        var k=0; return v.map(function(e) {
            e._idx = k++;
            // Set variables
            Vue.set(e, 'showComments', false);
            Vue.set(e, 'comments', []);
            Vue.set(e, 'addingComment', false);
            Vue.set(e, 'newComment', '');
            Vue.set(e, 'editingPost', false);
            Vue.set(e, 'isMine', false);
            Vue.set(e, 'editingComment', false);
        });
    };

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
        var sent_image = self.vue.file_input;
        console.log(sent_image);
        $.post(add_post_url,
            // Data we are sending.
            {
                post_title: self.vue.form_title,
                post_content: self.vue.form_content,
                post_long: self.vue.form_long,
                post_lat: self.vue.form_lat,
                post_image: self.vue.file_input
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
                    post_image: sent_image
                };
                self.vue.post_list.unshift(new_post);
                // We re-enumerate the array.
                self.process_posts();
            });
        // If you put code here, it is run BEFORE the call comes back.
    };

    self.edit_post = function (idx) {
        var post = self.vue.post_list[idx];
        var editedPost = {
            id: post.id,
            post_content: post.post_content
        };
        $.post(edit_post_url,
            // Data we are sending.
            editedPost,
            // What do we do when the post succeeds?
            function (data) {
                console.log('end of edit_post');
            });
        // If you put code here, it is run BEFORE the call comes back.
    };

    self.edit_comment = function (idx, cidx) {
        var comment = self.vue.post_list[idx].comments[cidx];
        var editedComment = {
            post_id: comment.post_id,
            body: comment.body,
            editingComment: comment.editingComment,
            id: comment.id
        };
        $.post(edit_comment_url,
            // Data we are sending.
            editedComment,
            // What do we do when the post succeeds?
            function (data) {
                console.log('end of edit_comment');
            });
        // If you put code here, it is run BEFORE the call comes back.
    };

    self.get_posts = function() {
        $.getJSON(get_post_list_url,
            function(data) {
                // I am assuming here that the server gives me a nice list
                // of posts, all ready for display.
                console.log(data.post_list.length);
                self.vue.post_list = data.post_list;
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
        for(var i = 0; i < self.vue.post_list.length; i++ ){
            self.isAuthor(self.vue.post_list[i]);
        }
        self.vue.post_list.map(function (e) {
            // I need to use Vue.set here, because I am adding a new watched attribute
            // to an object.  See https://vuejs.org/v2/guide/list.html#Object-Change-Detection-Caveats
            // The code below is commented out, as we don't have smiles any more. 
            // Replace it with the appropriate code for thumbs. 
            // // Did I like it? 
            // // If I do e._smile = e.like, then Vue won't see the changes to e._smile . 
            // Vue.set(e, '_smile', e.like); 
        });
    };


    self.isAuthor = function(post){
        $.get(isAuthorURL,{author: post.post_author}, function(response){
            if(response == 1){
                post.isMine = true;
                self.vue.num_posts ++;
            } else {
                post.isMine = false;
            }
            document.getElementById("insert").innerHTML = self.vue.num_posts + " posts";
        });
    }

    self.get_image = function () {
        $.getJSON(image_get_url,
            {
                blog_post_id: 1,
            },
            function (data) {
                self.vue.received_image = data.image_str;
            }
            )
    };

    self.upload_file = function (event, post_idx) {
        // This function is in charge of:
        // - Creating an image preview
        // - Uploading the image to GCS
        // - Calling another function to notify the server of the final image URL.

        var blog_post_id = post_idx; // TODO: you really have here to do something like:
        // post = self.vue.posts[post_idx];
        // var blog_post_id = post.id;

        // Reads the file.
        var input = event.target;
        var file = input.files[0];
        if (file) {
            // We want to read the image file, and transform it into a data URL.
            var reader = new FileReader();
            // We add a listener for the load event of the file reader.
            // The listener is called when loading terminates.
            // Once loading (the reader.readAsDataURL) terminates, we have
            // the data URL available.
            reader.addEventListener("load", function () {
                // An image can be represented as a data URL.
                // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
                // Here, we set the data URL of the image contained in the file to an image in the
                // HTML, causing the display of the file image.
                self.vue.img_url = reader.result;
                $.post(image_post_url, {
                    image_url: reader.result,
                    blog_post_id: blog_post_id // Placeholder for more useful info.
                });
            }, false);
            // Reads the file as a data URL. This triggers above event handler.
            reader.readAsDataURL(file);
        }
    };

    self.update_file = function (event){
        // Reads the file.
        var input = event.target;
        var file = input.files[0];
        if (file) {
            // We want to read the image file, and transform it into a data URL.
            var reader = new FileReader();
            // We add a listener for the load event of the file reader.
            // The listener is called when loading terminates.
            // Once loading (the reader.readAsDataURL) terminates, we have
            // the data URL available.
            reader.addEventListener("load", function () {
                // An image can be represented as a data URL.
                // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
                // Here, we set the data URL of the image contained in the file to an image in the
                // HTML, causing the display of the file image.
                self.vue.file_input = reader.result;
            }, false);
            // Reads the file as a data URL. This triggers above event handler.
            reader.readAsDataURL(file);
        }
    };

    self.open_uploader = function () {
        $("div#uploader_div").show();
        self.vue.is_uploading = true;
    };

    self.close_uploader = function () {
        $("div#uploader_div").hide();
        self.vue.is_uploading = false;
        $("input#file_input").val(""); // This clears the file choice once uploaded.

    };

    // Complete as needed.
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            form_title: "",
            form_content: "",
            form_lat: None,
            form_long: None,
            post_list: [],
            is_uploading: false,
            img_url: null,
            received_image: null,
            show_img: false,
            self_page: true, // Leave it to true, so initially you are looking at your own images.
            file_input: null,
            num_posts: 0
        },
        methods: {
            add_post: self.add_post,
            edit_post: self.edit_post,
            edit_comment: self.edit_comment,
            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,
            get_image: self.get_image,
            update_file: self.update_file,
            isAuthor: self.isAuthor
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
