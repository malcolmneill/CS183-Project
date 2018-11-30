# Here go your api methods.

#@auth.requires_signature()
def add_post():
    post_id = db.post.insert(
        post_title=request.vars.post_title,
        post_content=request.vars.post_content,
    )
    # We return the id of the new post, so we can insert it along all the others.
    return response.json(dict(post_id=post_id))

def get_post_list():
    results = []
    thumbs = db(db.thumb).select()

    test = dict(
       count = 0
    )


    #if auth.user is None:
        # Not logged in.
    rows = db().select(db.post.ALL, orderby=~db.post.post_time)
    for row in rows:
        results.append(dict(
            id=row.id,
            post_title=row.post_title,
            post_content=row.post_content,
            post_author=row.post_author,
            thumb = None,
            ))
    #else:
        # Logged in.
    #    thumbs = db(db.thumb).select()
    #    rows = db().select(db.post.ALL, db.thumb.ALL,
    #                        left=[
    #                            db.thumb.on((db.thumb.post_id == db.post.id) & (db.thumb.user_email == auth.user.email)),
    #                        ],
    #                        orderby=~db.post.post_time)
    #    for row in rows:
    #        results.append(dict(
    #            post_id=row.post.id,
    #            post_title=row.post.post_title,
    #            post_content=row.post.post_content,
    #            post_author=row.post.post_author,
    #            like_count = test['count']+1 if row.thumb.thumb_state == 'u' else test['count']-1 if row.thumb.thumb_state == 'd' else -0,
    #            thumb = None if row.thumb.id is None else row.thumb.thumb_state,

    #        ))


    # For homogeneity, we always return a dictionary.
    return response.json(dict(post_list=results))


#def get_like_count_on_post():
 #   likes = len(db((db.thumb.thumb_state == 'u')).select())
  #  dislikes = len(db((db.thumb.thumb_state == 'd')).select())

   # like_count = likes - dislikes
    #return response.json(dict(like_count=like_count))

@auth.requires_signature()
def set_thumb():
    print (request.vars.id);
    db.thumb.update_or_insert(((db.thumb.post_id == request.vars.id) & (db.thumb.user_email == auth.user.email)),
       post_id = request.vars.id,
       thumb_state=request.vars.thumb_state,
       user_email=auth.user.email
    )

    return "thumb update"

#get comments
def get_comments():
    print("getting some comments")
    comments = db(db.comments.post_id == request.vars.id).select()
    return response.json(dict(comments=comments))

#add a comment
def insert_comment():
    print("inserting a comment")
    u = get_user_email()
    id = db.comments.insert(
        post_id=request.vars.post_id,
        body=request.vars.body,
        user_email = u
    )
    return response.json(dict(id=id))

def edit_comment():
    print("editing a comment")
    #ADDED STUFF HERE
    u = get_user_email()
    #db.comments.update_or_insert(
     #  post_id=request.vars.post_id,
      # body = request.vars.body
    #)

def edit_post():
    print("editing a post")
    print(request.vars.id)
    print(request.vars.post_content)
    db.post.update_or_insert(
       id=request.vars.id,
       post_content = request.vars.post_content
    )
