# Here go your api methods.


@auth.requires_signature()
def add_post():
    post_id = db.post.insert(
        post_title=request.vars.post_title,
        post_content=request.vars.post_content,
        post_long=request.vars.post_long,
        post_lat=request.vars.post_lat,
        post_image=request.vars.post_image,
    )
    # We return the id of the new post, so we can insert it along all the others.
    return response.json(dict(post_id=post_id))

def logged_in():
    if auth.user == None:
        return 0
    else:
        return 1

def get_post_list():
    if auth.user == None:
        return response.json(dict(post_list=[]))
    else:
        posts = db(db.post).select()
        thumbs = db(db.thumb).select()
        results = []

        for post in posts:
            post_to_send = dict(
                id=post.id,
                post_title=post.post_title,
                post_content=post.post_content,
                post_author=post.post_author,
                post_long=post.post_long,
                post_lat=post.post_lat,
                post_image=post.post_image,
                thumb_count=0,
                thumb= None
            )

            for thumb in thumbs:
                if thumb.post_id == post.id:
                    if thumb.user_email == auth.user.email:
                        post_to_send['thumb'] = thumb.thumb_state
                    if thumb.thumb_state == 'u':
                        post_to_send['thumb_count'] += 1
                    elif thumb.thumb_state=='d':
                        post_to_send['thumb_count'] -= 1
            results.append(post_to_send)
    print(results)
    # For homogeneity, we always return a dictionary.
    return response.json(dict(post_list=results))

def get_users_post_list():
    results = []
    if auth.user is None:
        # Not logged in.
        rows = db().select(db.post.ALL, orderby=~db.post.post_time)
        for row in rows:
            results.append(dict(
                id=row.id,
                post_title=row.post_title,
                post_content=row.post_content,
                post_author=row.post_author,
                post_date =row.post_date,
                post_long=row.post_long,
                post_lat=row.post_lat,
                post_image=row.post_image,
                thumb = None,
            ))
    else:
        # Logged in.
        #rows = db(db.post.post_author == auth.user.email).select()
        rows = db().select(db.post.post_author == auth.user.email)
        for row in rows:
            results.append(dict(
                id=row.post.id,
                post_title=row.post.post_title,
                post_content=row.post.post_content,
                post_author=row.post.post_author,
                post_date=row.post.post_date,
                post_long=row.post.post_long,
                post_lat=row.post.post_lat,
                post_image=row.post.post_image,
                thumb = None if row.thumb.id is None else row.thumb.thumb_state,
            ))
    # For homogeneity, we always return a dictionary.
    return response.json(dict(post_list=results))

def get_thumb_count_on_post():
    likes = len(db((db.thumb.post_id == request.vars.post_id) & (db.thumb.thumb_state == 'u')).select())
    dislikes = len(db((db.thumb.post_id == request.vars.post_id) & (db.thumb.thumb_state == 'd')).select())

    thumb_count = likes - dislikes
            
    return response.json(dict(thumb_count=thumb_count))
    
@auth.requires_signature()
def set_thumb():
    db.thumb.update_or_insert(((db.thumb.post_id == request.vars.id) & (db.thumb.user_email == auth.user.email)),
        post_id=request.vars.id,
        thumb_state=request.vars.thumb_state,
        user_email=auth.user.email
    )
    return "thumb updated!"

@auth.requires_signature()
def insert_comment():
    # in this function, we insert a comment into the database
    new_comment_id = db.comments.insert(
        post_id=request.vars.post_id,
        body=request.vars.body,
        editingComment=request.vars.editingComment,
    )
    # JavaScript needs the id of the comment that was just created so that it can pass it to the clickThumbs function
    return response.json(dict(new_comment_id=new_comment_id))

def get_comments():
    comments = db(db.comments.post_id == request.vars.id).select()
    return response.json(dict(comments=comments))

@auth.requires_signature()
def edit_post():
    db.post.update_or_insert((db.post.id == request.vars.id),
        post_id = request.vars.id,
        post_content = request.vars.post_content
    )
    return "done"

@auth.requires_signature()
def edit_comment():
    db.comments.update_or_insert((db.comments.id == request.vars.id),
        post_id = request.vars.post_id,
        body = request.vars.body
    )
    return "done"


def post_image():
    image_str = request.vars.image_url
    blog_post_id = int(request.vars.blog_post_id)
    # Normally, here I would have to check that the user can store the
    # image to the blog post, etc etc.
    image_id = db.my_images.update_or_insert(
        (db.my_images.blog_post_id == blog_post_id),
        blog_post_id = blog_post_id,
        image_str = image_str
    )
    return response.json(dict(image_id=image_id))

@auth.requires_signature()
def get_image():
    blog_post_id = int(request.vars.blog_post_id)
    r = db(db.my_images.blog_post_id == blog_post_id).select().first()
    image_str = None
    if r is not None:
        image_str = r.image_str
    return response.json(dict(image_str = image_str))

