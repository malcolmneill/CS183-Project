# Here go your api methods.
import time

@auth.requires_signature()
def add_post():
    post_id = db.post.insert(
        post_title=request.vars.post_title,
        post_content=request.vars.post_content,
        post_long=request.vars.post_long,
        post_lat=request.vars.post_lat,
    )
    # We return the id of the new post, so we can insert it along all the others.
    return response.json(dict(post_id=post_id))


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
def edit_content():
    if auth.user.email != request.vars.post_author:
        return "not authorized"
    else:
        db.post.update_or_insert((db.post.id == request.vars.id),
            post_id = request.vars.id,
            post_content = request.vars.post_content
        )
        return "done"

@auth.requires_signature()
def edit_comment():
    db.comments.update_or_insert((db.comments.id == request.vars.id),
        body = request.vars.body,
    )
    return "done"

def get_comments():
    comments = db(db.comments.post_id == request.vars.post_id).select()
    return response.json(dict(comments=comments))

def insert_comment():
    new_comment_id = db.comments.insert(
        post_id = request.vars.post_id,
        author= auth.user.email,
        body = request.vars.body,
        editingComments = False
    )
    return response.json(dict(new_comment_id=new_comment_id))

